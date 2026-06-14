import globals from "globals";

const baseRules = {
  "no-debugger": "error",
  "no-dupe-args": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-self-assign": "error",
  "no-undef": "error",
  "no-unreachable": "error",
  "no-unreachable-loop": "error",
  "no-unsafe-finally": "error",
  "valid-typeof": "error",
};

export default [
  {
    ignores: [
      ".cache/**",
      "app.bundle.js",
      "assets/libs/**",
      "dist/**",
      "logs/**",
      "node_modules/**",
      "nuvio.env.js",
      "services/**/runtime/**",
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        __NUVIO_APP_VERSION__: "readonly",
        __magic__: "writable",
        qrcode: "readonly",
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: baseRules,
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: baseRules,
  },
  {
    files: ["scripts/**/*.cjs", "services/**/*.cjs", "services/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.commonjs,
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: baseRules,
  },
];
