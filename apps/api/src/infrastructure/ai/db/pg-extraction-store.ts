import type { Pool } from "pg";
import type { DocumentExtraction, ExtractionKey, ExtractionStore } from "@crece/ai-engine";

type ExtractionRow = {
  id: string;
  file_sha256: string;
  ocr_model: string;
  document_type: string;
  schema_code: string;
  schema_version: number;
  pipeline_fingerprint: string;
  injection_suspected: boolean;
  pages: DocumentExtraction["pages"];
  candidates: DocumentExtraction["candidates"];
  images: DocumentExtraction["images"];
  is_lab: boolean;
  created_at: Date;
};

const COLUMNS = [
  "id",
  "file_sha256",
  "ocr_model",
  "document_type",
  "schema_code",
  "schema_version",
  "pipeline_fingerprint",
  "injection_suspected",
  "pages",
  "candidates",
  "images",
  "is_lab",
  "created_at",
];
const SELECT = COLUMNS.join(", ");

function toExtraction(row: ExtractionRow): DocumentExtraction {
  return {
    id: row.id,
    fileSha256: row.file_sha256,
    ocrModel: row.ocr_model,
    documentType: row.document_type,
    schemaCode: row.schema_code,
    schemaVersion: row.schema_version,
    pipelineFingerprint: row.pipeline_fingerprint,
    injectionSuspected: row.injection_suspected,
    pages: row.pages,
    candidates: row.candidates,
    images: row.images,
    isLab: row.is_lab,
    createdAt: row.created_at.toISOString(),
  };
}

export class PgExtractionStore implements ExtractionStore {
  /** Días que se conserva la respuesta cruda del proveedor (lo normalizado es permanente). */
  constructor(
    private readonly pool: Pool,
    private readonly rawRetentionDays = 30,
  ) {}

  async findByKey(key: ExtractionKey): Promise<DocumentExtraction | null> {
    const { rows } = await this.pool.query<ExtractionRow>(
      `SELECT ${SELECT} FROM ai.document_extraction
       WHERE file_sha256 = $1 AND ocr_model = $2 AND pipeline_fingerprint = $3 AND is_lab = $4`,
      [key.fileSha256, key.ocrModel, key.pipelineFingerprint, key.isLab],
    );
    return rows[0] ? toExtraction(rows[0]) : null;
  }

  async save(extraction: DocumentExtraction, rawResponse?: unknown): Promise<DocumentExtraction> {
    const { rows } = await this.pool.query<ExtractionRow>(
      `INSERT INTO ai.document_extraction
         (id, file_sha256, ocr_model, document_type, schema_code, schema_version, pipeline_fingerprint,
          injection_suspected, pages, candidates, images, raw_response, raw_purge_after, is_lab, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
               CASE WHEN $12::jsonb IS NULL THEN NULL ELSE now() + make_interval(days => $13) END, $14, $15)
       ON CONFLICT (file_sha256, ocr_model, pipeline_fingerprint, is_lab) DO NOTHING
       RETURNING ${SELECT}`,
      [
        extraction.id,
        extraction.fileSha256,
        extraction.ocrModel,
        extraction.documentType,
        extraction.schemaCode,
        extraction.schemaVersion,
        extraction.pipelineFingerprint,
        extraction.injectionSuspected,
        JSON.stringify(extraction.pages),
        JSON.stringify(extraction.candidates),
        JSON.stringify(extraction.images),
        rawResponse === undefined ? null : JSON.stringify(rawResponse),
        this.rawRetentionDays,
        extraction.isLab,
        extraction.createdAt,
      ],
    );
    if (rows[0]) return toExtraction(rows[0]);
    return (await this.findByKey(extraction))!;
  }

  async get(id: string): Promise<DocumentExtraction | null> {
    const { rows } = await this.pool.query<ExtractionRow>(`SELECT ${SELECT} FROM ai.document_extraction WHERE id = $1`, [id]);
    return rows[0] ? toExtraction(rows[0]) : null;
  }

  async linkDocument(documentRef: string, extractionId: string, operationId?: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO ai.document_link (document_ref, extraction_id, operation_id) VALUES ($1, $2, $3)
       ON CONFLICT (document_ref) DO UPDATE SET extraction_id = EXCLUDED.extraction_id,
         operation_id = COALESCE(EXCLUDED.operation_id, ai.document_link.operation_id), linked_at = now()`,
      [documentRef, extractionId, operationId ?? null],
    );
  }

  async findByDocumentRef(documentRef: string): Promise<DocumentExtraction | null> {
    const { rows } = await this.pool.query<ExtractionRow>(
      `SELECT ${COLUMNS.map((c) => `e.${c}`).join(", ")}
       FROM ai.document_link l JOIN ai.document_extraction e ON e.id = l.extraction_id
       WHERE l.document_ref = $1`,
      [documentRef],
    );
    return rows[0] ? toExtraction(rows[0]) : null;
  }

  /** Borra la respuesta cruda vencida (retención); lo normalizado se conserva. Devuelve cuántas. */
  async purgeExpiredRawResponses(): Promise<number> {
    const { rowCount } = await this.pool.query(
      `UPDATE ai.document_extraction SET raw_response = NULL, raw_purge_after = NULL
       WHERE raw_response IS NOT NULL AND raw_purge_after < now()`,
    );
    return rowCount ?? 0;
  }
}
