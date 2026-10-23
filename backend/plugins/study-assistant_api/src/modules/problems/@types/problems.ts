import { Document } from 'mongoose';

export interface IProblems {
  name?: string;
}

export interface IProblemsDocument extends IProblems, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
