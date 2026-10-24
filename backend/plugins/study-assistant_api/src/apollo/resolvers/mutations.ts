import { problemsMutations } from '@/problems/graphql/resolvers/mutations/problems';
import { checkSolution } from '../../trpc/check-solution';
import { solveWithGemini } from '~/learning';
import { IContext } from '~/connectionResolvers';

export const mutations = {
  ...problemsMutations,

  studyAssistantCheckSolution: (
    _root: unknown,
    args: {
      problem: string;
      steps: string[];
    },
  ) => {
    return checkSolution(args.problem, args.steps);
  },

  studyAssistantSolve: async (
    _parent: unknown,
    args: {
      grade: number;
      problem?: string;
      imageData?: string;
      imageReference?: string;
    },
    { models }: IContext,
  ) => {
    if (!Number.isInteger(args.grade) || args.grade < 1 || args.grade > 12) {
      throw new Error('Анги 1-12 хооронд байх ёстой.');
    }
    if (!args.problem?.trim() && !args.imageData) {
      throw new Error('Бодлого эсвэл зураг оруулна уу.');
    }
    const solution = await solveWithGemini(args.problem?.trim() || '', args.grade, args.imageData);
    await models.LearningAttempts.createAttempt({
      grade: args.grade,
      problem: args.problem?.trim() || solution.recognized,
      imageReference: args.imageReference,
      ...solution,
    });
    return { ...solution, concept: `${solution.topic}: ${solution.hint}` };
  },
};
