

module.exports = {
  extends: [
    "@commitlint/config-conventional",
  ],
  parserPreset: "conventional-changelog-conventionalcommits",
  rules: {
    "header-max-length": [2, "always", "100"],
    "type-enum": [
      2,
      "always",
      ["BREAKING", "chore", "ci", "feat", "fix", "refactor", "revert"],
    ],
  },
};
