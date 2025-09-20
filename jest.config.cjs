const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

/**
 * @type {import('jest').Config}
 */
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^react$": "<rootDir>/node_modules/react/index.js",
    "^react/jsx-runtime$": "<rootDir>/node_modules/react/jsx-runtime.js",
    "^react/jsx-dev-runtime$": "<rootDir>/node_modules/react/jsx-dev-runtime.js",
    "^react-dom$": "<rootDir>/node_modules/react-dom/index.js",
    "^react-dom/client$": "<rootDir>/node_modules/react-dom/client.js",
  },
  testMatch: ["<rootDir>/**/*.spec.{ts,tsx}", "<rootDir>/**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/.next/", "<rootDir>/node_modules/"],
  testEnvironmentOptions: {
    customExportConditions: ["default", "react-server", "node"],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "<rootDir>/**/*.{ts,tsx}",
    "!<rootDir>/.next/**",
    "!<rootDir>/node_modules/**",
    "!<rootDir>/**/?(*.)+(stories|spec|test).{ts,tsx}",
    "!<rootDir>/jest.setup.ts",
    "!<rootDir>/**/__tests__/fixtures/**",
    "!<rootDir>/**/*.d.ts",
  ],
}

module.exports = createJestConfig(customJestConfig)
