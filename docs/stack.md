# Stack y versiones

Actualizado en bootstrap greenfield (PR #1). Versiones fijadas en `package.json` / lockfile.

| Componente | Versión | Notas |
|------------|---------|--------|
| **pnpm** | 12.5.1 | `packageManager` en raíz |
| **Node.js** | ≥ 22 (recomendado 24 LTS) | `engines` en raíz; imágenes Docker `node:24-alpine` |
| **Next.js** | 16.3.6 | `apps/web` |
| **React** | 19.3.0 | Par con Next 16 |
| **NestJS** | 12.0.4 | `apps/api` |
| **TypeScript** | 5.9.3 | Última 5.x estable; encaja con ESLint/typescript-eslint (TS 7 rompe el linter — ver abajo) |
| **ESLint** | 9.39.5 (web) | `eslint-config-next@16` + flat config; ESLint **10** pendiente de compatibilidad con plugins React/Next |
| **PostgreSQL (Compose)** | 17-alpine | Servicio `db` |
| **Tailwind CSS** | 4.3.x | Web |

## Restricciones de peers (documentadas)

1. **TypeScript 7.0** está publicado, pero **typescript-eslint 8** y **eslint-config-next** aún no lo soportan al ejecutar ESLint. El monorepo usa **TypeScript 5.9.3** para que `pnpm lint` y `pnpm build` convivan. Cuando typescript-eslint soporte TS ≥ 7 ([issue #10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)), subir TS en un change OpenSpec.
2. **ESLint 10** falla con `eslint-config-next@16` (FlatCompat circular / react-plugin). Web permanece en **ESLint 9.39.5** hasta alinear plugins; API usa `tsc --noEmit` en `lint`.
3. **`@nestjs/cli@12`**: `nest build` puede fallar en Node 22 (`ora` ESM). Scripts de API usan **`tsc`**; CLI queda para generadores. Preferir Node 24 en Docker.

## Política pnpm 12

- `allowBuilds` en `pnpm-workspace.yaml` para `@nestjs/core`, `sharp`, `unrs-resolver`.
- `minimumReleaseAgeExclude` para releases muy recientes de Next 16 (ventana supply-chain del entorno).

No hay Prisma ni otro ORM en el bootstrap.
