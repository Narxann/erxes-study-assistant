import { problemsMutations } from '@/problems/graphql/resolvers/mutations/problems';
import { checkSolution } from '../../trpc/check-solution';

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
};
