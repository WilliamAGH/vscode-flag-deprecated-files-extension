import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import deprecation from "eslint-plugin-deprecation";

export default [{
}, {
    files: ["./**/*.{js,mjs,cjs,jsx,ts,tsx}", "src/**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    ignores: ["node_modules/**", "dist/**", "out/**", "coverage/**", "test/**"],
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "deprecation": deprecation
    },

    languageOptions: {
        parser: tsParser,
        parserOptions: {
            project: "./tsconfig.json"
        },
        ecmaVersion: 2022,
        sourceType: "module"
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"]
        }],
        "deprecation/deprecation": "warn",
        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn"
    }
}];