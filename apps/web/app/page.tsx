import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-body)] flex flex-col">
      {/* Top Banner */}
      <header
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{
          background: "var(--bg-brand-strong)",
          borderColor: "rgba(255, 255, 255, 0.12)",
          color: "var(--text-on-brand-strong)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            C
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">
              CRECE Guatemala R.L.
            </span>
            <small className="text-[11px] opacity-75 block">
              Sistema de Captación y Evaluación de Crédito
            </small>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            className="hover:underline transition-opacity"
            style={{ color: "var(--accent)" }}
            href="/persons"
          >
            Solicitantes
          </Link>
          <Link
            className="hover:underline opacity-90 hover:opacity-100"
            href="/operations/new"
          >
            Apertura de Solicitud
          </Link>
          <Link
            className="hover:underline opacity-90 hover:opacity-100"
            href="/dashboard"
          >
            Panel Operativo
          </Link>
          <Link
            className="hover:underline opacity-90 hover:opacity-100"
            href="/calc"
          >
            Simulador
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col gap-10">
        <div>
          <div className="cr-overline cr-overline--rule mb-2">
            Cooperativa CRECE Guatemala, R.L.
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Sistema de Captación y Expediente Digital
          </h1>
          <p className="text-base text-[var(--text-secondary)] max-w-3xl mt-3 leading-relaxed">
            Plataforma para el registro centralizado de solicitantes bajo perfil institucional único,
            apertura de créditos y resolución automática de requisitos conforme a las políticas de CRECE R.L.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Solicitantes */}
          <div className="cr-card cr-card--elevated flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                  Módulo de Personas
                </span>
                <span className="cr-badge cr-badge--success cr-badge--pill">
                  Activo
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Registro de Solicitantes y Perfil Institucional
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Padrón centralizado con perfil único por persona. Validación por DPI guatemalteco (13 dígitos),
                orígenes de captación digital o en agencia y trazabilidad de quién realizó el registro.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-default)]">
              <Link href="/persons">
                <button type="button" className="cr-btn cr-btn--primary cr-btn--sm">
                  Ver solicitantes registrados →
                </button>
              </Link>
              <Link href="/persons/new?source=landing">
                <button type="button" className="cr-btn cr-btn--secondary cr-btn--sm">
                  + Registrar nuevo solicitante
                </button>
              </Link>

            </div>
          </div>

          {/* Card 2: Apertura de Créditos */}
          <div className="cr-card cr-card--elevated flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                  Módulo de Créditos
                </span>
                <span className="cr-badge cr-badge--accent cr-badge--pill">
                  Activo
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Apertura de Solicitudes y Requisitos
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Configuración de condiciones financieras (producto, garantía, monto y plazo) con generación
                automática de los requisitos documentales requeridos para el expediente según normativa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-default)]">
              <Link href="/operations/new">
                <button type="button" className="cr-btn cr-btn--accent cr-btn--sm">
                  + Aperturar solicitud de crédito →
                </button>
              </Link>
              <Link href="/calc">
                <button type="button" className="cr-btn cr-btn--secondary cr-btn--sm">
                  Simulador de crédito
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Informative Notice Banner */}
        <div
          className="p-5 rounded-lg border text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: "var(--info-bg)",
            borderColor: "var(--info)",
            color: "var(--brand)",
          }}
        >
          <div>
            <strong className="block font-bold">
              Gobernanza y Políticas de Crédito Institucionales
            </strong>
            <span className="text-xs opacity-90 block mt-0.5">
              Cálculos financieros transparentes y trazabilidad completa en cada expediente crediticio.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard">
              <button type="button" className="cr-btn cr-btn--secondary cr-btn--sm">
                Panel operativo
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] px-6 py-4 text-xs text-[var(--text-secondary)] text-center">
        Cooperativa CRECE Guatemala, R.L. · Sistema de Captación y Evaluación de Crédito
      </footer>
    </div>
  );
}
