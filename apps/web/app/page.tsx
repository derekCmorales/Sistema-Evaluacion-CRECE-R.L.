import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#034381] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold tracking-tight">CRECE Guatemala R.L.</span>
        <nav className="flex gap-4 text-sm">
          <Link className="text-[#e8973c] hover:underline" href="/dashboard">
            Panel
          </Link>
          <Link className="opacity-80 hover:underline" href="/calc">
            Cálculo
          </Link>
          <Link className="opacity-80 hover:underline" href="/login">
            Iniciar sesión
          </Link>
        </nav>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">Sistema de evaluación</h1>
        <p className="text-white/85 leading-relaxed mb-8">
          Monorepo greenfield: Next.js (web) + NestJS (api) + dominio puro
          testeable. Expediente digital, cálculos determinísticos y autorización
          configurable. La IA asiste en revisión; no decide ni asigna puntaje.
        </p>
        <p className="text-sm text-white/60">
          API health:{" "}
          <code className="bg-black/20 px-1 rounded">
            {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}
            /health
          </code>
        </p>
      </main>
    </div>
  );
}
