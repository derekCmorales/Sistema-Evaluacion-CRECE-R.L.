"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CreceProvider, useCrece } from "../lib/crece-ds";
import { DEV_USERS, SessionProvider, useSession } from "../lib/session";

const NAV = [
  { id: "dashboard", href: "/dashboard", label: "Vista general", icon: "SquaresFour" },
  { section: "Captación" },
  { id: "persons", href: "/persons", label: "Solicitantes", icon: "Users" },
  { id: "persons-new", href: "/persons/new", label: "Registrar solicitante", icon: "IdentificationCard" },
  { id: "operations-new", href: "/operations/new", label: "Abrir solicitud", icon: "FileText" },
  { section: "Autorización" },
  { id: "approvals", href: "/approvals", label: "Por firmar", icon: "Signature" },
  { section: "Herramientas" },
  { id: "calc", href: "/calc", label: "Simulador de cuota", icon: "Calculator" },
] as const;

type NavLink = Extract<(typeof NAV)[number], { id: string }>;

function activeId(pathname: string): string {
  const links = NAV.filter((n): n is NavLink => "id" in n);
  const exact = links.find((n) => n.href === pathname);
  if (exact) return exact.id;
  if (pathname.startsWith("/persons")) return "persons";
  if (pathname.startsWith("/operations")) return "dashboard";
  return links.find((n) => pathname.startsWith(n.href))?.id ?? "dashboard";
}

function Frame({ children }: { children: React.ReactNode }) {
  const { AppShell, Sidebar, TopBar, IconButton, Select, Icons, Overline, useTheme } = useCrece();
  const { user, setUserId } = useSession();
  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV.map((n) => ("section" in n ? { section: n.section } : { id: n.id, label: n.label, icon: Icons[n.icon] }));

  return (
    <div className="app-frame" data-nav-open={navOpen}>
      <AppShell
        sidebar={
          <Sidebar
            brand={<Overline>CRECE · Evaluación</Overline>}
            items={items}
            active={activeId(pathname)}
            onNavigate={(id: string) => {
              const target = NAV.find((n): n is NavLink => "id" in n && n.id === id);
              setNavOpen(false);
              if (target) router.push(target.href);
            }}
            footer={
              <Select
                label="Sesión de prueba"
                value={user.id}
                onChange={(id: string) => setUserId(id)}
                options={DEV_USERS.map((u) => [u.id, u.name])}
              />
            }
          />
        }
        topbar={
          <TopBar
            leading={
              <IconButton className="app-frame__menu" icon={Icons.List} label="Abrir menú" onClick={() => setNavOpen(true)} />
            }
            title={user.name}
            actions={
              <IconButton
                icon={theme === "dark" ? Icons.Sun : Icons.Moon}
                label={theme === "dark" ? "Usar tema claro" : "Usar tema oscuro"}
                variant="outline"
                onClick={toggleTheme}
              />
            }
          />
        }
      >
        {children}
      </AppShell>
      <div className="app-frame__scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />
    </div>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <CreceProvider>
      <SessionProvider>
        <Frame>{children}</Frame>
      </SessionProvider>
    </CreceProvider>
  );
}
