import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { problemsSchema } from '@/problems/db/definitions/problems';
import { IProblems, IProblemsDocument } from '@/problems/@types/problems';

export interface IProblemsModel extends Model<IProblemsDocument> {
  getProblems(_id: string): Promise<IProblemsDocument>;
  getProblemss(): Promise<IProblemsDocument[]>;
  createProblems(doc: IProblems): Promise<IProblemsDocument>;
  updateProblems(_id: string, doc: IProblems): Promise<IProblemsDocument>;
  removeProblems(ProblemsId: string): Promise<{  ok: number }>;
}

export const loadProblemsClass = (models: IModels) => {
  class Problems {
    /**
     * Retrieves study-assistant
     */
    public static async getProblems(_id: string) {
      const Problems = await models.Problems.findOne({ _id }).lean();

      if (!Problems) {
        throw new Error('Problems not found');
      }

      return Problems;
    }

    /**
     * Retrieves all study-assistants
     */
    public static async getProblemss(): Promise<IProblemsDocument[]> {
      return models.Problems.find().lean();
    }

    /**
     * Create a study-assistant
     */
    public static async createProblems(doc: IProblems): Promise<IProblemsDocument> {
      return models.Problems.create(doc);
    }

    /*
     * Update study-assistant
     */
    public static async updateProblems(_id: string, doc: IProblems) {
      return await models.Problems.findOneAndUpdate(
        { _id },
        { $set: { ...doc } },
      );
    }

    /**
     * Remove study-assistant
     */
    public static async removeProblems(ProblemsId: string[]) {
      return models.Problems.deleteOne({ _id: { $in: ProblemsId } });
    }
  }

  problemsSchema.loadClass(Problems);

  return problemsSchema;
};
