# Uso — recorrido del sistema

Las fases 1–3 (registro, apertura en borrador y armado del expediente) funcionan de punta a punta en API y web. La persistencia es memoria de proceso (se pierde al reiniciar) y la sesión es de prueba hasta que exista autenticación.

## Levantar

```bash
cp .env.example .env
pnpm install
pnpm --filter @crece/shared --filter @crece/domain --filter @crece/application build
pnpm dev:api    # http://localhost:3001/health  (siembra datos demo fuera de producción; CRECE_DEMO_SEED=false para arrancar vacío)
pnpm dev:web    # http://localhost:3000  (publica el design system en /ds antes de arrancar)
```

## Sesión de prueba

Sin `AuthGateway`, el actor llega en cabeceras: `x-crece-user-id` y `x-crece-offices` (cargos separados por coma). Sin ellas la API responde 401. En la web se elige en el pie del menú o en `/login`:

| Sesión | Cargos | Puede |
|--------|--------|-------|
| Jefatura (demo) | `BRANCH_HEAD`, `ADVISOR` | registrar, abrir y armar expedientes |
| Delegado (demo) | `DELEGATED_AUTHORIZER`, `COUNCIL_MEMBER` | consultar |
| Vigilancia (demo) | `OVERSIGHT` | consultar |

No es seguridad: no se despliega así.

## Endpoints

| Método | Ruta | Qué hace |
|--------|------|----------|
| `GET` | `/health` | Liveness |
| `GET` | `/catalog` | Cargos, factores, semilla de política, permisos |
| `GET` | `/approvals/policy` | Umbral, bandas, outcomes |
| `POST` | `/approvals/resolve` | Aplica invariantes y cierra o deja pendiente |
| `POST` | `/public/prospects` | Landing → crea **solo** `Person` PROSPECT (sin sesión) |
| `GET` | `/persons` | Directorio (`?source=LANDING\|ADVISOR`), DPI enmascarado |
| `POST` | `/persons/lookup` | Busca por DPI en el cuerpo `{ dpi }` |
| `POST` | `/persons` | Registro en agencia; DPI repetido → 409 `{ existingPersonId }` |
| `GET` | `/persons/:id` | Perfil con historial de solicitudes |
| `PUT` | `/persons/:id/dpi` | Completa el DPI de un prospecto de la landing |
| `GET` | `/operations` | Cola de expedientes con su avance de armado |
| `POST` | `/operations` | Abre la solicitud en `DRAFT` (persona existente con DPI) |
| `GET` | `/operations/:id` | Expediente: `{ operation, assembly, canEdit }` |
| `PATCH` | `/operations/:id/checklist` | `{ code, status, notApplicableReason? }` |
| `PUT` | `/operations/:id/assessment` | Evaluación manual → motor + reglas duras |
| `PUT` | `/operations/:id/guarantor` | Fiador (basta el nombre) + su evaluación |
| `POST` | `/operations/:id/watchlist` | Consulta OFAC/ONU/Guatecompras registrada a mano |
| `POST` | `/operations/:id/assemble` | Marca el expediente armado (sin huecos) |
| `GET` | `/operations/:id/history` | Bitácora del expediente |
| `GET` | `/operations/checklist` | Vista previa del checklist (`productType`, `guaranteeType`, `hasGuarantor`) |
| `POST` | `/operations/calc` | Simulador: cuota, capacidad, cobertura, amortización + reglas duras |

### Prospecto (landing)

```json
POST /public/prospects
{
  "fullName": "Marco Pérez",
  "phone": "55551234",
  "interest": "CREDIT",
  "consentContact": true
}
→ 201 { "prospectId": "...", "status": "PROSPECT", "interest": "CREDIT" }
```

No crea operación. Aparece en el directorio con origen «Landing» y sin DPI; el asesor lo completa en su perfil.

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

Web: `/calc` envía este cuerpo.

## Recorrido en la web (fases 1–3)

1. `/persons/new`: DPI primero; si ya existe, lleva a su perfil. Si no, registra la persona (PROSPECT).
2. Perfil → «Abrir solicitud»: producto, garantía, monto, plazo, destino y fiador; nace en borrador.
3. `/operations/[id]`: checklist (con «No aplica» justificado), evaluación (resultado del motor), fiador, listas de control y bitácora. El panel de armado muestra los huecos; sin huecos, «Marcar expediente armado».

## Flujo de un día (siguientes fases)

1. Expediente armado (fases 1–3).
2. Excepciones justificadas a reglas duras.
3. Envía a revisión (IA asiste).
4. &lt; umbral: Mario (jefatura) + Iván (delegado). ≥ umbral: 3 votos del Consejo en teléfono.
5. Asistente genera paquete; folder naranja si es la primera aprobación.

Usuarios demo (cuando exista auth/seed): `asesor@`, `jefe@`, `ivan@`, `consejo@`, `asistente@`, `vigilancia@`, `admin@` — contraseña de desarrollo, nunca PII real.

Detalle de pantallas futuras: [pantallas.md](./pantallas.md).
