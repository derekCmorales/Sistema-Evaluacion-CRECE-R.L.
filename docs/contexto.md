# Contexto de negocio — Cooperativa CRECE Guatemala, R.L.

Fuente: propuesta aprobada (sep 2026), tres reuniones transcritas y el repo de aprendizaje `CRECE-MVP`. Este documento es la referencia de **por qué** y **qué**; el código vive en este monorepo greenfield.

## 1. Quién es el cliente

Cooperativa de la Red Nacional de Grupos Gestores. Cobertura: Quetzaltenango, San Marcos, Totonicapán. Enfoque: **empresarios y emprendedores**, no crédito de consumo masivo. Cartera ≈ Q5.6 millones. Operativa pequeña (~4 personas); el puesto de asesor lo cubre la **Jefatura de Agencia** (Mario).

Contactos: Alejandro Arango (Consejo), Iván (Consejo + autorizador delegado), Mario (Jefatura), Josselin (marca/landing), Julio de la Roca (presidente del Consejo).

El criterio de evaluación existe y es sólido, pero vive en personas. Los expedientes físicos rondan **37 páginas** (WhatsApp / Excel / agendas).

## 2. El problema

No falta tecnología: falta **estructura**. El costo real está en la **espera** (coordinar al Consejo, compartir 37 páginas), no en el análisis. Un caso de Q150,000 esperó 7 días sin movimiento.

Hallazgos: el criterio no está escrito; el expediente mezcla identidad, operación y custodia; el checklist es variable (producto + garantía + fiador); el sistema contable genera mal los IVE; resumen y evaluación financiera se hacen en Excel.

## 3. CENSYT (core contable) — no negociable

| Nivel | Qué | Decisión |
|-------|-----|----------|
| A · Entender | Diagnóstico de reportes, formatos, defectos IVE | Sí, entregable |
| B · Arreglar o integrar | Código cerrado, núcleo compartido entre cooperativas | **No. No reabrir.** |
| C · Rodear | Reducir veces que tocan el core y quitarle lo que hace mal | Sí, todo el valor |

El tecleo en el core **no desaparece**. Desaparece el trabajo de *armar y corregir* lo que se teclea. Ningún indicador del tablero se alimenta del core.

## 4. Dos productos

| Producto | Quién | Relación |
|----------|-------|----------|
| Landing informativa | Público | **Otro repo.** `POST /public/prospects` es el único puente. |
| Sistema de evaluación | Interno (este repo) | Expediente, cálculos, reglas, veredicto, bitácora, documentos |

## 5. Principios

1. La IA asiste; **no decide**, no puntúa, no recomienda aprobar.
2. Captura 100% manual. Cálculos = código determinístico.
3. Reglas duras avisan/bloquean con **excepción justificada**.
4. Trazabilidad append-only (`DecisionLog` + `AuditEntry` con old/new).
5. Minimización hacia proveedores de IA.
6. Dev ≠ Prod. Sin flujos de dinero.
7. Plantillas documentales configurables, no código quemado.
8. Todo indicador sale de datos propios.

## 6. Modelo mental

**Centro: Persona** (una identidad, N operaciones de crédito/ahorro).

| Folder | Color | Cuándo |
|--------|-------|--------|
| Identidad / KYC-IVE | Naranja | **Tras** la primera aprobación, nunca antes |
| Operación | Azul | Al originar |
| Custodia legal | Natural | Al firmar; sobrevive a la operación |

Tres capas de decisión, **no una fórmula 85/70/60**:

1. Cálculo (cuota, capacidad, ratio, cobertura, ROI, amortización).
2. Reglas duras configurables + excepción.
3. Apoyo IA solo al enviar a revisión.

La matriz de pesos de la cooperativa se usa como **vocabulario de factores** (chips del voto) y como política para RAG, nunca como score. Vocabulario semilla: capacidad de pago, historial/moral, cobertura, antigüedad, endeudamiento, destino, integridad del expediente, referencias, **condiciones de vida**, **arraigo/residencia**, **historial interno**, beneficiario de la red.

Regla citada de CRECE: *una garantía no compensa la falta de flujo*.

## 7. Cargos (no hay Gerencia)

Usuario ≠ cargo ≠ permiso. Un usuario tiene 1..n cargos; los permisos se suman. Iván no es Gerencia: es Consejo + autorizador delegado.

| Cargo | Código | Hoy |
|-------|--------|-----|
| Asesor financiero | `ADVISOR` | Vacante; Mario lo cubre |
| Jefatura de Agencia | `BRANCH_HEAD` | Mario — primera firma &lt; umbral |
| Autorizador delegado | `DELEGATED_AUTHORIZER` | Iván — segunda firma &lt; umbral; no captura |
| Miembro del Consejo | `COUNCIL_MEMBER` | Julio, Alejandro, Iván — votan ≥ umbral; no capturan |
| Asistencia administrativa | `ADMIN_ASSISTANT` | Cierre, IVE, paquete |
| Comisión de Vigilancia | `OVERSIGHT` | Solo lectura |
| Administrador | `SYSTEM_ADMIN` | Usuarios, checklist, política, plantillas |

Política semilla (dato en DB, no código):

- &lt; Q100,000: 2 firmas distintas (`BRANCH_HEAD` + `DELEGATED_AUTHORIZER`).
- ≥ Q100,000: N de M del Consejo (hoy 3 de 3).

Invariantes: una persona una vez por operación; el originador no firma como delegado ni Consejo (sí como jefatura); el veredicto registra el **cargo ejercido**; consultar ≠ operar.

## 8. Flujo feliz (Don Marco, ferretería, Q40,000)

1. Prospecto (landing o asesor) → `Person` PROSPECT. **No** crea `Operation`.
2. Asesor origina operación (producto, garantía, destino) → checklist dinámico.
3. Evaluación financiera a mano (y del fiador si aplica).
4. Motor calcula. Reglas duras avisan/bloquean.
5. Enviar a revisión → IA (OCR confirmado por humano, contraste, resumen). Nunca veredicto.
6. Autorización según banda. Se puede **aprobar con cambios** de monto/plazo (recalcula).
7. Primera aprobación abre folder naranja. Documentos desde plantillas aprobadas por la cooperativa. Paquete de desembolso.

## 9. Alcance

**Must:** persona + operación crédito, checklist + vigencias, motor, factores, reglas + excepción, veredicto + bitácora + acta Consejo, IA en revisión, generación documental (IVE/contratos cuando la cooperativa apruebe plantillas), tablero de 6 semáforos, recordatorios, RBAC, política configurable.

**Should (prioridad alta):** captaciones ahorro/plazo fijo punta a punta.

**Fuera:** integración CENSYT, cobros/mora/cartera, portal de asociados, indicadores del core, movimiento de dinero, score 85/70/60.

## 10. Pipeline (datos propios)

Espera &gt; N días · plazos fijos por vencer 30/15/5 · checklist incompleto · documentos por expirar · reglas sin justificar · embudo del mes.

## 11. Arquitectura de este repo vs la visión

Visión de producto: landing aparte, PostgreSQL, R2, Mistral OCR, embeddings + Gemini (solo asistencia), PDF local, VPS + Cloudflare.

**Este greenfield:** `apps/web` (Next) + `apps/api` (Nest) + `packages/domain|application|shared` + Postgres 18. Puertos de IA/R2 documentados, no implementados. Prisma schema listo, persistencia de operaciones aún no cableada (prospectos en memoria de proceso para el contrato público).
