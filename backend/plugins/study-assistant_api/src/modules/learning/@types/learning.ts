import { Document } from 'mongoose';

export interface ILearningAttempt {
  grade: number;
  problem: string;
  imageReference?: string;
  recognized?: string;
  topic?: string;
  answer?: string;
  steps?: string[];
  hint?: string;
  practice?: string;
  source: 'gemini' | 'demo';
}

export interface ILearningAttemptDocument extends ILearningAttempt, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
