# Mapa de pantallas (objetivo)

IDs alineados al inventario de `CRECE-MVP/SCREENS.md`. Este repo **no copia** esas UIs; las reconstruye sobre Nest + Next con el mismo lenguaje ubicuo.

Principios: móvil primero en captura; voto del Consejo impecable en teléfono; nunca esconder faltantes; tres registros visuales (capturado / calculado / sugerido por IA); menú por permisos; sin puntaje ni banda de riesgo.

| ID | Ruta objetivo | Quién | Notas |
|----|---------------|-------|-------|
| A-01 | `/login` | Todos | Placeholder actual |
| A-02 | `/dashboard` | Según cargo | Colas por rol, no solo contadores. Placeholder lee política |
| C-01 | `/persons` `/persons/new` | Asesor, jefatura | Persona central |
| C-03 | `/operations/[id]` | Asesor, jefatura | Stepper Captura → Revisión → Decisión → Cierre |
| C-04 | checklist en C-03 | Asesor | Vigencias; faltante visible; N/A con razón |
| C-05 | evaluación | Asesor | Manual; etiqueta Calculado en el motor |
| C-05b | fiador | Asesor | Misma evaluación + buró |
| C-08 | enviar a revisión | Asesor | Dispara IA; no veredicto |
| C-09 | `/operations/[id]/exception` | Asesor, jefatura | Excepción justificada a regla dura |
| D-04 | bandeja autorización | Delegado, jefatura, Consejo | Solo lo que les toca firmar/votar |
| D-06 | `/operations/[id]/vote` | Consejo | 4 caminos; chips de factores; cargo ejercido |
| D-07 | `/operations/[id]/minutes` | Consejo, asistencia | Acta automática |
| E-02 | identidad | Asistencia | Folder naranja post-aprobación; listas OFAC/ONU/Guatecompras |
| F-04 | `/pipeline` | Consejo, jefatura, vigilancia | 6 semáforos, datos propios |
| F-05 | `/audit-log` | Vigilancia, admin | old/new |
| F-06 | `/reports/factors` | Consejo | Distribución observada, no pesos |
| G-01 | `/admin/users` | Admin | Cargos, no un rol único |
| G-03…G-07 | admin config | Admin | Umbrales, tasas, factores, plantillas |
| H-01 | `/prospects` | Asesor | Convertir a operación |
| I-01 / I-03 | ahorro / calendario | Asistencia | Should |
| K-* | documentos generados | Asistencia | Solo plantillas `approvedByCooperative` |

Landing (otro repo): formulario público → `POST /public/prospects`.
