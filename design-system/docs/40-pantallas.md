# Pantallas de referencia

Composiciones reales hechas solo con componentes y tokens del sistema. Cada una está en vivo en el grupo **Pantallas** (cambia el tema para verlas en oscuro) y como imagen en el grupo de assets **Screens**.

## App móvil · splash, ingreso y verificación

`AppMovilAcceso`

- Splash con logo vertical blanco sobre `bg-brand-strong` y entrada `cr-anim-pop`
- Ingreso: `Logo`, `display-sm`, `TextField` (DPI con ícono, contraseña con mostrar/ocultar), `Link`, `Button lg block`, `Divider label`, biometría con `Button secondary`
- Verificación: `AppBar` con regresar, contenedor firma, `PinInput` de 6, cuenta regresiva tabular, CTA abajo

## App móvil · inicio, movimientos y metas

`AppMovilInicio`

- Inicio: cabecera `bg-brand-strong` con saludo, `AccountCard light` superpuesta, `QuickActions` (acento en Solicitar), `Alert warning` de vencimiento, `TransactionItem`, `BottomNav`; entrada con `Stagger`
- Movimientos: `AppBar`, `SearchField`, `Chip` de filtro, grupos por día con `overline`, `TransactionItem`
- Metas: resumen `Card tinted` + `ProgressRing`, `SavingsGoal` por meta (incluye 100% y 0%), acción de nueva meta en `AppBar`

## App móvil · simular, documentos y seguimiento de crédito

`AppMovilCredito`

- Simular: `Steps`, `ChoiceCards` de destino con íconos duotono, `LoanCalculator` con cuota animada
- Documentos: `ProgressBar` 2 de 4, `DocumentChecklist` con subir, CTA deshabilitado hasta completar
- Estado: `Card brand signature` con monto y `Badge accent`, `StatusTracker` con paso actual pulsando, contacto humano

## App móvil · perfil y ajustes, avisos vacíos, confirmación

`AppMovilPerfil`

- Perfil: `Avatar lg`, `List inset` con `ListItem` y chevrons, `Switch` de preferencias en `Card`
- Avisos vacíos: `EmptyState` esperanzador
- Confirmación: check con `cr-anim-pop`, `display-sm`, resumen `DescriptionList`, CTA y ghost

## Web app · vista general con KPIs, gráficas y tabla

`WebDashboard`

- `AppShell` (Sidebar con secciones y contador + TopBar con búsqueda, tema y avisos)
- `PageHeader` con saludo, `SegmentedControl` de periodo y CTA
- 4 `Stat` con `Sparkline` en cascada, `BarChart` agrupado + `DonutChart`, `DataTable` de solicitudes con `Avatar`, `Badge` y menú

## Web app · expediente con tabs, documentos, seguimiento y decisión

`WebExpediente`

- `Breadcrumbs`, `PageHeader` con `Badge` de estado y acciones
- `Tabs` con contadores
- Columna izquierda: `DescriptionList` doble, `DocumentChecklist`, `Alert` informativa · Derecha: `StatusTracker` y panel de decisión `Card elevated` con justificación obligatoria

## Web app · formulario de configuración y diálogo de confirmación

`WebFormulario`

- `PageHeader` con vista previa y publicar
- `Alert warning` de cambios sin publicar con acción
- Formulario en 2 columnas: `TextField` (contador, sufijo %, prefijo Q), `Select`, `FileDrop`, `RadioGroup row`, `Switch`, y `Dialog` de confirmación

## Reglas de composición

- Móvil: margen lateral 20, bloques separados por 20–24, CTA principal `lg block` abajo, `BottomNav` solo en pantallas raíz.
- Web: `AppShell` + `PageHeader`; contenido máx. 1320; grillas de 4 (KPIs), 1.6/1 (gráfica + resumen) y 1.5/1 (detalle + acciones).
- Una sola firma visual (esquina 100) y un solo CTA naranja por pantalla.
- Primera carga con `Stagger`; cifras protagonistas con `AnimatedNumber`.
