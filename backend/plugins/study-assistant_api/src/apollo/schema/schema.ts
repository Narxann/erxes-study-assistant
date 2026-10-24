import {
  mutations as ProblemsMutations,
  queries as ProblemsQueries,
  types as ProblemsTypes,
} from '@/problems/graphql/schemas/problems';

export const types = `
  type StudyAssistantSolution {
    source: String!
    recognized: String!
    topic: String!
    answer: String!
    hint: String!
    concept: String!
    steps: [String!]!
    practice: String!
    practiceAnswer: String!
    confidence: Float!
  }

  type StudyAssistantLearningAttempt {
    _id: String!
    grade: Int!
    problem: String!
    imageReference: String
    recognized: String
    topic: String
    answer: String
    steps: [String!]!
    hint: String
    practice: String
    practiceAnswer: String
    source: String!
    createdAt: Date
  }

  ${ProblemsTypes}

  type StudyAssistantCheckResult {
    correct: Boolean!
    firstErrorStep: Int
    expectedAnswer: Float
    explanation: String!
    errorType: String
    errorTitle: String
    correction: String
    correctedStep: String
    nextExercise: String
  }
`;

export const queries = `
  studyAssistantLearningAttempts(grade: Int): [StudyAssistantLearningAttempt!]!
  ${ProblemsQueries}
`;

export const mutations = `
  studyAssistantSolve(
    grade: Int!
    problem: String
    imageData: String
    imageReference: String
  ): StudyAssistantSolution!
  ${ProblemsMutations}

  studyAssistantCheckSolution(
    problem: String!
    steps: [String!]!
  ): StudyAssistantCheckResult!
`;
