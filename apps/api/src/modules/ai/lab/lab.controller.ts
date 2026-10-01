import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { ValidationError } from "@crece/shared";
import {
  AI_ENGINE_CONFIG_SEED,
  AI_TASKS,
  documentTypeCatalog,
  type AiEngine,
  type AiTask,
  type Requester,
} from "@crece/ai-engine";
import type { AiRuntime } from "../ai-runtime";
import { AI_ENGINE, AI_RUNTIME } from "../ai.tokens";
import type { LabContext } from "./lab-context";
import { LabGuard } from "./lab.guard";
import { LAB_CONTEXT } from "./lab.tokens";

/** Sin autenticación todavía: el lab (solo fuera de producción) actúa como administrador. */
export const LAB_REQUESTER: Requester = { userId: "lab", offices: ["SYSTEM_ADMIN"] };

type UploadedLabFile = { buffer: Buffer; originalname: string; mimetype: string; size: number };

/** Tipos que el visor del lab muestra en línea; cualquier otro se descarga como binario. */
const INLINE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

/**
 * Laboratorio de IA (design D12). Solo delega en la fachada del motor: no hay lógica de
 * extracción, chunking ni generación aquí (spec ai-lab: mismo camino que producción).
 */
@Controller("lab/ia")
@UseGuards(LabGuard)
export class LabController {
  constructor(
    @Inject(AI_ENGINE) private readonly engine: AiEngine,
    @Inject(AI_RUNTIME) private readonly runtime: AiRuntime,
    @Inject(LAB_CONTEXT) private readonly lab: LabContext,
  ) {}

  @Get("meta")
  meta() {
    const config = this.runtime.config ?? AI_ENGINE_CONFIG_SEED;
    return {
      documentTypes: documentTypeCatalog(),
      limits: { maxFileBytes: config.extraction.maxFileBytes, maxPages: config.extraction.maxPages },
      models: config.models,
      retentionDays: this.lab.retentionDays,
      notice: "Solo documentos sintéticos o anonimizados: lo que subas se envía a los proveedores de IA.",
    };
  }

  /** Cola, ejecuciones en curso y workers vivos: la UI avisa si nadie está consumiendo la cola. */
  @Get("status")
  status() {
    return this.runtime.health();
  }

  @Post("documents")
  @HttpCode(202)
  // Tope duro del servidor; el límite vivo de `ai.config` lo aplica el motor en el preflight.
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: AI_ENGINE_CONFIG_SEED.extraction.maxFileBytes, files: 1 } }))
  async upload(@UploadedFile() file: UploadedLabFile | undefined, @Body("documentType") documentType: string | undefined) {
    if (!file) throw new ValidationError("Adjunta un archivo en el campo «file»");
    if (!documentType) throw new ValidationError("Indica el tipo de documento");
    const stored = await this.lab.storage.put({ bytes: new Uint8Array(file.buffer), fileName: file.originalname });
    const accepted = await this.engine.extractDocument({
      documentRef: stored.ref,
      documentType: documentType as never,
      requestedBy: LAB_REQUESTER,
      lab: true,
    });
    return { ...accepted, documentRef: stored.ref, fileName: stored.fileName };
  }

  @Get("documents/:id/file")
  async file(@Param("id", new ParseUUIDPipe()) id: string, @Res() res: Response) {
    const doc = await this.lab.storage.get(`lab/${id}`);
    if (!doc) throw new NotFoundException();
    // El tipo guardado sale de los bytes (nunca del navegador); lo desconocido se descarga.
    const inline = INLINE_TYPES.has(doc.mimeType);
    res.setHeader("Content-Type", inline ? doc.mimeType : "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
    if (!inline) res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.send(Buffer.from(doc.bytes));
  }

  @Get("runs")
  runs(@Query("task") task?: string, @Query("limit") limit?: string) {
    if (task && !AI_TASKS.includes(task as AiTask)) throw new ValidationError("Tarea desconocida");
    const parsedLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    return this.engine.listRuns({ isLab: true, limit: parsedLimit, ...(task ? { task: task as AiTask } : {}) });
  }

  @Get("runs/:id")
  async run(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.labRun(id);
  }

  /** Reintenta una ejecución fallida del lab con la misma entrada. */
  @Post("runs/:id/retry")
  @HttpCode(202)
  async retry(@Param("id", new ParseUUIDPipe()) id: string) {
    await this.labRun(id);
    return this.engine.retryRun({ runId: id, requestedBy: LAB_REQUESTER });
  }

  @Get("extractions/:id")
  async extraction(@Param("id", new ParseUUIDPipe()) id: string) {
    const extraction = await this.engine.getExtraction(id);
    // El lab nunca muestra extracciones de producción (texto de expedientes reales).
    if (!extraction || !extraction.isLab) throw new NotFoundException();
    return extraction;
  }

  private async labRun(id: string) {
    const run = await this.engine.getRun(id);
    if (!run || !run.isLab) throw new NotFoundException();
    return run;
  }
}
