# 19 — Testing (siempre)

Fuente para agentes: **este Markdown + Mermaid**. No hay PNG. Un change sin prueba en la capa de la regla no entra a `main`. Narrativa: [testing.md](../testing.md).

## Pirámide y dueño de la regla

```mermaid
flowchart TB
  subgraph webCapa["apps/web — último"]
    UI["Recorrido de pantalla\nno recalcula umbral"]
  end
  subgraph apiCapa["apps/api — contrato"]
    HTTP["HTTP y códigos\nno posee fórmulas"]
  end
  subgraph appCapa["@crece/application"]
    UC["Casos de uso + RBAC\npuertos falsos"]
  end
  subgraph domCapa["@crece/domain — primero"]
    DOM["Motor, estados, política,\nchecklist, factores"]
  end
  UI --> HTTP
  HTTP --> UC
  UC --> DOM
```

## Puerta de un change

```mermaid
flowchart LR
  A["Toca una regla\no un adaptador"] --> B["Prueba en esa capa\nrojo a verde"]
  B --> C["pnpm test"]
  C --> D["pnpm lint y build"]
  D --> E["PR a main"]
  B -. salto prohibido .-> E
```

## Qué capa responde a qué pregunta

```mermaid
flowchart LR
  Q1["¿Cuánto es la cuota?"] --> D1["domain"]
  Q2["¿Ya cerró el quórum?"] --> D2["domain"]
  Q3["¿El Consejo puede originar?"] --> A1["application RBAC"]
  Q4["¿El prospecto público crea Person?"] --> A2["application + API"]
  Q5["¿El panel muestra el umbral?"] --> W1["web después de 1-4"]
```

## Secuencia: prueba de dominio vs atajo prohibido

```mermaid
sequenceDiagram
  actor Dev as Agente o dev
  participant Spec as OpenSpec Tests
  participant Dom as domain
  participant Web as apps/web

  Dev->>Spec: ¿qué debe fallar?
  Spec->>Dom: aserción de invariante
  Dom-->>Dev: rojo o verde
  Note over Web: La UI no sustituye este paso
  Dev-->>Web: solo si domain ya está verde
```

## Invariantes que no se delegan a la UI

```mermaid
flowchart TB
  I1["Una persona una vez por operación"]
  I2["Originador no es delegado ni Consejo"]
  I3["Menores: dos firmas distintas"]
  I4["Mayores: N de M del Consejo"]
  I5["Prospecto landing no crea Operation"]
  I6["Sin score ni recomendación"]
  I1 --> T["Tienen que romper en domain o application"]
  I2 --> T
  I3 --> T
  I4 --> T
  I5 --> T
  I6 --> T
```
