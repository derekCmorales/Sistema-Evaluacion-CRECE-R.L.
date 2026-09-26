import {
  money,
  toDocumentId,
  toOperationId,
  toPersonId,
  toUserId,
  type WatchlistCheckSummaryDto,
} from "@crece/shared";
import { createChecklistItems } from "../checklist-resolver";
import type { Operation, Person } from "../entities";

export const MOCK_PERSON_PROSPECT: Person = {
  id: toPersonId("mock-person-001"),
  fullName: "Carlos Roberto Gómez Pérez",
  contacts: {
    phone: "55551234",
    email: "carlos.gomez@ejemplo.com",
  },
  dpi: "2345678900101",
  address: "Zona 1, Quetzaltenango",
  status: "PROSPECT",
  source: "LANDING",
  interest: "CREDIT",
  createdAt: "2026-09-26T08:30:00.000Z",
};

export const MOCK_PERSON_ACTIVE: Person = {
  id: toPersonId("mock-person-002"),
  fullName: "María Elena Morales Santos",
  contacts: {
    phone: "55558765",
    email: "maria.morales@ejemplo.com",
  },
  dpi: "1234567890101",
  address: "Barrio San Antonio, Salcajá",
  status: "ACTIVE",
  source: "ADVISOR",
  interest: "CREDIT",
  registeredByUserId: toUserId("user-mario-branch-head"),
  createdAt: "2026-09-26T09:00:00.000Z",
};

export const MOCK_DRAFT_OPERATION_NO_GUARANTOR: Operation = {
  id: toOperationId("mock-op-101"),
  personId: MOCK_PERSON_PROSPECT.id,
  productType: "WORKING_CAPITAL",
  guaranteeType: "PERSONAL",
  hasGuarantor: false,
  requestedAmount: money(25000),
  termMonths: 18,
  purpose: "Compra de inventario para tienda de abarrotes",
  state: "DRAFT",
  checklist: createChecklistItems({
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    hasGuarantor: false,
  }),
  hardRuleHits: [],
  verdicts: [],
  createdBy: toUserId("user-mario-branch-head"),
  createdAt: "2026-09-26T09:15:00.000Z",
  updatedAt: "2026-09-26T09:15:00.000Z",
};

export const MOCK_DRAFT_OPERATION_WITH_GUARANTOR: Operation = {
  id: toOperationId("mock-op-102"),
  personId: MOCK_PERSON_ACTIVE.id,
  productType: "INVESTMENT",
  guaranteeType: "MORTGAGE",
  hasGuarantor: true,
  guarantor: {
    fullName: "Juan José Morales Santos",
    dpi: "3456789010101",
    phone: "55559988",
    relationship: "Hermano",
  },
  requestedAmount: money(80000),
  termMonths: 36,
  purpose: "Construcción y ampliación de bodega de almacenamiento",
  state: "DRAFT",
  checklist: createChecklistItems({
    productType: "INVESTMENT",
    guaranteeType: "MORTGAGE",
    hasGuarantor: true,
  }),
  hardRuleHits: [],
  verdicts: [],
  createdBy: toUserId("user-advisor-ana"),
  createdAt: "2026-09-26T09:30:00.000Z",
  updatedAt: "2026-09-26T09:30:00.000Z",
};

export const MOCK_WATCHLIST_CHECKS: WatchlistCheckSummaryDto[] = [
  {
    id: "wl-check-001",
    operationId: MOCK_DRAFT_OPERATION_NO_GUARANTOR.id,
    source: "OFAC",
    queryRef: "2345678900101",
    result: "CLEAR",
    checkedByUserId: toUserId("user-advisor-ana"),
    checkedAt: "2026-09-26T10:00:00.000Z",
    notes: "Sin coincidencias en lista SDN de OFAC.",
  },
  {
    id: "wl-check-002",
    operationId: MOCK_DRAFT_OPERATION_NO_GUARANTOR.id,
    source: "ONU",
    queryRef: "2345678900101",
    result: "CLEAR",
    checkedByUserId: toUserId("user-advisor-ana"),
    checkedAt: "2026-09-26T10:01:00.000Z",
    notes: "Sin registros en resoluciones del Consejo de Seguridad de la ONU.",
  },
  {
    id: "wl-check-003",
    operationId: MOCK_DRAFT_OPERATION_NO_GUARANTOR.id,
    source: "GUATECOMPRAS",
    queryRef: "2345678900101",
    result: "PENDING_MANUAL_REVIEW",
    checkedByUserId: toUserId("user-advisor-ana"),
    checkedAt: "2026-09-26T10:02:00.000Z",
    notes: "Pendiente de adjuntar constancia de consulta en portal Guatecompras.",
  },
];
