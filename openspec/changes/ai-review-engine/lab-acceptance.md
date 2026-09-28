# Aceptación manual del laboratorio de IA

Complementa, **nunca reemplaza**, las pruebas automáticas (`pnpm test`, `pnpm --filter @crece/api test:integration`). Cada punto se marca a mano en el PR, con fecha y quién lo verificó. Solo documentos sintéticos.

## 0. Levantar el entorno

```bash
docker compose up -d db                           # pgvector 18 en el puerto de POSTGRES_PORT (5433 en esta máquina)
pnpm install
pnpm --filter @crece/ai-engine eval:fixtures      # PDFs sintéticos en packages/ai-engine/eval/fixtures/
pnpm --filter @crece/api ai:smoke                 # credenciales: Gemini (3.8 Flash + Embedding 2) y Mistral
pnpm build
pnpm --filter @crece/api start                    # API :3001 (migra el esquema ai al arrancar)
pnpm --filter @crece/api start:worker             # worker: consume la cola ai-runs
pnpm dev:web                                      # web :3000 → http://localhost:3000/lab/ia
```

Variables mínimas en `.env` (raíz): `AI_ENGINE_ENABLED=true`, `AI_LAB_ENABLED=true`, `MISTRAL_API_KEY`, `AI_GOOGLE_API_KEY` y, si aplica, `AI_GOOGLE_PROJECT`/`AI_GOOGLE_LOCATION`.

## 1. Acceso y guardas

- [ ] Con `AI_LAB_ENABLED=false`, `/lab/ia` responde 404 en la web, y `GET /lab/ia/meta` responde 404 en la API.
- [ ] Con `pnpm build && pnpm --filter @crece/web start` (producción), `/lab/ia` responde 404 aunque el flag esté activo.
- [ ] El aviso "Solo documentos sintéticos o anonimizados" se ve siempre, arriba de las pestañas.
- [ ] La página usa tipografía Figtree/Urbanist y colores del design system (sin grises neutros ni colores sueltos). Tema claro y oscuro.

## 2. Extracción

| Archivo (eval/fixtures) | Tipo | Esperado |
|---|---|---|
| `dpi-sintetico.pdf` | DPI | 4 campos: nombre, CUI `2345 67890 1202`, nacimiento `01/12/1985`, vencimiento `01/12/2030`; página 1 |
| `buro-sintetico.pdf` | Reporte de buró | 5 campos; cuota mensual `Q3,200.00` en página 2; consultas `3` y mora `0` ubicadas en página 1 |
| `recibo-ingresos-sintetico.pdf` | Recibo de ingresos | Monto `Q18,000.00`, periodo `agosto 2026` |
| `estado-cuenta-sintetico.pdf` | Estado de cuenta | Saldo promedio `Q12,450.75`, depósitos `Q21,300.00` |
| `recibo-servicio-sintetico.pdf` | Recibo de servicio | Dirección y fecha `05/09/2026` |
| `buro-formato-europeo.pdf` | Reporte de buró | Montos normalizados a `Q2,150.00` / `Q30,000.00` y marcados **Revisar** ("Formato de monto inusual") |
| `recibo-con-inyeccion.pdf` | Recibo de ingresos | Extrae periodo y monto; el texto de la "Nota" aparece en el texto de la página, **nunca** como valor de un campo |

- [ ] Para cada archivo de la tabla: subir, elegir el tipo y pulsar **Extraer**. La ejecución pasa por "En cola" → "Procesando" → "Listo".
- [ ] Los campos coinciden con la columna "Esperado". Los que no, quedan registrados abajo con captura del texto extraído.
- [ ] Ningún campo aparece como "Confirmado": todos dicen "Pendiente de confirmación" o "Revisar".
- [ ] El documento original (izquierda) y el texto por página (derecha) corresponden a la misma página al cambiar de pestaña.
- [ ] Subir **dos veces el mismo archivo**: la segunda ejecución dice "Reutilizado", con costo US$0.
- [ ] Subir un `.docx` o `.txt`: error claro "Formato no admitido", y en Ejecuciones el costo es US$0.
- [ ] Subir un PDF protegido con contraseña: "PDF protegido con contraseña", sin costo.
- [ ] Subir una foto de celular de un documento sintético impreso: los campos con baja confianza quedan en "Revisar: baja confianza".

## 3. Ejecuciones

- [ ] La lista muestra fecha, tarea, estado, modelo, tiempo, costo y error.
- [ ] Clic en una extracción reabre su resultado en la pestaña Extracción.
- [ ] El total de costo estimado suma lo que muestran las filas.

## 4. Observaciones

Registrar aquí los resultados no esperados (archivo, campo, esperado, obtenido, texto de la página). Son la entrada para ajustar esquemas por tipo, umbrales y normalizadores.

| Fecha | Quién | Archivo | Campo | Esperado | Obtenido | Nota |
|---|---|---|---|---|---|---|
| | | | | | | |
