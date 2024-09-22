/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  collectCoverage: false,
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
}
