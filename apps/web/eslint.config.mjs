import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** Flat config nativo eslint-config-next 16. ESLint 9.x (plugins aún incompatibles con ESLint 10 — ver docs/stack.md). */
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
