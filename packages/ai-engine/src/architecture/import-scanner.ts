/**
 * Escáner léxico de imports (sin API del compilador: TypeScript 7 no la publica en JS).
 * 1) quita comentarios y reemplaza cada literal de string/template por un marcador;
 * 2) busca `from <marcador>`, `import <marcador>`, `import(<marcador>)`, `require(<marcador>)`.
 * Así un texto como "from 'pg'" dentro de un string no cuenta como import.
 */
export function scanImports(source: string): string[] {
  const literals: string[] = [];
  let code = "";
  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 2;
      code += " ";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      let value = "";
      while (j < source.length && source[j] !== ch) {
        if (source[j] === "\\") {
          value += source[j + 1] ?? "";
          j += 2;
          continue;
        }
        value += source[j];
        j += 1;
      }
      literals.push(ch === "`" ? "\u0000template" : value);
      code += ` __LIT${literals.length - 1}__ `;
      i = j + 1;
      continue;
    }
    code += ch;
    i += 1;
  }

  const specifiers = new Set<string>();
  const patterns = [
    /\bfrom\s+__LIT(\d+)__/g,
    /\bimport\s+__LIT(\d+)__/g,
    /\bimport\s*\(\s*__LIT(\d+)__\s*\)/g,
    /\brequire\s*\(\s*__LIT(\d+)__\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      const value = literals[Number(match[1])]!;
      if (!value.startsWith("\u0000")) specifiers.add(value);
    }
  }
  return [...specifiers];
}
