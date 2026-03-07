/**
 * MBTI question system types.
 */

export type MbtiDimension = 'EI' | 'SN' | 'TF' | 'JP';

export interface MbtiQuestion {
  id: string;
  dimension: MbtiDimension;
  orderNum: number;
  content: string;
  optionA: string;
  optionB: string;
}

export interface MbtiAnswer {
  id: string;
  userId: string;
  questionId: string;
  answer: 'A' | 'B';
  createdAt: string;
}

export interface MbtiQuestionWithStatus extends MbtiQuestion {
  isUnlocked: boolean;
  userAnswer: 'A' | 'B' | null;
}

export interface MbtiProgress {
  questions: MbtiQuestionWithStatus[];
  answeredCount: number;
  totalCount: number;
  level: number;
  mbtiType: string | null;
}

export interface MbtiAnswerWithQuestion extends MbtiAnswer {
  dimension: MbtiDimension;
}
