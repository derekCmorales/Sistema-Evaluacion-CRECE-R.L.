import Link from "next/link";

export default function LoginPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-6">
      <div className="bg-white shadow-sm border rounded-lg p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-[#034381] mb-2">
          Iniciar sesión
        </h1>
        <p className="text-sm text-zinc-600 mb-6">
          Autenticación no implementada en bootstrap. Integración futura vía API
          Nest y `AuthGateway`.
        </p>
        <Link href="/" className="text-sm text-[#e8973c] hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
