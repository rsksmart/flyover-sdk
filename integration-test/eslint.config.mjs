// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { globalIgnores } from "eslint/config";
import globals from "globals";
import love from 'eslint-config-love';

export default tseslint.config([
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    globalIgnores(["**/node_modules/", "**/lib/", "**/integration-test/"]),
    {
        ...love,
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },

            ecmaVersion: "latest",
            sourceType: "commonjs",
        },

        rules: {},
    },
    {
        files: ["**/*.ts"],

        rules: {
            "@typescript-eslint/no-throw-literal": "off",
            "@typescript-eslint/strict-boolean-expressions": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/restrict-plus-operands": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": "off",
            "@typescript-eslint/return-await": "off",
            "no-return-await": "error",
        },
    },
    {
        files: ["**/*.test.ts", "**/*.spec.ts"],
        rules: {
          "@typescript-eslint/no-explicit-any": "off",
          "@typescript-eslint/no-unused-vars": "off",
        }
    },
    {
        files: ["setup/*"],
        rules: {
          "@typescript-eslint/no-require-imports": "off",
        }
    }
]);
