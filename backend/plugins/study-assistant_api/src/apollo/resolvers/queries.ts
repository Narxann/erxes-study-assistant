import { problemsQueries } from '@/problems/graphql/resolvers/queries/problems';
import { IContext } from '~/connectionResolvers';

export const queries = {
  ...problemsQueries,
  studyAssistantLearningAttempts: (
    _parent: unknown,
    { grade }: { grade?: number },
    { models }: IContext,
  ) => models.LearningAttempts.getAttempts(grade),
};
