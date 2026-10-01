import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRECE — Evaluación",
  description:
    "Sistema interno de captación y evaluación — Cooperativa CRECE Guatemala, R.L.",
};

/** Tokens y estilos de componentes salen del design system publicado en /ds (scripts/sync-design-system.mjs). */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-GT">
      <body>
        <link rel="stylesheet" href="/ds/crece-tokens.css" precedence="default" />
        <link rel="stylesheet" href="/ds/bundle.css" precedence="default" />
        {children}
      </body>
    </html>
  );
}
