"use client";

import { useRouter } from "next/navigation";
import { CreceProvider, useCrece } from "../../lib/crece-ds";
import { DEV_USERS, SessionProvider, useSession } from "../../lib/session";

/** A-01: mientras no exista autenticación, aquí se elige la sesión de prueba. */
function DevLogin() {
  const { Card, PageHeader, ListItem, List, Alert, Icons } = useCrece();
  const { setUserId } = useSession();
  const router = useRouter();

  return (
    <main className="cr-root" style={{ maxWidth: 560, margin: "0 auto", padding: "var(--space-12) var(--space-5)" }}>
      <div className="cr-stack">
        <PageHeader overline="CRECE · Evaluación" title="Iniciar sesión" description="La autenticación llega con su propio change (AuthGateway)." />
        <Alert tone="warning" title="Sesión de prueba">
          Elige con qué cargos probar el sistema. La API valida cada permiso, pero esto no es seguridad: no se despliega así.
        </Alert>
        <Card>
          <List>
            {DEV_USERS.map((user) => (
              <ListItem
                key={user.id}
                icon={Icons.UserCircle}
                title={user.name}
                description={user.description}
                chevron
                onClick={() => {
                  setUserId(user.id);
                  router.push("/dashboard");
                }}
              />
            ))}
          </List>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <CreceProvider>
      <SessionProvider>
        <DevLogin />
      </SessionProvider>
    </CreceProvider>
  );
}
