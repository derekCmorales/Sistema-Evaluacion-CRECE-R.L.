"use client";

import { useRouter } from "next/navigation";
import { OFFICE_LABELS, type Office } from "@crece/shared";
import { useCrece } from "../../lib/crece-ds";
import { useSession } from "../../lib/session";

export default function LoginPage() {
  const crece = useCrece();
  const session = useSession();
  const router = useRouter();
  if (!crece) return null;
  const { PageHeader, Card, Select, Button } = crece;

  return (
    <>
      <PageHeader title="Entrar" description="Elige el cargo con el que vas a trabajar. No es una cuenta de gerencia." />
      <Card title="Cargo">
        <Select
          label="Cargo"
          value={session.offices[0]}
          onChange={(value: string) => session.setOffices([value as Office])}
          options={Object.entries(OFFICE_LABELS)}
        />
        <Button onClick={() => router.push("/dashboard")}>Continuar</Button>
      </Card>
    </>
  );
}
