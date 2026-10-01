"use client";

import { type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasPermission } from "@crece/application";
import { OFFICE_LABELS, type Office } from "@crece/shared";
import { CreceProvider, useCrece } from "../lib/crece-ds";
import { SessionProvider, useSession } from "../lib/session";
import { useNarrow } from "../lib/use-narrow";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CreceProvider>
        <Frame>{children}</Frame>
      </CreceProvider>
    </SessionProvider>
  );
}

const NAV = [
  { section: "Captación" },
  { id: "/", label: "Inicio" },
  { id: "/persons", label: "Solicitantes" },
  { id: "/persons/new", label: "Registrar" },
  { id: "/operations/new", label: "Abrir borrador" },
  { id: "/dashboard", label: "Panel" },
  { id: "/calc", label: "Simulador" },
];

const MOBILE_NAV = [
  { id: "/", label: "Inicio", icon: "House" },
  { id: "/persons", label: "Personas", icon: "Users" },
  { id: "/operations/new", label: "Borrador", icon: "Notebook" },
  { id: "/dashboard", label: "Panel", icon: "ChartBar" },
  { id: "/calc", label: "Simulador", icon: "Calculator" },
];

function activeDestination(pathname: string) {
  const match = MOBILE_NAV.filter((item) => item.id !== "/")
    .sort((a, b) => b.id.length - a.id.length)
    .find((item) => pathname === item.id || pathname.startsWith(`${item.id}/`));
  return match?.id ?? "/";
}

function Frame({ children }: { children: ReactNode }) {
  const crece = useCrece();
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const narrow = useNarrow();

  if (!crece?.AppShell || !crece.Sidebar || !crece.TopBar || !crece.Select || !crece.Button) {
    return (
      <p style={{ fontFamily: "var(--font-sans)", padding: "var(--space-6)" }}>
        Cargando el sistema de diseño…
      </p>
    );
  }

  const { AppShell, Sidebar, TopBar, AppBar, BottomNav, Select, Button } = crece;
  const icons = (crece as { Icons?: Record<string, ComponentType> }).Icons;
  const canOperate = hasPermission(session.offices, "operation:edit");
  const officeSelect = (
    <Select
      label="Cargo"
      options={Object.entries(OFFICE_LABELS).map(([value, label]) => [value, label])}
      value={session.offices[0]}
      onChange={(value: string) => session.setOffices([value as Office])}
    />
  );
  const themeButton = (
    <Button
      variant="ghost"
      onClick={() => session.setTheme(session.theme === "dark" ? "light" : "dark")}
    >
      {session.theme === "dark" ? "Tema claro" : "Tema oscuro"}
    </Button>
  );

  if (narrow && AppBar && BottomNav && icons) {
    return (
      <div className="crece-mobile">
        <AppBar title="Evaluación de crédito" actions={themeButton} />
        <div className="crece-page">
          <div className="crece-office">{officeSelect}</div>
          {children}
        </div>
        <BottomNav
          items={MOBILE_NAV.map((item) => ({
            id: item.id,
            label: item.label,
            icon: icons[item.icon],
          }))}
          active={activeDestination(pathname)}
          onChange={(id: string) => router.push(id)}
        />
      </div>
    );
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={<strong style={{ color: "var(--brand)" }}>CRECE</strong>}
          items={NAV}
          active={pathname}
          onNavigate={(id: string) => router.push(id)}
          footer={
            <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm, 0.875rem)" }}>
              {canOperate ? "Puede capturar" : "Solo lectura"}
            </span>
          }
        />
      }
      topbar={
        <TopBar
          title="Evaluación de crédito"
          actions={
            <div className="crece-chrome-actions">
              {officeSelect}
              {themeButton}
            </div>
          }
        />
      }
    >
      <div className="crece-page">{children}</div>
    </AppShell>
  );
}
