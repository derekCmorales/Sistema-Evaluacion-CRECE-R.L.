# Uso — recorrido del sistema

La UI autenticada completa se implementará por OpenSpec. Hoy el greenfield demuestra el **contrato de dominio** por API y dos pantallas de apoyo.

## Levantar

```bash
cp .env.example .env
pnpm install
pnpm compose:db
pnpm --filter @crece/shared --filter @crece/domain --filter @crece/application build
pnpm dev:api    # http://localhost:3001/health
pnpm dev:web    # http://localhost:3000
```

## Endpoints que ya ejecutan reglas de negocio

| Método | Ruta | Qué hace |
|--------|------|----------|
| `GET` | `/health` | Liveness |
| `GET` | `/catalog` | Cargos, factores, semilla de política, permisos |
| `GET` | `/approvals/policy` | Umbral, bandas, outcomes |
| `POST` | `/approvals/resolve` | Aplica invariantes y cierra o deja pendiente |
| `GET` | `/operations/checklist` | Checklist dinámico (`productType`, `guaranteeType`, `hasGuarantor`) |
| `POST` | `/operations/calc` | Cuota, capacidad, cobertura, amortización + reglas duras |
| `POST` | `/public/prospects` | Crea **solo** `Person` PROSPECT (memoria de proceso) |
| `GET` | `/prospects` | Lista prospectos en memoria |

### Prospecto (landing)

```json
POST /public/prospects
{
  "fullName": "Marco Pérez",
  "phone": "55551234",
  "interest": "CREDIT",
  "consentContact": true
}
→ 201 { "prospectId": "...", "status": "PROSPECT" }
```

No crea operación. Producto, garantía y destino los define un humano.

### Cálculo (Don Marco)

```json
POST /operations/calc
{
  "amount": 40000,
  "termMonths": 24,
  "annualRatePercent": 18,
  "purpose": "Capital de trabajo ferretería",
  "assessment": {
    "monthlySales": 45000,
    "monthlyIncome": 18000,
    "monthlyExpenses": 9000,
    "existingDebtPayment": 1500,
    "guaranteeValue": 80000
  }
}
```

Web: `/calc` envía este cuerpo. `/dashboard` lee la política.

## Flujo de un día (cuando existan pantallas)

1. Asesor convierte prospecto → operación DRAFT.
2. Completa checklist y evaluación.
3. Envía a revisión (IA asiste).
4. &lt; umbral: Mario (jefatura) + Iván (delegado). ≥ umbral: 3 votos del Consejo en teléfono.
5. Asistente genera paquete; folder naranja si es la primera aprobación.

Usuarios demo (cuando exista auth/seed): `asesor@`, `jefe@`, `ivan@`, `consejo@`, `asistente@`, `vigilancia@`, `admin@` — contraseña de desarrollo, nunca PII real.

Detalle de pantallas futuras: [pantallas.md](./pantallas.md).
