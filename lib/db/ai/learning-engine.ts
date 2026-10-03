export type LearningCourseInput = {
  id: string;
  title: string;
  subject: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
};

export type LearningExamInput = {
  id: string;
  title: string;
  subject: string;
  score: number | null;
  completed: boolean;
};

export type StudentLearningInput = {
  name: string;
  learningLevel: string;
  learningGoal: string | null;
  dailyMinutes: number;
  courses: LearningCourseInput[];
  exams: LearningExamInput[];
};

export type LearningSignal = {
  type:
    | "STRENGTH"
    | "WEAKNESS"
    | "RISK"
    | "PROGRESS"
    | "RECOMMENDATION";
  subject: string | null;
  value: number | null;
  confidence: number;
  reason: string;
};

export type LearningState = {
  learner: {
    name: string;
    level: string;
    goal: string;
    dailyMinutes: number;
  };

  overall: {
    courseProgress: number;
    examScore: number | null;
    completedExams: number;
    totalCourses: number;
  };

  strengths: LearningSignal[];
  weaknesses: LearningSignal[];
  risks: LearningSignal[];

  recommendedAction: {
    type:
      | "LEARN_NEW_LESSON"
      | "REVIEW"
      | "PRACTICE"
      | "RETAKE_ASSESSMENT"
      | "CONTINUE";
    subject: string | null;
    reason: string;
  };

  generatedAt: string;
};

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) /
      values.length
  );
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

export function analyzeLearningState(
  input: StudentLearningInput
): LearningState {
  const courses = input.courses ?? [];
  const exams = input.exams ?? [];

  const courseProgress = average(
    courses.map((course) => clamp(course.progress))
  ) ?? 0;

  const completedExams = exams.filter(
    (exam) => exam.completed && exam.score !== null
  );

  const examScore = average(
    completedExams.map((exam) =>
      clamp(exam.score ?? 0)
    )
  );

  const strengths: LearningSignal[] = [];
  const weaknesses: LearningSignal[] = [];
  const risks: LearningSignal[] = [];

  for (const course of courses) {
    const progress = clamp(course.progress);

    if (progress >= 75) {
      strengths.push({
        type: "STRENGTH",
        subject: course.subject,
        value: progress,
        confidence: Math.min(
          0.95,
          0.55 + progress / 200
        ),
        reason:
          `تقدم الطالب في ${course.subject} وصل إلى ${progress}%، ` +
          "وهو مؤشر على وجود تقدم مستقر في هذا المسار.",
      });
    }

    if (progress < 50) {
      weaknesses.push({
        type: "WEAKNESS",
        subject: course.subject,
        value: progress,
        confidence: Math.min(
          0.95,
          0.65 + (50 - progress) / 100
        ),
        reason:
          `التقدم في ${course.subject} يبلغ ${progress}% فقط، ` +
          "لذلك توجد فجوة تعلم تستحق المتابعة.",
      });
    }
  }

  for (const exam of completedExams) {
    const score = clamp(exam.score ?? 0);

    if (score >= 80) {
      strengths.push({
        type: "STRENGTH",
        subject: exam.subject,
        value: score,
        confidence: Math.min(
          0.95,
          0.65 + score / 300
        ),
        reason:
          `حقق الطالب ${score}% في ${exam.title}، ` +
          "وهذا يعطي إشارة إيجابية عن إتقانه الحالي للمادة.",
      });
    }

    if (score < 60) {
      weaknesses.push({
        type: "WEAKNESS",
        subject: exam.subject,
        value: score,
        confidence: Math.min(
          0.98,
          0.7 + (60 - score) / 100
        ),
        reason:
          `نتيجة ${exam.title} بلغت ${score}%، ` +
          "وتشير إلى الحاجة إلى تحليل الأخطاء ومراجعة المفاهيم المرتبطة.",
      });
    }
  }

  if (courseProgress < 40) {
    risks.push({
      type: "RISK",
      subject: null,
      value: courseProgress,
      confidence: 0.82,
      reason:
        "متوسط تقدم المقررات منخفض حاليًا، وقد يحتاج الطالب إلى مسار تعلم أكثر انتظامًا.",
    });
  }

  if (
    examScore !== null &&
    examScore < 60
  ) {
    risks.push({
      type: "RISK",
      subject: null,
      value: examScore,
      confidence: 0.9,
      reason:
        "متوسط نتائج الاختبارات يشير إلى وجود فجوات معرفية تحتاج إلى تشخيص قبل الانتقال السريع إلى محتوى أصعب.",
    });
  }

  const weakestCourse =
    [...courses].sort(
      (a, b) => a.progress - b.progress
    )[0] ?? null;

  const strongestCourse =
    [...courses].sort(
      (a, b) => b.progress - a.progress
    )[0] ?? null;

  let recommendedAction: LearningState["recommendedAction"];

  if (
    examScore !== null &&
    examScore < 60 &&
    weakestCourse
  ) {
    recommendedAction = {
      type: "REVIEW",
      subject: weakestCourse.subject,
      reason:
        `قبل إضافة محتوى جديد، يوصى بمراجعة ${weakestCourse.subject} ` +
        "وتحليل الأخطاء التي ظهرت في التقييمات.",
    };
  } else if (
    weakestCourse &&
    weakestCourse.progress < 70
  ) {
    recommendedAction = {
      type: "LEARN_NEW_LESSON",
      subject: weakestCourse.subject,
      reason:
        `التقدم في ${weakestCourse.subject} هو الأقل بين المقررات الحالية، ` +
        "لذلك المسار المقترح يعطي هذه المادة أولوية.",
    };
  } else if (
    strongestCourse &&
    strongestCourse.progress >= 80
  ) {
    recommendedAction = {
      type: "PRACTICE",
      subject: strongestCourse.subject,
      reason:
        `التقدم في ${strongestCourse.subject} جيد، ` +
        "لذلك يمكن استخدام تدريبات أكثر تحديًا للتحقق من عمق الفهم.",
    };
  } else {
    recommendedAction = {
      type: "CONTINUE",
      subject: null,
      reason:
        "بيانات التعلم الحالية تسمح باستمرار المسار مع مراقبة الأداء الجديد.",
    };
  }

  return {
    learner: {
      name: input.name,
      level: input.learningLevel,
      goal:
        input.learningGoal ||
        "تحسين المستوى الدراسي",
      dailyMinutes: input.dailyMinutes,
    },

    overall: {
      courseProgress,
      examScore,
      completedExams: completedExams.length,
      totalCourses: courses.length,
    },

    strengths,
    weaknesses,
    risks,

    recommendedAction,

    generatedAt: new Date().toISOString(),
  };
}