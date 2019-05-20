module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/test/.*\\.test\\.tsx?)$',
  collectCoverageFrom: ['src/**/*.tsx?']
}
