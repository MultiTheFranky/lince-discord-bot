module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "prettier", // Prettier modules must go last.
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts", ".tsx"],
      },
    },
  },
  ignorePatterns: [
    "/dist/**/*", // Ignore built files.
  ],
  plugins: ["@typescript-eslint", "unicorn", "import", "prettier"],
  rules: {
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        ts: "never",
        tsx: "never",
      },
    ],
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
    "no-unused-vars": "error",
    "react/jsx-filename-extension": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: true,
        optionalDependencies: false,
        peerDependencies: false,
        packageDir: __dirname,
      },
    ],
  },
  ignorePatterns: ["dist/**"],
};
