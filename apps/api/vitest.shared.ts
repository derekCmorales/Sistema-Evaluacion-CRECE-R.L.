import path from "node:path";

const pkg = (name: string, file = "index.ts") => path.resolve(__dirname, `../../packages/${name}/src/${file}`);

/** Los paquetes del monorepo se resuelven desde src: las pruebas no dependen de un build previo. */
export const workspaceAliases = [
  { find: "@crece/application", replacement: pkg("application") },
  { find: "@crece/domain", replacement: pkg("domain") },
  { find: "@crece/shared", replacement: pkg("shared") },
];
