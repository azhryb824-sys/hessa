import { prisma } from "@/lib/db/prisma";
import {
  analyzeLearningState,
  type LearningAssessmentInput,
  type StudentLearningInput,
} from "@/lib/ai/learning-engine";
import { NextResponse } from "next/server";

function parseOptions(options: string | null): string[] {
  if (!options) {
    return [];
  }

  try {
    const parsed = JSON.parse(options);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch {
    return options
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function hasStudentAnswer(
  answer: {
    studentAnswer: string | null;
  }
): boolean {
  return (
    answer.studentAnswer !== null &&
    answer.studentAnswer.trim() !== ""
  );
}

export async function GET() {
  try {
    const student = await prisma.user.findUnique({
      where: {
        email: "student@hessa.local",
      },

      include: {
        studentProfile: true,

        enrollments: {
          include: {
            course: {
              include: {
                lessons: {
                  orderBy: {
                    order: "asc",
                  },

                  include: {
                    progress: true,
                  },
                },
              },
            },
          },
        },

        attempts: {
          orderBy: {
            completedAt: "desc",
          },

          include: {
            assessment: {
              include: {
                questions: {
                  select: {
                    id: true,
                    question: true,
                    options: true,
                    correctAnswer: true,
                    points: true,
                  },
                },
              },
            },

            answers: {
              select: {
                questionId: true,
                studentAnswer: true,
                correctAnswer: true,
                isCorrect: true,
                pointsAwarded: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const profile = student.studentProfile;

    const courses = student.enrollments.map(
      (enrollment) => {
        const lessons = enrollment.course.lessons;

        const completedLessons = lessons.filter(
          (lesson) =>
            lesson.progress.some(
              (progress) =>
                progress.userId === student.id &&
                progress.completed
            )
        ).length;

        const calculatedProgress =
          lessons.length > 0
            ? Math.round(
                (completedLessons / lessons.length) * 100
              )
            : 0;

        return {
          id: enrollment.course.id,

          title: enrollment.course.title,

          subject: enrollment.course.subject,

          progress:
            enrollment.progress ?? calculatedProgress,

          completedLessons,

          totalLessons: lessons.length,
        };
      }
    );

    /*
     * Calculate attempt numbers chronologically.
     *
     * AssessmentAttempt does not contain createdAt in the
     * current Prisma schema, so completedAt is used when
     * available. The original database ordering is preserved
     * for attempts without completedAt.
     */
    const attemptsByAssessment =
      new Map<string, number>();

    const chronologicalAttempts =
      [...student.attempts].sort((a, b) => {
        const aTime = a.completedAt?.getTime() ?? 0;
        const bTime = b.completedAt?.getTime() ?? 0;

        return aTime - bTime;
      });

    const attemptNumbers =
      new Map<string, number>();

    for (const attempt of chronologicalAttempts) {
      const previous =
        attemptsByAssessment.get(
          attempt.assessment.id
        ) ?? 0;

      const attemptNumber =
        previous + 1;

      attemptsByAssessment.set(
        attempt.assessment.id,
        attemptNumber
      );

      attemptNumbers.set(
        attempt.id,
        attemptNumber
      );
    }

    const assessmentHistory: LearningAssessmentInput[] =
      student.attempts.map((attempt) => {
        const subject =
          student.enrollments.find(
            (enrollment) =>
              enrollment.course.id ===
              attempt.assessment.courseId
          )?.course.subject ?? "عام";

        /*
         * Only answers containing an actual student response
         * are considered learning evidence.
         */
        const answeredRecords =
          attempt.answers.filter(
            hasStudentAnswer
          );

        const answers =
          answeredRecords.map(
            (answer) => {
              const question =
                attempt.assessment.questions.find(
                  (item) =>
                    item.id ===
                    answer.questionId
                );

              return {
                questionId:
                  answer.questionId,

                question:
                  question?.question ??
                  "سؤال غير معروف",

                studentAnswer:
                  answer.studentAnswer,

                correctAnswer:
                  answer.correctAnswer ??
                  question?.correctAnswer ??
                  null,

                isCorrect:
                  answer.isCorrect,

                pointsAwarded:
                  answer.pointsAwarded,

                points:
                  question?.points ?? 1,
              };
            }
          );

        return {
          attemptId:
            attempt.id,

          assessmentId:
            attempt.assessment.id,

          title:
            attempt.assessment.title,

          subject,

          score:
            attempt.score,

          completedAt:
            attempt.completedAt
              ? attempt.completedAt.toISOString()
              : null,

          totalQuestions:
            attempt.assessment.questions.length,

          answeredQuestions:
            answers.length,

          correctAnswers:
            answers.filter(
              (answer) =>
                answer.isCorrect
            ).length,

          wrongAnswers:
            answers.filter(
              (answer) =>
                !answer.isCorrect
            ).length,

          answers,
        };
      });

    /*
     * Each exam is identified by the unique attempt ID.
     * This prevents multiple attempts of the same assessment
     * from being treated as one exam.
     */
    const exams =
      assessmentHistory.map(
        (attempt) => ({
          id:
            attempt.attemptId,

          title:
            attempt.title,

          subject:
            attempt.subject,

          score:
            attempt.score,

          completed:
            attempt.completedAt !== null,

          completedAt:
            attempt.completedAt,

          attemptNumber:
            attemptNumbers.get(
              attempt.attemptId
            ) ?? 1,
        })
      );

    const learningInput:
      StudentLearningInput = {
      name:
        student.name,

      learningLevel:
        profile?.learningLevel ??
        "BEGINNER",

      learningGoal:
        profile?.learningGoal ??
        null,

      dailyMinutes:
        profile?.dailyMinutes ??
        30,

      courses,

      exams,

      assessmentHistory,
    };

    const learningState =
      analyzeLearningState(
        learningInput
      );

    const completedLessons =
      student.enrollments.flatMap(
        (enrollment) =>
          enrollment.course.lessons
            .filter((lesson) =>
              lesson.progress.some(
                (progress) =>
                  progress.userId ===
                    student.id &&
                  progress.completed
              )
            )
            .map((lesson) => ({
              courseId:
                enrollment.course.id,

              subject:
                enrollment.course.subject,

              lessonId:
                lesson.id,

              title:
                lesson.title,

              order:
                lesson.order,

              duration:
                lesson.duration,
            }))
      );

    const detailedAssessmentHistory =
      student.attempts.map(
        (attempt) => {
          const subject =
            student.enrollments.find(
              (enrollment) =>
                enrollment.course.id ===
                attempt.assessment.courseId
            )?.course.subject ??
            "عام";

          /*
           * Only real student answers are exposed
           * as learning evidence.
           */
          const answeredRecords =
            attempt.answers.filter(
              hasStudentAnswer
            );

          const answers =
            answeredRecords.map(
              (answer) => {
                const question =
                  attempt.assessment.questions.find(
                    (item) =>
                      item.id ===
                      answer.questionId
                  );

                return {
                  questionId:
                    answer.questionId,

                  question:
                    question?.question ??
                    "",

                  options:
                    parseOptions(
                      question?.options ??
                        null
                    ),

                  studentAnswer:
                    answer.studentAnswer,

                  correctAnswer:
                    answer.correctAnswer ??
                    question?.correctAnswer ??
                    null,

                  isCorrect:
                    answer.isCorrect,

                  pointsAwarded:
                    answer.pointsAwarded,

                  points:
                    question?.points ??
                    1,
                };
              }
            );

          return {
            attemptId:
              attempt.id,

            assessmentId:
              attempt.assessment.id,

            title:
              attempt.assessment.title,

            subject,

            completedAt:
              attempt.completedAt,

            score:
              attempt.score,

            totalQuestions:
              attempt.assessment.questions.length,

            answeredQuestions:
              answers.length,

            correctAnswers:
              answers.filter(
                (answer) =>
                  answer.isCorrect
              ).length,

            wrongAnswers:
              answers.filter(
                (answer) =>
                  !answer.isCorrect
              ).length,

            answers,
          };
        }
      );

    const response = {
      success: true,

      engine: {
        name:
          "Hessa AI Education Engine",

        version:
          "0.3.0",

        mode:
          "evidence-based-learning-analysis",

        capabilities: [
          "student-profile-analysis",
          "course-progress-analysis",
          "assessment-analysis",
          "answer-pattern-analysis",
          "repeated-error-detection",
          "learning-risk-detection",
          "adaptive-recommendations",
          "arabic-learning-analysis",
          "evidence-confidence",
        ],
      },

      student: {
        id:
          student.id,

        name:
          student.name,

        learningLevel:
          learningInput.learningLevel,

        learningGoal:
          learningInput.learningGoal,

        dailyMinutes:
          learningInput.dailyMinutes,
      },

      learningState,

      courses,

      completedLessons,

      assessmentHistory:
        detailedAssessmentHistory,

      metadata: {
        totalCourses:
          courses.length,

        totalCompletedLessons:
          completedLessons.length,

        totalAssessmentAttempts:
          detailedAssessmentHistory.length,

        totalAnsweredQuestions:
          detailedAssessmentHistory.reduce(
            (total, attempt) =>
              total +
              attempt.answeredQuestions,
            0
          ),

        totalCorrectAnswers:
          detailedAssessmentHistory.reduce(
            (total, attempt) =>
              total +
              attempt.correctAnswers,
            0
          ),

        totalWrongAnswers:
          detailedAssessmentHistory.reduce(
            (total, attempt) =>
              total +
              attempt.wrongAnswers,
            0
          ),

        generatedAt:
          new Date().toISOString(),
      },
    };

    return new NextResponse(
      JSON.stringify(response),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json; charset=utf-8",

          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "AI learning analysis error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json; charset=utf-8",
        },
      }
    );
  }
}