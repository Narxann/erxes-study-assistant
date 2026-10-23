import {
  mutations as ProblemsMutations,
  queries as ProblemsQueries,
  types as ProblemsTypes,
} from '@/problems/graphql/schemas/problems';

export const types = `
  ${ProblemsTypes}

  type StudyAssistantCheckResult {
    correct: Boolean!
    firstErrorStep: Int
    expectedAnswer: Float
    explanation: String!
  }
`;

export const queries = `
  ${ProblemsQueries}
`;

export const mutations = `
  ${ProblemsMutations}

  studyAssistantCheckSolution(
    problem: String!
    steps: [String!]!
  ): StudyAssistantCheckResult!
`;
