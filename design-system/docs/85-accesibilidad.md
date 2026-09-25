# Accesibilidad

Objetivo: WCAG 2.2 AA en web, y las guías equivalentes de iOS y Android.

- **Contraste:** texto ≥ 4.5:1 (≥ 3:1 desde 24px o 19px bold); bordes de control, íconos con significado y foco ≥ 3:1. Verificado en ambos temas para los pares documentados en cada token.
- **Foco visible:** outline 3px `focus`, offset 2px, en todo lo interactivo; nunca `outline: none` sin reemplazo.
- **Objetivos táctiles:** ≥ 44pt / 48dp, con 8px entre objetivos.
- **Color nunca solo:** estados con texto/ícono; gráficas con leyenda y etiquetas; paleta de datos validada para daltonismo.
- **Texto escalable:** soporta Dynamic Type / escala de fuente hasta 200% sin cortar contenido; nada de alturas fijas en contenedores de texto.
- **Semántica:** roles nativos (`button`, `dialog`, `tablist`, `radiogroup`, `switch`, `progressbar`), etiquetas en todos los campos, `aria-live` en cifras que cambian.
- **Movimiento:** respeta «reducir movimiento»; nada parpadea más de 3 veces por segundo.
- **Formularios:** errores específicos junto al campo y anunciados; no borres lo escrito al fallar.
- **Tiempo:** sesiones que expiran avisan y permiten extender; los códigos OTP muestran cuenta regresiva.
- **Lectores de pantalla:** montos se leen completos («doce mil cuatrocientos ochenta quetzales con cincuenta»); saldos ocultos anuncian «saldo oculto».
