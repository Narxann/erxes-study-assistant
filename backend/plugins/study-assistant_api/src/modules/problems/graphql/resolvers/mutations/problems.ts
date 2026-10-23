
  import { IContext } from '~/connectionResolvers';

  export const problemsMutations = {
    createProblems: async (_parent: undefined, { name }, { models }: IContext) => {
      return models.Problems.createProblems({name});
    },

    updateProblems: async (_parent: undefined, { _id, name }, { models }: IContext) => {
      return models.Problems.updateProblems(_id, {name});
    },

    removeProblems: async (_parent: undefined, { _id }, { models }: IContext) => {
      return models.Problems.removeProblems(_id);
    },
  };

