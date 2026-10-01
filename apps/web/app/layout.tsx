import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers";

export const metadata: Metadata = {
  title: "CRECE — Evaluación",
  description:
    "Sistema interno de captación y evaluación — Cooperativa CRECE Guatemala, R.L.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-GT">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
