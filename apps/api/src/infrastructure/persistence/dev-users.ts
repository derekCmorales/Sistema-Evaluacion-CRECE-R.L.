import type { DevDirectoryUser } from "./in-memory-repositories";

/**
 * Usuarios de la sesión de desarrollo. Deben coincidir con `DEV_USERS` de
 * `apps/web/lib/session.tsx`. Tres miembros del Consejo para poder cerrar el quórum
 * semilla (3 de 3) en la demo. No es seguridad: se reemplaza con `AuthGateway`.
 */
export const DEV_DIRECTORY_USERS: readonly DevDirectoryUser[] = [
  { id: "demo-jefatura", name: "Jefatura (demo)", offices: ["BRANCH_HEAD", "ADVISOR"] },
  { id: "demo-delegado", name: "Delegado (demo)", offices: ["DELEGATED_AUTHORIZER", "COUNCIL_MEMBER"] },
  { id: "demo-consejo-2", name: "Consejo 2 (demo)", offices: ["COUNCIL_MEMBER"] },
  { id: "demo-consejo-3", name: "Consejo 3 (demo)", offices: ["COUNCIL_MEMBER"] },
  { id: "demo-vigilancia", name: "Vigilancia (demo)", offices: ["OVERSIGHT"] },
];
