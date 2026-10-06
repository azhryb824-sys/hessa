export type HessaSubject = "MATH" | "SCIENCE" | "ARABIC" | "ENGLISH" | "GENERAL";
export type LearnerStage = "EARLY_CHILD" | "PRIMARY" | "INTERMEDIATE" | "SECONDARY" | "ADULT";
export type StudentState = { studentId?: string; age?: number; grade?: string; learningLevel?: string; learningGoal?: string | null; weaknesses?: string[]; strengths?: string[]; preferredDialect?: "saudi" | "msa"; };
export type ConversationTurn={role:"user"|"assistant";content:string};
export type RetrievalDocument = { id: string; title: string; content: string; subject?: string; grade?: string; source?: string; };
export type TutorRequest = { message: string; subject?: string; lessonTitle?: string; student?: StudentState; retrievedContext?: RetrievalDocument[]; history?:ConversationTurn[]; };
export type VerificationResult = { verified: boolean; confidence: number; method: string; expectedAnswer?: string; issues: string[]; };
export type TutorResponse = { success: true; engine: "Hessa AI Core"; version: "1.0.0"; subject: HessaSubject; stage: LearnerStage; answer: string; verification: VerificationResult; context: { documentIds: string[]; grounded: boolean }; pedagogy: { maxSteps: number; language: "ar"; dialect: "saudi" | "msa"; rules: string[] }; metadata: { generatedAt: string; provider: string } };