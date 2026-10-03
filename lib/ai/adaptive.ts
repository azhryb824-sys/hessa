type Evidence = {
  attemptId: string;
  completedAt: string | null;
  answers: { questionId: string; isCorrect: boolean }[];
};
// Beta(1,1) posterior with recency weighting; repeated questions do not inflate evidence count.
export function adaptiveEvidence(history: Evidence[], now = Date.now()) {
  const latest = new Map<string, { correct: boolean; weight: number }>();
  for (const attempt of history.slice().reverse())
    for (const answer of attempt.answers) {
      const timestamp = attempt.completedAt
        ? new Date(attempt.completedAt).getTime()
        : now;
      const age = Number.isFinite(timestamp)
        ? Math.max(0, (now - timestamp) / 86400000)
        : 0;
      latest.set(answer.questionId, {
        correct: answer.isCorrect,
        weight: Math.exp(-age / 60),
      });
    }
  let alpha = 1,
    beta = 1;
  for (const value of latest.values()) {
    if (value.correct) alpha += value.weight;
    else beta += value.weight;
  }
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  return {
    version: "0.4.0",
    method: "recency-weighted-beta",
    uniqueQuestions: latest.size,
    mastery: latest.size ? Math.round(mean * 100) : null,
    uncertainty: Math.round(Math.sqrt(variance) * 100),
    evidenceLevel:
      latest.size < 5
        ? "INSUFFICIENT"
        : latest.size < 15
          ? "DEVELOPING"
          : "ESTABLISHED",
    note:
      latest.size < 5
        ? "الأدلة محدودة؛ يلزم أسئلة متنوعة قبل الحكم على المستوى"
        : "تقدير تعليمي يحتاج متابعة، وليس تشخيصًا نهائيًا",
  };
}
