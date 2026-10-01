import { toUserId, type Actor } from "@crece/shared";
import {
  openDraftOperation,
  registerLandingProspect,
  registerPerson,
  updateChecklistItem,
  type CaptureDeps,
} from "@crece/application";

/**
 * Datos de demostración, solo fuera de producción. Sintéticos: el DPI empieza en 0000 a
 * propósito para que nunca se confunda con uno real. Entran por los mismos casos de uso
 * que la UI, así que también dejan su rastro en la bitácora.
 */
const seedAdvisor: Actor = { userId: toUserId("demo-mario"), offices: ["BRANCH_HEAD", "ADVISOR"] };

export async function seedDemoData(deps: CaptureDeps): Promise<void> {
  const donMarco = await registerPerson(deps, seedAdvisor, {
    fullName: "Marco Antonio Demo",
    dpi: "0000000010101",
    phone: "50000001",
    interest: "CREDIT",
  });
  const { operation } = await openDraftOperation(deps, seedAdvisor, {
    personId: donMarco.id,
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    requestedAmount: 40000,
    termMonths: 24,
    purpose: "Inventario de ferretería",
    hasGuarantor: false,
  });
  await updateChecklistItem(deps, seedAdvisor, operation.id, { code: "DPI", status: "CONFIRMED" });

  await registerLandingProspect(deps, {
    fullName: "Lucía Prospecto Demo",
    phone: "50000002",
    interest: "SAVINGS",
    consentContact: true,
    message: "Quiero abrir un ahorro para mi negocio",
  });
}
