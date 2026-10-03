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
  assessmentId?: string;
  title: string;
  subject: string;
  score: number | null;
  completed: boolean;
  completedAt?: string | null;
  attemptNumber?: number;
};

export type LearningAnswerInput = {
  questionId: string;
  question: string;
  studentAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
  points: number;
};

export type LearningAssessmentInput = {
  attemptId: string;
  assessmentId: string;
  title: string;
  subject: string;
  score: number | null;
  completedAt: string | null;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  answers: LearningAnswerInput[];
};

export type StudentLearningInput = {
  name: string;
  learningLevel: string;
  learningGoal: string | null;
  dailyMinutes: number;
  courses: LearningCourseInput[];
  exams: LearningExamInput[];
  assessmentHistory?: LearningAssessmentInput[];
};

export type LearningSignal = {
  type: "STRENGTH" | "WEAKNESS" | "RISK" | "PROGRESS" | "RECOMMENDATION";

  subject: string | null;
  value: number | null;
  confidence: number;
  reason: string;
};

export type DiagnosticPattern = {
  type:
    | "REPEATED_ERRORS"
    | "LOW_COMPLETION"
    | "STRONG_PERFORMANCE"
    | "INCONSISTENT_PERFORMANCE"
    | "INSUFFICIENT_EVIDENCE";

  subject: string | null;
  confidence: number;
  evidence: string;
};

export type SkillDiagnostic = {
  subject: string;
  skill: string;
  concept: string | null;
  questionIds: string[];
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  evidenceLevel: "DIRECT" | "INFERRED" | "INSUFFICIENT";
  confidence: number;
  status: "STRONG" | "DEVELOPING" | "NEEDS_REVIEW" | "INSUFFICIENT_EVIDENCE";
  reason: string;
};

export type LearningRecommendation = {
  priority: "HIGH" | "MEDIUM" | "LOW";

  type:
    | "REVIEW"
    | "PRACTICE"
    | "LEARN_NEW_LESSON"
    | "RETAKE_ASSESSMENT"
    | "CONTINUE";

  subject: string | null;
  title: string;
  reason: string;
  expectedOutcome: string;
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
    totalCompletedLessons: number;
    totalAssessmentAttempts: number;
  };

  strengths: LearningSignal[];
  weaknesses: LearningSignal[];
  risks: LearningSignal[];
  diagnosticPatterns: DiagnosticPattern[];
  skillDiagnostics: SkillDiagnostic[];
  recommendations: LearningRecommendation[];

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

  analysis: {
    summary: string;
    evidenceQuality: "HIGH" | "MEDIUM" | "LOW";
    confidence: number;
    language: "ar";
    limitations: string[];
  };

  generatedAt: string;
};

type SkillDefinition = {
  skill: string;
  concept: string | null;
  keywords: string[];
};

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .toLowerCase();
}

function confidenceFromEvidence(evidenceCount: number, base = 0.5) {
  if (evidenceCount <= 0) {
    return 0.25;
  }

  return Math.min(0.97, base + evidenceCount * 0.08);
}

function getCourseProgress(course: LearningCourseInput) {
  return clamp(course.progress);
}

function getCompletedAssessments(
  exams: LearningExamInput[],
  validAttemptIds?: Set<string>,
) {
  return exams.filter(
    (exam) =>
      exam.completed &&
      exam.score !== null &&
      (!validAttemptIds || validAttemptIds.has(exam.id)),
  );
}

function hasStudentAnswer(answer: LearningAnswerInput) {
  return answer.studentAnswer !== null && answer.studentAnswer.trim() !== "";
}

function hasActualEvidence(assessment: LearningAssessmentInput) {
  return assessment.answers.some(hasStudentAnswer);
}

function getEvidenceAssessments(assessments: LearningAssessmentInput[]) {
  return assessments.filter(hasActualEvidence);
}

function getAnsweredQuestions(assessments: LearningAssessmentInput[]) {
  return assessments.flatMap((assessment) =>
    assessment.answers.filter(hasStudentAnswer),
  );
}

function getQuestionAccuracy(answer: LearningAnswerInput) {
  const points = Math.max(1, answer.points);

  const awarded = Math.max(0, answer.pointsAwarded);

  if (answer.isCorrect) {
    return 100;
  }

  return clamp((awarded / points) * 100);
}

function getAnswerKey(answer: LearningAnswerInput) {
  return [answer.questionId, normalizeText(answer.question)].join("::");
}

function getAnswerSignature(answer: LearningAnswerInput) {
  return normalizeText(answer.studentAnswer);
}

function getQuestionLabel(answer: LearningAnswerInput) {
  const question = normalizeText(answer.question);

  if (!question) {
    return "السؤال غير المعروف";
  }

  if (question.length <= 120) {
    return question;
  }

  return `${question.slice(0, 117)}...`;
}

const SKILL_DEFINITIONS: Record<string, SkillDefinition[]> = {
  الرياضيات: [
    {
      skill: "الجمع",
      concept: "العمليات الحسابية الأساسية",
      keywords: ["جمع", "الجمع", "مجموع", "ناتج الجمع", "+"],
    },
    {
      skill: "الطرح",
      concept: "العمليات الحسابية الأساسية",
      keywords: ["طرح", "الطرح", "الفرق", "ناقص", "-"],
    },
    {
      skill: "الضرب",
      concept: "العمليات الحسابية الأساسية",
      keywords: ["ضرب", "الضرب", "حاصل الضرب", "في", "×", "x"],
    },
    {
      skill: "القسمة",
      concept: "العمليات الحسابية الأساسية",
      keywords: ["قسمة", "القسمة", "ناتج القسمة", "على", "÷"],
    },
    {
      skill: "الكسور",
      concept: "الأعداد والكسور",
      keywords: ["كسر", "الكسور", "بسط", "مقام", "نصف", "ثلث", "ربع"],
    },
    {
      skill: "النسب والتناسب",
      concept: "النسب والعلاقات الرياضية",
      keywords: ["نسبه", "النسب", "تناسب", "متناسب", "نسبة مئوية", "%"],
    },
    {
      skill: "المعادلات",
      concept: "الجبر",
      keywords: ["معادله", "المعادلات", "مجهول", "س", "ص", "حل المعادله"],
    },
    {
      skill: "الهندسة",
      concept: "الأشكال والقياس الهندسي",
      keywords: [
        "هندسه",
        "مثلث",
        "مربع",
        "مستطيل",
        "دائره",
        "محيط",
        "مساحه",
        "زاويه",
      ],
    },
    {
      skill: "القياس",
      concept: "القياس والوحدات",
      keywords: [
        "قياس",
        "طول",
        "وزن",
        "كتله",
        "حجم",
        "متر",
        "سنتيمتر",
        "كيلوجرام",
        "لتر",
      ],
    },
  ],

  العلوم: [
    {
      skill: "الخلية",
      concept: "علم الأحياء",
      keywords: ["خليه", "الخلية", "خلوي", "نواة", "غشاء", "السيتوبلازم"],
    },
    {
      skill: "الطاقة",
      concept: "الطاقة والتحولات",
      keywords: [
        "طاقه",
        "الطاقة",
        "حراريه",
        "حرارية",
        "كهربائيه",
        "كهربائية",
        "حركيه",
        "حركية",
      ],
    },
    {
      skill: "المادة",
      concept: "خصائص المادة وتحولاتها",
      keywords: [
        "ماده",
        "المادة",
        "صلب",
        "سائل",
        "غاز",
        "تبخر",
        "تكاثف",
        "انصهار",
      ],
    },
    {
      skill: "القوة والحركة",
      concept: "الفيزياء الأساسية",
      keywords: [
        "قوه",
        "القوة",
        "حركه",
        "الحركة",
        "سرعه",
        "السرعة",
        "تسارع",
        "احتكاك",
      ],
    },
    {
      skill: "الأنظمة الحيوية",
      concept: "علم الأحياء",
      keywords: [
        "جهاز هضمي",
        "جهاز تنفسي",
        "دوره دمويه",
        "القلب",
        "الرئتين",
        "جسم الانسان",
      ],
    },
    {
      skill: "البيئة",
      concept: "الأنظمة البيئية",
      keywords: [
        "بيئه",
        "البيئة",
        "نظام بيئي",
        "سلسله غذائيه",
        "سلسلة غذائية",
        "تلوث",
        "موارد",
      ],
    },
  ],

  "اللغة العربية": [
    {
      skill: "النحو",
      concept: "القواعد النحوية",
      keywords: [
        "نحو",
        "اعراب",
        "إعراب",
        "فاعل",
        "مفعول",
        "مبتدا",
        "خبر",
        "مبتدأ",
        "جمله اسميه",
        "جملة اسمية",
      ],
    },
    {
      skill: "الصرف",
      concept: "بنية الكلمة",
      keywords: [
        "صرف",
        "ميزان صرفي",
        "جذر",
        "مشتق",
        "اسم الفاعل",
        "اسم المفعول",
      ],
    },
    {
      skill: "القراءة والفهم",
      concept: "الفهم القرائي",
      keywords: [
        "اقرا",
        "اقرأ",
        "النص",
        "الفقره",
        "الفقرة",
        "يفهم",
        "الفكرة",
        "معنى النص",
        "المعني",
        "المعنى",
      ],
    },
    {
      skill: "الإملاء",
      concept: "الكتابة الصحيحة",
      keywords: [
        "املاء",
        "إملاء",
        "همزه",
        "همزة",
        "تنوين",
        "تاء مربوطه",
        "تاء مربوطة",
        "الف لينه",
        "ألف لينة",
      ],
    },
    {
      skill: "البلاغة",
      concept: "الأساليب البلاغية",
      keywords: [
        "بلاغه",
        "البلاغة",
        "تشبيه",
        "استعاره",
        "استعارة",
        "كنايه",
        "كناية",
        "طباق",
      ],
    },
  ],

  "اللغة الإنجليزية": [
    {
      skill: "Grammar",
      concept: "English grammar",
      keywords: [
        "grammar",
        "tense",
        "verb",
        "noun",
        "adjective",
        "pronoun",
        "sentence",
        "present",
        "past",
        "future",
        "do ",
        "does ",
        "did ",
      ],
    },
    {
      skill: "Vocabulary",
      concept: "English vocabulary",
      keywords: [
        "meaning",
        "word",
        "vocabulary",
        "synonym",
        "antonym",
        "means",
      ],
    },
    {
      skill: "Reading",
      concept: "Reading comprehension",
      keywords: [
        "read",
        "reading",
        "passage",
        "paragraph",
        "according to",
        "text",
        "main idea",
      ],
    },
    {
      skill: "Writing",
      concept: "English writing",
      keywords: [
        "write",
        "writing",
        "sentence",
        "essay",
        "paragraph",
        "correct sentence",
      ],
    },
  ],
};

function getSubjectDefinitions(subject: string) {
  const normalizedSubject = normalizeText(subject);

  const entry = Object.entries(SKILL_DEFINITIONS).find(
    ([key]) => normalizeText(key) === normalizedSubject,
  );

  return entry?.[1] ?? [];
}

function findSkillForQuestion(subject: string, question: string) {
  const normalizedQuestion = normalizeText(question);

  if (!normalizedQuestion) {
    return null;
  }

  const definitions = getSubjectDefinitions(subject);

  if (definitions.length === 0) {
    return null;
  }

  let best: {
    definition: SkillDefinition;
    matches: number;
  } | null = null;

  for (const definition of definitions) {
    const matches = definition.keywords.filter((keyword) =>
      normalizedQuestion.includes(normalizeText(keyword)),
    ).length;

    if (matches > 0 && (!best || matches > best.matches)) {
      best = {
        definition,
        matches,
      };
    }
  }

  return best?.definition ?? null;
}

function buildSkillDiagnostics(
  assessments: LearningAssessmentInput[],
): SkillDiagnostic[] {
  const evidenceAssessments = getEvidenceAssessments(assessments);

  if (evidenceAssessments.length === 0) {
    return [];
  }

  type SkillStats = {
    subject: string;
    skill: string;
    concept: string | null;
    questionIds: Set<string>;
    answeredQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
  };

  const statsMap = new Map<string, SkillStats>();

  for (const assessment of evidenceAssessments) {
    for (const answer of assessment.answers) {
      if (!hasStudentAnswer(answer)) {
        continue;
      }

      const definition = findSkillForQuestion(
        assessment.subject,
        answer.question,
      );

      if (!definition) {
        continue;
      }

      const key = [
        normalizeText(assessment.subject),
        normalizeText(definition.skill),
        normalizeText(definition.concept),
      ].join("::");

      const current = statsMap.get(key) ?? {
        subject: assessment.subject,
        skill: definition.skill,
        concept: definition.concept,
        questionIds: new Set<string>(),
        answeredQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
      };

      current.questionIds.add(answer.questionId);

      current.answeredQuestions += 1;

      if (answer.isCorrect) {
        current.correctAnswers += 1;
      } else {
        current.wrongAnswers += 1;
      }

      statsMap.set(key, current);
    }
  }

  return [...statsMap.values()]
    .map((stats): SkillDiagnostic => {
      const accuracy = Math.round(
        (stats.correctAnswers / Math.max(1, stats.answeredQuestions)) * 100,
      );

      let status: SkillDiagnostic["status"];

      if (stats.answeredQuestions < 2) {
        status = "INSUFFICIENT_EVIDENCE";
      } else if (accuracy >= 80) {
        status = "STRONG";
      } else if (accuracy >= 60) {
        status = "DEVELOPING";
      } else {
        status = "NEEDS_REVIEW";
      }

      const evidenceLevel: SkillDiagnostic["evidenceLevel"] =
        stats.answeredQuestions >= 2 ? "INFERRED" : "INSUFFICIENT";

      let reason: string;

      if (status === "STRONG") {
        reason = `الأدلة الحالية تشير إلى أداء جيد في مهارة ${stats.skill} ضمن ${stats.subject}، بدقة ${accuracy}% عبر ${stats.answeredQuestions} إجابات.`;
      } else if (status === "DEVELOPING") {
        reason = `الأداء في مهارة ${stats.skill} ضمن ${stats.subject} يبلغ ${accuracy}%، مما يشير إلى فهم موجود لكنه يحتاج إلى مزيد من التدريب والتحقق.`;
      } else if (status === "NEEDS_REVIEW") {
        reason = `الأداء في مهارة ${stats.skill} ضمن ${stats.subject} يبلغ ${accuracy}% فقط، وتوجد حاجة إلى مراجعة المهارة وتحليل الأخطاء المرتبطة بها.`;
      } else {
        reason = `تم ربط السؤال بمهارة ${stats.skill}، لكن كمية الأدلة الحالية غير كافية للحكم على مستوى الإتقان.`;
      }

      return {
        subject: stats.subject,
        skill: stats.skill,
        concept: stats.concept,
        questionIds: [...stats.questionIds],
        answeredQuestions: stats.answeredQuestions,
        correctAnswers: stats.correctAnswers,
        wrongAnswers: stats.wrongAnswers,
        accuracy,
        evidenceLevel,
        confidence:
          stats.answeredQuestions >= 2
            ? confidenceFromEvidence(stats.answeredQuestions, 0.48)
            : 0.35,
        status,
        reason,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);
}

function buildAssessmentPatterns(
  assessments: LearningAssessmentInput[],
): DiagnosticPattern[] {
  const patterns: DiagnosticPattern[] = [];

  const evidenceAssessments = getEvidenceAssessments(assessments);

  const bySubject = new Map<string, LearningAssessmentInput[]>();

  for (const assessment of evidenceAssessments) {
    const existing = bySubject.get(assessment.subject) ?? [];

    existing.push(assessment);
    bySubject.set(assessment.subject, existing);
  }

  for (const [subject, subjectAssessments] of bySubject.entries()) {
    const validScores = subjectAssessments
      .map((assessment) =>
        assessment.score === null ? null : clamp(assessment.score),
      )
      .filter((score): score is number => score !== null);

    const wrongAnswers = subjectAssessments.reduce(
      (total, assessment) =>
        total +
        assessment.answers
          .filter(hasStudentAnswer)
          .filter((answer) => !answer.isCorrect).length,
      0,
    );

    const answeredQuestions = subjectAssessments.reduce(
      (total, assessment) =>
        total + assessment.answers.filter(hasStudentAnswer).length,
      0,
    );

    const completed = subjectAssessments.filter(
      (assessment) => assessment.completedAt !== null,
    ).length;

    if (completed >= 2 && wrongAnswers >= 2) {
      patterns.push({
        type: "REPEATED_ERRORS",
        subject,
        confidence: confidenceFromEvidence(
          Math.min(completed, wrongAnswers),
          0.58,
        ),
        evidence: `ظهرت ${wrongAnswers} أخطاء عبر ${completed} محاولات تقييم فعلية في ${subject}. هذا دليل على تكرار الصعوبة عبر محاولات متعددة، لكنه لا يحدد وحده المفهوم المتسبب في الخطأ.`,
      });
    }

    if (validScores.length >= 2) {
      const ordered = [...subjectAssessments]
        .filter((assessment) => assessment.score !== null)
        .sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;

          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;

          return aTime - bTime;
        });

      const first = ordered[0]?.score ?? null;

      const latest = ordered[ordered.length - 1]?.score ?? null;

      if (first !== null && latest !== null && Math.abs(latest - first) >= 20) {
        patterns.push({
          type: "INCONSISTENT_PERFORMANCE",
          subject,
          confidence: confidenceFromEvidence(validScores.length, 0.55),
          evidence: `تغير أداء الطالب في ${subject} بمقدار ${Math.abs(
            latest - first,
          )} نقطة مئوية بين أول وآخر تقييم يحتوي على إجابات فعلية. هذا يشير إلى تغير في الأداء ويحتاج إلى أدلة إضافية لتحديد سببه.`,
        });
      }
    }

    if (validScores.length > 0 && validScores.every((score) => score >= 80)) {
      patterns.push({
        type: "STRONG_PERFORMANCE",
        subject,
        confidence: confidenceFromEvidence(validScores.length, 0.6),
        evidence: `جميع نتائج التقييمات التي تحتوي على إجابات فعلية في ${subject} بلغت 80% أو أكثر.`,
      });
    }

    if (completed === 0 && answeredQuestions === 0) {
      patterns.push({
        type: "INSUFFICIENT_EVIDENCE",
        subject,
        confidence: 0.8,
        evidence: `لا توجد أدلة تقييمية فعلية كافية في ${subject} لبناء تشخيص تفصيلي.`,
      });
    }
  }

  if (evidenceAssessments.length === 0) {
    patterns.push({
      type: "INSUFFICIENT_EVIDENCE",
      subject: null,
      confidence: 0.95,
      evidence:
        "لا توجد محاولات تقييم تحتوي على إجابات فعلية متاحة لبناء تشخيص تفصيلي للأخطاء.",
    });
  }

  return patterns;
}

function buildAnswerPatterns(
  assessments: LearningAssessmentInput[],
): DiagnosticPattern[] {
  const patterns: DiagnosticPattern[] = [];

  const evidenceAssessments = getEvidenceAssessments(assessments);

  const subjectStats = new Map<
    string,
    {
      answered: number;
      wrong: number;
      correct: number;
      partial: number;
    }
  >();

  for (const assessment of evidenceAssessments) {
    const current = subjectStats.get(assessment.subject) ?? {
      answered: 0,
      wrong: 0,
      correct: 0,
      partial: 0,
    };

    for (const answer of assessment.answers) {
      if (!hasStudentAnswer(answer)) {
        continue;
      }

      current.answered += 1;

      if (answer.isCorrect) {
        current.correct += 1;
      } else {
        current.wrong += 1;
      }

      if (!answer.isCorrect && getQuestionAccuracy(answer) > 0) {
        current.partial += 1;
      }
    }

    subjectStats.set(assessment.subject, current);
  }

  for (const [subject, stats] of subjectStats.entries()) {
    if (stats.answered >= 4 && stats.partial >= 2) {
      patterns.push({
        type: "INCONSISTENT_PERFORMANCE",
        subject,
        confidence: confidenceFromEvidence(stats.partial, 0.5),
        evidence: `توجد ${stats.partial} إجابات غير صحيحة حصل فيها الطالب على بعض النقاط، مما قد يشير إلى معرفة جزئية أو تطبيق غير مكتمل للمفهوم.`,
      });
    }
  }

  return patterns;
}

function buildQuestionLevelSignals(
  assessments: LearningAssessmentInput[],
): LearningSignal[] {
  const signals: LearningSignal[] = [];

  const evidenceAssessments = getEvidenceAssessments(assessments);

  const bySubject = new Map<
    string,
    {
      answers: number;
      wrong: number;
      correct: number;
      partial: number;
    }
  >();

  const questionAttempts = new Map<
    string,
    {
      subject: string;
      question: string;
      attempts: number;
      wrong: number;
      correct: number;
      studentAnswers: Set<string>;
    }
  >();

  for (const assessment of evidenceAssessments) {
    const subjectStats = bySubject.get(assessment.subject) ?? {
      answers: 0,
      wrong: 0,
      correct: 0,
      partial: 0,
    };

    for (const answer of assessment.answers) {
      if (!hasStudentAnswer(answer)) {
        continue;
      }

      subjectStats.answers += 1;

      if (answer.isCorrect) {
        subjectStats.correct += 1;
      } else {
        subjectStats.wrong += 1;
      }

      if (!answer.isCorrect && getQuestionAccuracy(answer) > 0) {
        subjectStats.partial += 1;
      }

      const key = getAnswerKey(answer);

      const question = questionAttempts.get(key) ?? {
        subject: assessment.subject,
        question: answer.question,
        attempts: 0,
        wrong: 0,
        correct: 0,
        studentAnswers: new Set<string>(),
      };

      question.attempts += 1;

      if (answer.isCorrect) {
        question.correct += 1;
      } else {
        question.wrong += 1;
      }

      const studentAnswer = getAnswerSignature(answer);

      if (studentAnswer) {
        question.studentAnswers.add(studentAnswer);
      }

      questionAttempts.set(key, question);
    }

    bySubject.set(assessment.subject, subjectStats);
  }

  for (const [subject, stats] of bySubject.entries()) {
    if (stats.answers < 2) {
      continue;
    }

    const accuracy = Math.round((stats.correct / stats.answers) * 100);

    if (accuracy < 60) {
      signals.push({
        type: "WEAKNESS",
        subject,
        value: accuracy,
        confidence: confidenceFromEvidence(stats.answers, 0.58),
        reason: `دقة الإجابات الفعلية المسجلة في ${subject} بلغت ${accuracy}% عبر ${stats.answers} إجابات. هذه إشارة مبنية على مستوى الإجابات الفردية وليست على درجة اختبار واحدة فقط.`,
      });
    } else if (accuracy >= 80) {
      signals.push({
        type: "STRENGTH",
        subject,
        value: accuracy,
        confidence: confidenceFromEvidence(stats.answers, 0.56),
        reason: `دقة الإجابات الفعلية المسجلة في ${subject} بلغت ${accuracy}% عبر ${stats.answers} إجابات، وهي إشارة إيجابية على الأداء الحالي.`,
      });
    } else if (stats.partial >= 2) {
      signals.push({
        type: "WEAKNESS",
        subject,
        value: accuracy,
        confidence: confidenceFromEvidence(stats.partial, 0.5),
        reason: `تظهر في ${subject} إجابات غير مكتملة أو جزئية؛ وهذا قد يشير إلى فهم غير ثابت أو تطبيق غير مكتمل، ويحتاج إلى تدريب إضافي للتحقق من السبب.`,
      });
    }
  }

  for (const stats of questionAttempts.values()) {
    if (stats.attempts >= 2 && stats.wrong === stats.attempts) {
      signals.push({
        type: "WEAKNESS",
        subject: stats.subject,
        value: 0,
        confidence: confidenceFromEvidence(stats.attempts, 0.62),
        reason: `السؤال "${getQuestionLabel({
          questionId: "",
          question: stats.question,
          studentAnswer: null,
          correctAnswer: null,
          isCorrect: false,
          pointsAwarded: 0,
          points: 1,
        })}" أُجيب عنه بشكل غير صحيح في جميع المحاولات الفعلية المتاحة (${stats.attempts} محاولات). هذا دليل على صعوبة مستمرة في هذا السؤال، لكنه لا يثبت وحده وجود مفهوم خاطئ محدد.`,
      });
    }
  }

  return signals;
}

function buildAnswerDiagnosticSignals(
  assessments: LearningAssessmentInput[],
): LearningSignal[] {
  const signals: LearningSignal[] = [];

  const evidenceAssessments = getEvidenceAssessments(assessments);

  const wrongAnswers = evidenceAssessments.flatMap((assessment) =>
    assessment.answers.filter(
      (answer) => hasStudentAnswer(answer) && !answer.isCorrect,
    ),
  );

  if (wrongAnswers.length === 0) {
    return signals;
  }

  const bySubject = new Map<string, LearningAnswerInput[]>();

  for (const assessment of evidenceAssessments) {
    const wrongAnswersForAssessment = assessment.answers.filter(
      (answer) => hasStudentAnswer(answer) && !answer.isCorrect,
    );

    if (wrongAnswersForAssessment.length === 0) {
      continue;
    }

    const existing = bySubject.get(assessment.subject) ?? [];

    existing.push(...wrongAnswersForAssessment);

    bySubject.set(assessment.subject, existing);
  }

  for (const [subject, answers] of bySubject.entries()) {
    const fullyWrong = answers.filter(
      (answer) => getQuestionAccuracy(answer) === 0,
    );

    const partial = answers.filter((answer) => getQuestionAccuracy(answer) > 0);

    if (answers.length >= 2 && fullyWrong.length === answers.length) {
      const questionTexts = answers
        .slice(0, 3)
        .map((answer) => `"${getQuestionLabel(answer)}"`)
        .join("، ");

      signals.push({
        type: "WEAKNESS",
        subject,
        value: 0,
        confidence: confidenceFromEvidence(answers.length, 0.55),
        reason: `تم تسجيل ${answers.length} إجابات غير صحيحة في ${subject}، منها أسئلة مثل ${questionTexts}. هذا يدل على وجود حاجة للمراجعة، لكنه لا يكفي وحده لتحديد المفهوم الخاطئ بدقة.`,
      });
    }

    if (partial.length >= 2) {
      signals.push({
        type: "WEAKNESS",
        subject,
        value: average(partial.map(getQuestionAccuracy)),
        confidence: confidenceFromEvidence(partial.length, 0.5),
        reason: `توجد ${partial.length} إجابات في ${subject} حصل فيها الطالب على جزء من النقاط رغم عدم اكتمال الإجابة. قد يشير ذلك إلى معرفة جزئية أو تطبيق غير مكتمل للمفهوم.`,
      });
    }
  }

  return signals;
}

function deduplicateSignals(signals: LearningSignal[]) {
  const map = new Map<string, LearningSignal>();

  for (const signal of signals) {
    const key = [signal.type, signal.subject, signal.value].join("::");

    const existing = map.get(key);

    if (!existing) {
      map.set(key, signal);
      continue;
    }

    if (signal.confidence > existing.confidence) {
      map.set(key, signal);
    }
  }

  return [...map.values()];
}

function deduplicatePatterns(patterns: DiagnosticPattern[]) {
  const map = new Map<string, DiagnosticPattern>();

  for (const pattern of patterns) {
    const key = [pattern.type, pattern.subject].join("::");

    const existing = map.get(key);

    if (!existing) {
      map.set(key, pattern);
      continue;
    }

    if (pattern.confidence > existing.confidence) {
      map.set(key, pattern);
    }
  }

  return [...map.values()];
}

function buildRecommendations(
  courses: LearningCourseInput[],
  exams: LearningExamInput[],
  patterns: DiagnosticPattern[],
  skillDiagnostics: SkillDiagnostic[],
): LearningRecommendation[] {
  const recommendations: LearningRecommendation[] = [];

  const completedExams = getCompletedAssessments(exams);

  const examBySubject = new Map<string, number[]>();

  for (const exam of completedExams) {
    if (exam.score === null) {
      continue;
    }

    const values = examBySubject.get(exam.subject) ?? [];

    values.push(clamp(exam.score));

    examBySubject.set(exam.subject, values);
  }

  const repeatedErrorSubjects = new Set(
    patterns
      .filter(
        (pattern) => pattern.type === "REPEATED_ERRORS" && pattern.subject,
      )
      .map((pattern) => pattern.subject as string),
  );

  const reviewSkillsBySubject = new Map<string, SkillDiagnostic[]>();

  for (const diagnostic of skillDiagnostics) {
    if (diagnostic.status !== "NEEDS_REVIEW") {
      continue;
    }

    const existing = reviewSkillsBySubject.get(diagnostic.subject) ?? [];

    existing.push(diagnostic);

    reviewSkillsBySubject.set(diagnostic.subject, existing);
  }

  for (const course of courses) {
    const progress = getCourseProgress(course);

    const scores = examBySubject.get(course.subject) ?? [];

    const averageScore = average(scores);

    const reviewSkills = reviewSkillsBySubject.get(course.subject) ?? [];

    if (reviewSkills.length > 0) {
      const skillNames = reviewSkills
        .slice(0, 3)
        .map((skill) => skill.skill)
        .join("، ");

      recommendations.push({
        priority: "HIGH",
        type: "REVIEW",
        subject: course.subject,
        title: `مراجعة مهارات ${course.subject}`,
        reason: `أظهرت الأدلة الحالية حاجة إلى مراجعة مهارات محددة في ${course.subject}، ومنها: ${skillNames}. مستوى الإشارة مبني على الإجابات الفعلية المرتبطة بالأسئلة.`,
        expectedOutcome:
          "رفع مستوى المهارات التي ظهرت فيها صعوبات والتحقق من الفهم بأسئلة جديدة.",
      });

      continue;
    }

    if (repeatedErrorSubjects.has(course.subject)) {
      recommendations.push({
        priority: "HIGH",
        type: "REVIEW",
        subject: course.subject,
        title: `تشخيص أخطاء ${course.subject}`,
        reason: `توجد أخطاء متكررة في الأدلة الفعلية المتاحة الخاصة بـ${course.subject} عبر محاولات تقييم متعددة. يجب مراجعة الأسئلة والمفاهيم المرتبطة بها قبل اعتبار المشكلة ضعفًا عامًا في المادة.`,
        expectedOutcome:
          "تحديد ما إذا كانت الأخطاء ناتجة عن ضعف مفهوم، أو تطبيق غير ثابت، أو نقص في التدريب.",
      });

      continue;
    }

    if (averageScore !== null && averageScore < 60) {
      recommendations.push({
        priority: "HIGH",
        type: "REVIEW",
        subject: course.subject,
        title: `مراجعة ${course.subject}`,
        reason: `متوسط أداء الطالب في تقييمات ${course.subject} التي تحتوي على محاولات فعلية يبلغ ${averageScore}%، لذلك توجد حاجة إلى مراجعة المفاهيم وتحليل الأخطاء قبل رفع مستوى الصعوبة.`,
        expectedOutcome:
          "رفع الفهم الأساسي وتقليل تكرار الأخطاء في التقييمات التالية.",
      });

      continue;
    }

    if (progress < 50) {
      recommendations.push({
        priority: "HIGH",
        type: "LEARN_NEW_LESSON",
        subject: course.subject,
        title: `استكمال مسار ${course.subject}`,
        reason: `نسبة إكمال ${course.subject} تبلغ ${progress}% فقط، لذلك تحتاج المادة إلى مزيد من التعلم قبل الحكم على مستوى الإتقان.`,
        expectedOutcome:
          "زيادة الأدلة التعليمية المتاحة للمحرك وتحسين تقدم الطالب في المادة.",
      });

      continue;
    }

    if (averageScore !== null && averageScore < 75) {
      recommendations.push({
        priority: "MEDIUM",
        type: "PRACTICE",
        subject: course.subject,
        title: `تدريب إضافي في ${course.subject}`,
        reason: `الأداء الحالي في ${course.subject} أقل من مستوى الإتقان المتوقع، لذلك يحتاج الطالب إلى تدريب إضافي.`,
        expectedOutcome:
          "تحويل المعرفة الحالية إلى أداء أكثر ثباتًا في الأسئلة الجديدة.",
      });

      continue;
    }

    if (progress >= 80 && (averageScore === null || averageScore >= 80)) {
      recommendations.push({
        priority: "LOW",
        type: "PRACTICE",
        subject: course.subject,
        title: `تدريبات تحدٍ في ${course.subject}`,
        reason: `المؤشرات الحالية في ${course.subject} إيجابية، ويمكن استخدام أسئلة أكثر تنوعًا للتحقق من ثبات الفهم.`,
        expectedOutcome:
          "اختبار قدرة الطالب على تطبيق المفهوم في مواقف وأسئلة جديدة.",
      });
    }
  }

  return recommendations;
}

function sortRecommendations(recommendations: LearningRecommendation[]) {
  const priorityOrder = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  return [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
}

function buildLearningSummary(
  courseProgress: number,
  examScore: number | null,
  evidenceAssessments: LearningAssessmentInput[],
  weaknesses: LearningSignal[],
  strengths: LearningSignal[],
  skillDiagnostics: SkillDiagnostic[],
) {
  if (examScore === null && evidenceAssessments.length === 0) {
    return `توجد بيانات عن تقدم الطالب في المقررات بمتوسط ${courseProgress}%، لكن لا توجد حاليًا تقييمات تحتوي على إجابات فعلية كافية لبناء حكم دقيق على الإتقان المعرفي.`;
  }

  const reviewSkills = skillDiagnostics.filter(
    (diagnostic) => diagnostic.status === "NEEDS_REVIEW",
  );

  if (reviewSkills.length > 0) {
    const firstSkill = reviewSkills[0];

    return `تشير الأدلة الحالية إلى تقدم دراسي قدره ${courseProgress}% ومتوسط نتائج التقييمات التي تحتوي على إجابات فعلية قدره ${examScore ?? 0}%. تظهر إشارة تحتاج إلى مراجعة مهارة ${firstSkill.skill} في ${firstSkill.subject}، مع التأكيد أن تحديد سبب الخطأ الدقيق يحتاج إلى أدلة إضافية.`;
  }

  if (examScore !== null && weaknesses.length === 0 && courseProgress >= 70) {
    return `تشير الأدلة الحالية إلى تقدم دراسي قدره ${courseProgress}% ومتوسط نتائج تقييم قدره ${examScore}%. توجد مؤشرات إيجابية في الأداء الحالي، مع استمرار الحاجة إلى جمع أدلة إضافية للتحقق من ثبات الفهم عبر أسئلة ومواقف متنوعة.`;
  }

  if (examScore !== null) {
    return `تشير الأدلة الحالية إلى تقدم دراسي قدره ${courseProgress}% ومتوسط نتائج التقييمات التي تحتوي على إجابات فعلية قدره ${examScore}%. تظهر إشارات تحتاج إلى مراجعة الإجابات وتحليل المهارات أو المفاهيم المحتملة قبل رفع مستوى الصعوبة.`;
  }

  if (strengths.length > 0) {
    return `توجد أدلة تعليمية أولية على تقدم الطالب، مع بعض الإشارات الإيجابية في الأداء. ما زالت هناك حاجة إلى تقييمات تحتوي على إجابات فعلية للحصول على تشخيص أكثر دقة للمهارات ونقاط الضعف.`;
  }

  return `توجد بيانات عن تقدم الطالب في المقررات بمتوسط ${courseProgress}%، لكن كمية الأدلة التفصيلية عن الإجابات ما زالت محدودة. يوصى بجمع مزيد من الأدلة قبل اتخاذ قرارات تكيفية قوية.`;
}

export function analyzeLearningState(
  input: StudentLearningInput,
): LearningState {
  const courses = input.courses ?? [];

  const exams = input.exams ?? [];

  const assessmentHistory = input.assessmentHistory ?? [];

  const evidenceAssessments = getEvidenceAssessments(assessmentHistory);

  const validAttemptIds = new Set(
    evidenceAssessments.map((assessment) => assessment.attemptId),
  );

  const courseProgress =
    average(courses.map((course) => getCourseProgress(course))) ?? 0;

  const completedExams = getCompletedAssessments(
    exams,
    assessmentHistory.length > 0 ? validAttemptIds : undefined,
  );

  const examScore = average(
    completedExams.map((exam) => clamp(exam.score ?? 0)),
  );

  const totalCompletedLessons = courses.reduce(
    (total, course) => total + Math.max(0, course.completedLessons),
    0,
  );

  let strengths: LearningSignal[] = [];

  let weaknesses: LearningSignal[] = [];

  const risks: LearningSignal[] = [];

  for (const course of courses) {
    const progress = getCourseProgress(course);

    if (progress >= 75) {
      strengths.push({
        type: "STRENGTH",
        subject: course.subject,
        value: progress,
        confidence: confidenceFromEvidence(course.completedLessons, 0.58),
        reason: `تقدم الطالب في ${course.subject} وصل إلى ${progress}%. هذه إشارة إيجابية على الاستمرارية، لكنها لا تثبت وحدها إتقان المفاهيم.`,
      });
    }

    if (progress < 50) {
      weaknesses.push({
        type: "WEAKNESS",
        subject: course.subject,
        value: progress,
        confidence: confidenceFromEvidence(
          Math.max(1, course.totalLessons - course.completedLessons),
          0.58,
        ),
        reason: `التقدم في ${course.subject} يبلغ ${progress}% فقط. الأدلة التعليمية المتاحة عن هذه المادة ما زالت محدودة نسبيًا.`,
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
        confidence: confidenceFromEvidence(exam.attemptNumber ?? 1, 0.62),
        reason: `حقق الطالب ${score}% في ${exam.title}. هذه نتيجة إيجابية في هذا التقييم، وتزداد قوة الدليل عند تكرار الأداء الجيد.`,
      });
    }

    if (score < 60) {
      weaknesses.push({
        type: "WEAKNESS",
        subject: exam.subject,
        value: score,
        confidence: confidenceFromEvidence(exam.attemptNumber ?? 1, 0.65),
        reason: `بلغت نتيجة ${exam.title} نسبة ${score}%. هذه إشارة إلى الحاجة لتحليل الإجابات والمفاهيم المرتبطة بالأسئلة غير الصحيحة.`,
      });
    }
  }

  const questionSignals = buildQuestionLevelSignals(evidenceAssessments);

  const answerDiagnosticSignals =
    buildAnswerDiagnosticSignals(evidenceAssessments);

  for (const signal of [...questionSignals, ...answerDiagnosticSignals]) {
    if (signal.type === "STRENGTH") {
      strengths.push(signal);
    }

    if (signal.type === "WEAKNESS") {
      weaknesses.push(signal);
    }
  }

  const skillDiagnostics = buildSkillDiagnostics(evidenceAssessments);

  for (const diagnostic of skillDiagnostics) {
    if (diagnostic.status === "STRONG") {
      strengths.push({
        type: "STRENGTH",
        subject: diagnostic.subject,
        value: diagnostic.accuracy,
        confidence: diagnostic.confidence,
        reason: diagnostic.reason,
      });
    }

    if (
      diagnostic.status === "NEEDS_REVIEW" &&
      diagnostic.answeredQuestions >= 2
    ) {
      weaknesses.push({
        type: "WEAKNESS",
        subject: diagnostic.subject,
        value: diagnostic.accuracy,
        confidence: diagnostic.confidence,
        reason: diagnostic.reason,
      });
    }
  }

  if (courseProgress < 40) {
    risks.push({
      type: "RISK",
      subject: null,
      value: courseProgress,
      confidence: 0.86,
      reason:
        "متوسط تقدم المقررات منخفض حاليًا، مما يقلل كمية الأدلة التعليمية المتاحة لبناء نموذج دقيق عن مستوى الطالب.",
    });
  }

  if (examScore !== null && examScore < 60) {
    risks.push({
      type: "RISK",
      subject: null,
      value: examScore,
      confidence: 0.91,
      reason:
        "متوسط نتائج الاختبارات التي تحتوي على محاولات فعلية منخفض نسبيًا، لذلك ينبغي تحليل الإجابات والمفاهيم المرتبطة بالأخطاء قبل الانتقال إلى محتوى أكثر صعوبة.",
    });
  }

  strengths = deduplicateSignals(strengths);

  weaknesses = deduplicateSignals(weaknesses);

  const diagnosticPatterns = deduplicatePatterns([
    ...buildAssessmentPatterns(evidenceAssessments),
    ...buildAnswerPatterns(evidenceAssessments),
  ]);

  const recommendations = sortRecommendations(
    buildRecommendations(
      courses,
      completedExams,
      diagnosticPatterns,
      skillDiagnostics,
    ),
  );

  const weakestCourse =
    [...courses].sort((a, b) => a.progress - b.progress)[0] ?? null;

  const strongestCourse =
    [...courses].sort((a, b) => b.progress - a.progress)[0] ?? null;

  let recommendedAction: LearningState["recommendedAction"];

  const highPriority = recommendations.find(
    (recommendation) => recommendation.priority === "HIGH",
  );

  if (highPriority) {
    recommendedAction = {
      type: highPriority.type,
      subject: highPriority.subject,
      reason: highPriority.reason,
    };
  } else if (weakestCourse && weakestCourse.progress < 70) {
    recommendedAction = {
      type: "LEARN_NEW_LESSON",
      subject: weakestCourse.subject,
      reason: `التقدم في ${weakestCourse.subject} هو الأقل بين المقررات الحالية، لذلك تحتاج هذه المادة إلى مزيد من التعلم والأدلة قبل الانتقال إلى مستوى أعلى.`,
    };
  } else if (strongestCourse && strongestCourse.progress >= 80) {
    recommendedAction = {
      type: "PRACTICE",
      subject: strongestCourse.subject,
      reason: `المؤشرات الحالية في ${strongestCourse.subject} إيجابية، ويمكن الانتقال إلى تدريبات أكثر تحديًا للتحقق من عمق الفهم.`,
    };
  } else {
    recommendedAction = {
      type: "CONTINUE",
      subject: null,
      reason:
        "الأدلة الحالية لا تستدعي تغيير المسار بشكل حاد. يوصى بالاستمرار وجمع أدلة تعليمية إضافية قبل اتخاذ قرار تكيفي أقوى.",
    };
  }

  let evidenceQuality: LearningState["analysis"]["evidenceQuality"] = "LOW";

  const totalAnswers = getAnsweredQuestions(evidenceAssessments).length;

  if (
    evidenceAssessments.length >= 3 &&
    totalCompletedLessons >= 3 &&
    totalAnswers >= 8
  ) {
    evidenceQuality = "HIGH";
  } else if (
    evidenceAssessments.length >= 1 ||
    totalCompletedLessons >= 1 ||
    totalAnswers >= 1
  ) {
    evidenceQuality = "MEDIUM";
  }

  const analysisConfidence =
    evidenceQuality === "HIGH"
      ? 0.86
      : evidenceQuality === "MEDIUM"
        ? 0.68
        : 0.42;

  const summary = buildLearningSummary(
    courseProgress,
    examScore,
    evidenceAssessments,
    weaknesses,
    strengths,
    skillDiagnostics,
  );

  return {
    learner: {
      name: input.name,
      level: input.learningLevel,
      goal: input.learningGoal ?? "تحسين المستوى الدراسي",
      dailyMinutes: input.dailyMinutes,
    },

    overall: {
      courseProgress,
      examScore,
      completedExams: completedExams.length,
      totalCourses: courses.length,
      totalCompletedLessons,
      totalAssessmentAttempts: evidenceAssessments.length,
    },

    strengths,
    weaknesses,
    risks,
    diagnosticPatterns,
    skillDiagnostics,
    recommendations,
    recommendedAction,

    analysis: {
      summary,
      evidenceQuality,
      confidence: analysisConfidence,
      language: "ar",

      limitations: [
        "التحليل الحالي قائم على البيانات التعليمية المسجلة داخل المنصة.",
        "المحاولات التي لا تحتوي على إجابات فعلية لا تدخل في الأدلة المستخدمة للتحليل.",
        "تعدد الأخطاء داخل محاولة واحدة لا يُصنف كتكرار للأخطاء عبر المحاولات.",
        "تكرار الخطأ في السؤال نفسه عبر محاولات فعلية متعددة يعتبر إشارة إلى صعوبة مستمرة، لكنه لا يثبت وحده نوع المفهوم الخاطئ.",
        "ربط السؤال بالمهارة أو المفهوم في هذه المرحلة يعتمد على إشارات مباشرة من نص السؤال وقاعدة معرفة أولية، وليس على فهم لغوي عميق.",
        "المهارة أو المفهوم الذي يتم استنتاجه من صياغة السؤال يعتبر إشارة تحليلية وليس حقيقة تعليمية مؤكدة.",
        "لا يتم استنتاج مفهوم خاطئ محدد من إجابة واحدة دون وجود أدلة كافية.",
        "تحليل الإجابات الحالية يعتمد على بيانات السؤال والإجابة والتصحيح المتاحة.",
        "التحليل الدلالي العميق لإجابات الطالب النصية يحتاج إلى نموذج لغوي متخصص يتم ربطه بطبقة الأدلة الحالية.",
        "النتائج الحالية لا تمثل قياسًا معياريًا لمستوى الطالب.",
      ],
    },

    generatedAt: new Date().toISOString(),
  };
}
