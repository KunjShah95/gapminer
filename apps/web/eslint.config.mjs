import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
    tsconfigRootDir: import.meta.dir,
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-useless-escape": "off",
      "no-prototype-builtins": "off",
      "no-empty": "off",
      "no-cond-assign": "off",
      "no-fallthrough": "off",
      "getter-return": "off",
      "no-control-regex": "off",
      "no-misleading-character-class": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "valid-typeof": "off",
    },
  },
);
