"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL_OFFICES, type Office } from "@crece/shared";

type SessionValue = {
  userId: string;
  offices: Office[];
  setOffices: (offices: Office[]) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
};

const SessionContext = createContext<SessionValue | null>(null);

const STORAGE_KEY = "crece-session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [offices, setOffices] = useState<Office[]>(["ADVISOR"]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const userId = "user-advisor-ana";

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { offices?: Office[]; theme?: "light" | "dark" };
      if (saved.offices?.every((office) => ALL_OFFICES.includes(office))) {
        setOffices(saved.offices);
      }
      if (saved.theme === "dark" || saved.theme === "light") setTheme(saved.theme);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ offices, theme }));
  }, [offices, theme]);

  const value = useMemo(
    () => ({ userId, offices, setOffices, theme, setTheme }),
    [offices, theme],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Sesión no disponible");
  return value;
}
