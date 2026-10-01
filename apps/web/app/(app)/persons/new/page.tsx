"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PROSPECT_INTEREST_LABELS, type PersonListItem, type ProspectInterest } from "@crece/shared";
import type { Person } from "@crece/domain";
import { useCrece } from "../../../../lib/crece-ds";
import { useSession } from "../../../../lib/session";
import { ApiError, errorMessage } from "../../../../lib/api";
import { dpiDigits } from "../../../../lib/view";

type Fields = { fullName: string; dpi: string; phone: string; email: string; interest: ProspectInterest };

export default function NewPersonPage() {
  const { PageHeader, Card, TextField, ChoiceCards, Button, Alert, Link, Icons } = useCrece();
  const router = useRouter();
  const { request, can } = useSession();
  const [fields, setFields] = React.useState<Fields>({ fullName: "", dpi: "", phone: "", email: "", interest: "CREDIT" });
  const [dpiError, setDpiError] = React.useState<string>();
  const [existing, setExisting] = React.useState<PersonListItem | null>(null);
  const [formError, setFormError] = React.useState<string>();
  const [saving, setSaving] = React.useState(false);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  /** Búsqueda previa al salir del campo: si el DPI ya existe se reutiliza esa persona. */
  async function lookupDpi() {
    const digits = dpiDigits(fields.dpi);
    setExisting(null);
    if (digits.length === 0) return setDpiError(undefined);
    if (digits.length !== 13) return setDpiError(`El DPI debe tener 13 dígitos (llevas ${digits.length})`);
    setDpiError(undefined);
    try {
      const { match } = await request<{ match: PersonListItem | null }>("/persons/lookup", {
        method: "POST",
        body: { dpi: digits },
      });
      setExisting(match);
    } catch (e) {
      setDpiError(errorMessage(e));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    setSaving(true);
    try {
      const person = await request<Person>("/persons", {
        method: "POST",
        body: { ...fields, dpi: dpiDigits(fields.dpi), email: fields.email || undefined },
      });
      router.push(`/persons/${person.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "DUPLICATE_PERSON" && err.existingPersonId) {
        router.push(`/persons/${err.existingPersonId}`);
        return;
      }
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!can("person:create")) {
    return (
      <>
        <PageHeader overline="Fase 1 · Registro" title="Registrar solicitante" />
        <Alert tone="info" title="Tu cargo consulta, no registra">
          Cambia a una sesión de Jefatura o asesor para registrar solicitantes.
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        overline="Fase 1 · Registro"
        title="Registrar solicitante"
        description="Empieza por el DPI: si la persona ya existe, abrimos su perfil en lugar de duplicarla. Registrar no abre ninguna solicitud."
      />

      <Card>
        <form className="cr-stack" onSubmit={submit} noValidate>
          <TextField
            label="DPI"
            help="13 dígitos. Lo buscamos al salir del campo."
            inputMode="numeric"
            autoComplete="off"
            icon={Icons.IdentificationCard}
            value={fields.dpi}
            onChange={set("dpi")}
            onBlur={lookupDpi}
            error={dpiError}
          />

          {existing && (
            <Alert
              tone="warning"
              title="Esta persona ya está registrada"
              actions={
                <Button variant="secondary" size="sm" type="button" onClick={() => router.push(`/persons/${existing.id}`)}>
                  Ir al perfil de {existing.fullName}
                </Button>
              }
            >
              {`${existing.fullName} · DPI ${existing.dpiMasked} · ${existing.operationsCount} solicitud(es). Abre la nueva solicitud desde su perfil.`}
            </Alert>
          )}

          <div className="cr-grid">
            <TextField label="Nombre completo" autoComplete="name" value={fields.fullName} onChange={set("fullName")} />
            <TextField label="Teléfono" inputMode="tel" autoComplete="tel" value={fields.phone} onChange={set("phone")} />
          </div>
          <TextField label="Correo" optional type="email" autoComplete="email" value={fields.email} onChange={set("email")} />

          <ChoiceCards
            label="Producto de interés"
            value={fields.interest}
            onChange={(v: ProspectInterest) => setFields((f) => ({ ...f, interest: v }))}
            options={[
              { value: "CREDIT", title: PROSPECT_INTEREST_LABELS.CREDIT, description: "Capital de trabajo, inversión o microcrédito", icon: Icons.HandCoins },
              { value: "SAVINGS", title: PROSPECT_INTEREST_LABELS.SAVINGS, description: "Cuenta de ahorro o aportación", icon: Icons.PiggyBank },
              { value: "FIXED_TERM", title: PROSPECT_INTEREST_LABELS.FIXED_TERM, description: "Depósito a plazo", icon: Icons.Vault },
            ]}
          />

          {formError && <Alert tone="danger" title="No pudimos registrar al solicitante">{formError}</Alert>}

          <div className="form-actions">
            <Link onClick={() => router.push("/persons")}>Cancelar</Link>
            <Button variant="primary" type="submit" loading={saving} disabled={saving || Boolean(existing)}>
              Registrar solicitante
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
