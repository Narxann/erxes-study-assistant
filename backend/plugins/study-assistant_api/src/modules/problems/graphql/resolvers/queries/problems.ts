
  import { IContext } from '~/connectionResolvers';

   export const problemsQueries = {
    getProblems: async (_parent: unknown, { _id }: { _id: string }, { models }: IContext) => {
      return models.Problems.getProblems(_id);
    },
    
    getProblemss: async (_parent: unknown, _args: Record<string, never>, { models }: IContext) => {
      return models.Problems.getProblemss();
    },
  };
