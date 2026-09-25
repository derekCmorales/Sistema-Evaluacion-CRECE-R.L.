# Dominio: crédito y ahorro cooperativo

Reglas de negocio que las pantallas representan. Valores de ejemplo pendientes de validación por CRECE: sirven para diseñar, no son política.

## Estados de una solicitud

`Prospecto` → `Expediente` → `Evaluación` → `En revisión` → `Aprobada` | `Rechazada`; `En corrección` devuelve desde En revisión. Tonos de `Badge`: Prospecto neutral · Expediente/Evaluación info · En revisión/En corrección warning · Aprobada success · Rechazada danger.

## Roles

| Rol | Puede |
|---|---|
| Asesor financiero / Jefe de Agencia | Crear expediente, evaluar, gestionar documentos, enviar a revisión (Jefe: también devolver) |
| Asistente administrativa | Registrar documentos en estados no resueltos |
| Gerencia | Hasta el umbral (ej. Q50,000): devolver, aprobar, rechazar |
| Consejo de Administración | Sobre el umbral: devolver o votar (3 integrantes, 2 votos coincidentes) |
| Comisión de Vigilancia | Solo consulta |

Toda transición exige justificación (≥ 10 caracteres) y queda en la bitácora (`Timeline`).

## Documentos por garantía

Base: identificación, comprobante de ingresos, comprobante de domicilio. **Fiduciaria** + documentación del fiador · **Hipotecaria** + documentación de la propiedad y avalúo · **Prendaria** + documentación del bien.

## Cálculo de cuota

Cuota nivelada sobre saldo, `i = tasaAnual / 1200`, `cuota = P·i / (1 − (1+i)^−n)` (si `i = 0`, `P/n`). La última cuota ajusta el saldo. `Crece.calculateLoan(P, n, tasa)`. Ejemplo: tasa 18%, Q3,000–Q150,000, plazos 12–60 meses. Indicadores de evaluación (referencia, nunca aprueban): ingreso disponible, cuota/ingreso (alerta > 35%), cobertura de garantía.

## Productos base

Crédito para tus metas (HandCoins) · Ahorro con propósito (PiggyBank) · Ahorro a plazo fijo (ChartLineUp) · Metas de ahorro (Target).
