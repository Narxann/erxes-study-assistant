export const types = `
  type Problems {
    _id: String
    name: String
    description: String
  }
`;

export const queries = `
  getProblems(_id: String!): Problems
  getProblemss: [Problems]
`;

export const mutations = `
  createProblems(name: String!): Problems
  updateProblems(_id: String!, name: String!): Problems
  removeProblems(_id: String!): Problems
`;
