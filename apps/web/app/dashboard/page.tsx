import Link from "next/link";

export default function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8">
      <Link href="/" className="text-[#034381] text-sm hover:underline">
        ← Inicio
      </Link>
      <h1 className="text-2xl font-semibold mt-6 mb-2">Panel operativo</h1>
      <p className="text-zinc-600 max-w-lg">
        Placeholder de dashboard autenticado. RBAC y pipeline se implementarán
        en fases posteriores según OpenSpec.
      </p>
    </div>
  );
}
