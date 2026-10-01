"use client";

import * as React from "react";
import type { Office } from "@crece/shared";
import { apiRequest, type ApiRequest } from "./api";
import { can, type PermissionMatrix } from "./view";

/**
 * Sesión de desarrollo mientras no exista autenticación (AuthGateway). Elige con qué cargos
 * se prueba el sistema; la API vuelve a validar cada permiso. No es seguridad.
 */
export type DevUser = { id: string; name: string; description: string; offices: Office[] };

export const DEV_USERS: DevUser[] = [
  {
    id: "demo-jefatura",
    name: "Jefatura (demo)",
    description: "Cubre el puesto de asesor: registra, abre y arma expedientes",
    offices: ["BRANCH_HEAD", "ADVISOR"],
  },
  {
    id: "demo-delegado",
    name: "Delegado (demo)",
    description: "También en el Consejo: consulta, no captura",
    offices: ["DELEGATED_AUTHORIZER", "COUNCIL_MEMBER"],
  },
  {
    id: "demo-consejo-2",
    name: "Consejo 2 (demo)",
    description: "Miembro del Consejo: vota desde el umbral",
    offices: ["COUNCIL_MEMBER"],
  },
  {
    id: "demo-consejo-3",
    name: "Consejo 3 (demo)",
    description: "Miembro del Consejo: vota desde el umbral",
    offices: ["COUNCIL_MEMBER"],
  },
  {
    id: "demo-vigilancia",
    name: "Vigilancia (demo)",
    description: "Solo lectura",
    offices: ["OVERSIGHT"],
  },
];

const STORAGE_KEY = "crece.devSession";

type Session = {
  user: DevUser;
  setUserId: (id: string) => void;
  can: (permission: string) => boolean;
  request: <T>(path: string, request?: Omit<ApiRequest, "session">) => Promise<T>;
};

const SessionContext = React.createContext<Session | null>(null);

function readStoredUser(): DevUser {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY);
    return DEV_USERS.find((u) => u.id === id) ?? DEV_USERS[0];
  } catch {
    return DEV_USERS[0];
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<DevUser>(DEV_USERS[0]);
  const [permissions, setPermissions] = React.useState<PermissionMatrix>({});

  React.useEffect(() => {
    setUser(readStoredUser());
    apiRequest<{ permissions: PermissionMatrix }>("/catalog").then(
      (catalog) => setPermissions(catalog.permissions),
      () => setPermissions({}),
    );
  }, []);

  const value = React.useMemo<Session>(
    () => ({
      user,
      setUserId: (id) => {
        const next = DEV_USERS.find((u) => u.id === id);
        if (!next) return;
        try {
          window.localStorage.setItem(STORAGE_KEY, id);
        } catch {
          // sin almacenamiento: la elección dura lo que dure la pestaña
        }
        setUser(next);
      },
      can: (permission) => can(permissions, user.offices, permission),
      request: (path, request = {}) => apiRequest(path, { ...request, session: { userId: user.id, offices: user.offices } }),
    }),
    [user, permissions],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = React.useContext(SessionContext);
  if (!session) throw new Error("useSession fuera de SessionProvider");
  return session;
}
