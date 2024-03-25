module.exports = {
  //   preset: "@shelf/jest-mongodb",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  //   testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
};
