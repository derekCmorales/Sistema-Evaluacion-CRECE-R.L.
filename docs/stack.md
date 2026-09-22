# Stack y versiones (auditoría npm, 22 sep 2026)

Fuente: `npm view <pkg> dist-tags` en esta fecha. **Next y Nest ya estaban en el `latest` estable**; lo que faltaba era TypeScript 7, tipos React y `concurrently`.

## Matriz `latest` vs este repo

| Paquete | Tag `latest` npm | Este repo | ¿Es el latest? |
|---------|------------------|-----------|----------------|
| **next** | **16.3.6** | 16.3.6 | Sí (canary 16.4.0-canary.38 **no** se usa) |
| **eslint-config-next** | 16.3.6 | no se usa (TS 7) | Par alineado a Next; linter sustituido por `tsc` |
| **@nestjs/common, core, platform-express** | **12.0.4** | 12.0.4 | Sí (publicado 21 sep 2026) |
| **@nestjs/cli** | 12.0.5 | 12.0.5 | Sí |
| **@nestjs/schematics** | 12.0.4 | 12.0.4 | Sí |
| **react / react-dom** | 19.3.0 | 19.3.0 | Sí |
| **@types/react / react-dom** | 19.3.0 | 19.3.0 | Sí |
| **typescript** | **7.0.2** | 7.0.2 | Sí |
| **tailwindcss / @tailwindcss/postcss** | 4.3.3 | 4.3.3 | Sí |
| **rxjs** | 7.8.2 | 7.8.2 | Sí (9.0.0-beta.0 no se usa) |
| **reflect-metadata** | 0.2.2 | 0.2.2 | Sí |
| **concurrently** | 10.0.5 | 10.0.5 | Sí |
| **@types/express** | 5.0.6 | 5.0.6 | Sí |
| **@types/node** | 26.6.2 | 26.6.2 | Sí (tipos Node 26; runtime Docker = Node 24 LTS) |
| **pnpm** | 12.5.1 | 12.5.1 (`packageManager`) | Sí |
| **eslint** | 10.11.0 | no en árbol | Ver nota ESLint |
| **PostgreSQL imagen** | — | `postgres:18-alpine` | Sí (`latest` major). Volumen: `/var/lib/postgresql` |

## Notas de peers (obligatorias)

1. **Next 16.3.6** es el último **estable** (incluye el parche de seguridad del 22 sep 2026). `16.4.0-canary.*` no entra al monorepo.
2. **Nest 12.0.4** es el último estable. Nest 12 es ESM-ready; este bootstrap compila API a CommonJS con `tsc` porque `@nestjs/cli` `nest build` falla en Node 22 (`ora` ESM). En Docker usamos Node 24.
3. **TypeScript 7.0.2** es el `latest`. `typescript-eslint@8` y `eslint-config-next@16` **no soportan TS 7** (error al cargar el parser). Por eso `pnpm lint` = `tsc --noEmit` en web y api. Cuando [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940) cierre, se puede reactivar ESLint 10 + `eslint-config-next`.
4. **`@types/node@26.6.2`** es el `latest` de DefinitelyTyped (tipos de Node 26). El runtime Docker sigue en **Node 24 LTS** (`node:24-alpine`). `skipLibCheck` evita ruido; no usar APIs exclusivas de Node 26 en código.
5. **rxjs 9** está en beta; Nest 12 declara peer `rxjs ^7.1.0`.

## Cómo comprobar en el futuro

```bash
npm view next dist-tags
npm view @nestjs/core dist-tags
pnpm outdated -r
```

No hay Prisma/ORM en el bootstrap. `DATABASE_URL` se documenta para Compose (`docs/docker.md`).
