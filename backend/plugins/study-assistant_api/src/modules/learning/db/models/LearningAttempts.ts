import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { ILearningAttempt, ILearningAttemptDocument } from '@/learning/@types/learning';
import { learningAttemptSchema } from '@/learning/db/definitions/learningAttempts';

export interface ILearningAttemptsModel extends Model<ILearningAttemptDocument> {
  createAttempt(doc: ILearningAttempt): Promise<ILearningAttemptDocument>;
  getAttempts(grade?: number): Promise<ILearningAttemptDocument[]>;
}

export const loadLearningAttemptsClass = (models: IModels) => {
  class LearningAttempts {
    public static createAttempt(doc: ILearningAttempt) {
      return models.LearningAttempts.create(doc);
    }

    public static getAttempts(grade?: number) {
      return models.LearningAttempts.find(grade ? { grade } : {})
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    }
  }

  learningAttemptSchema.loadClass(LearningAttempts);
  return learningAttemptSchema;
};
