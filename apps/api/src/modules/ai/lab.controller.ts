import {
  Body,
  Controller,
  Get,
  Header,
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
import { AI_TASKS, AI_ENGINE_CONFIG_SEED, documentTypeCatalog, type AiTask, type Requester } from "@crece/ai-engine";
import type { AiRuntime } from "./ai-runtime";
import { AI_RUNTIME } from "./ai.tokens";
import { LabGuard } from "./lab.guard";

/** Sin autenticación todavía: el lab (solo fuera de producción) actúa como administrador. */
export const LAB_REQUESTER: Requester = { userId: "lab", offices: ["SYSTEM_ADMIN"] };

type UploadedLabFile = { buffer: Buffer; originalname: string; mimetype: string; size: number };

/**
 * Laboratorio de IA (design D12). Solo delega en la fachada del motor: no hay lógica de
 * extracción, chunking ni generación aquí (spec ai-lab: mismo camino que producción).
 */
@Controller("lab/ia")
@UseGuards(LabGuard)
export class LabController {
  constructor(@Inject(AI_RUNTIME) private readonly runtime: AiRuntime) {}

  @Get("meta")
  meta() {
    const config = this.runtime.config ?? AI_ENGINE_CONFIG_SEED;
    return {
      documentTypes: documentTypeCatalog(),
      limits: { maxFileBytes: config.extraction.maxFileBytes, maxPages: config.extraction.maxPages },
      models: config.models,
      retentionDays: this.runtime.env.lab.retentionDays,
      notice: "Solo documentos sintéticos o anonimizados: lo que subas se envía a los proveedores de IA.",
    };
  }

  @Post("documents")
  @HttpCode(202)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: AI_ENGINE_CONFIG_SEED.extraction.maxFileBytes, files: 1 } }))
  async upload(@UploadedFile() file: UploadedLabFile | undefined, @Body("documentType") documentType: string | undefined) {
    if (!file) throw new ValidationError("Adjunta un archivo en el campo «file»");
    if (!documentType) throw new ValidationError("Indica el tipo de documento");
    const stored = await this.labStorage().put({
      bytes: new Uint8Array(file.buffer),
      fileName: file.originalname,
      mimeType: file.mimetype,
    });
    const accepted = await this.runtime.engine.extractDocument({
      documentRef: stored.ref,
      documentType: documentType as never,
      requestedBy: LAB_REQUESTER,
      lab: true,
    });
    return { ...accepted, documentRef: stored.ref, fileName: stored.fileName };
  }

  @Get("documents/:id/file")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cache-Control", "no-store")
  async file(@Param("id", new ParseUUIDPipe()) id: string, @Res() res: Response) {
    const doc = await this.labStorage().get(`lab/${id}`);
    if (!doc) throw new NotFoundException();
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.send(Buffer.from(doc.bytes));
  }

  @Get("runs")
  runs(@Query("task") task?: string, @Query("limit") limit?: string) {
    if (task && !AI_TASKS.includes(task as AiTask)) throw new ValidationError("Tarea desconocida");
    const parsedLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    return this.runtime.engine.listRuns({ isLab: true, limit: parsedLimit, ...(task ? { task: task as AiTask } : {}) });
  }

  @Get("runs/:id")
  async run(@Param("id", new ParseUUIDPipe()) id: string) {
    const run = await this.runtime.engine.getRun(id);
    if (!run || !run.isLab) throw new NotFoundException();
    return run;
  }

  @Get("extractions/:id")
  async extraction(@Param("id", new ParseUUIDPipe()) id: string) {
    const extraction = await this.runtime.engine.getExtraction(id);
    if (!extraction) throw new NotFoundException();
    return extraction;
  }

  private labStorage() {
    if (!this.runtime.labStorage) throw new NotFoundException();
    return this.runtime.labStorage;
  }
}
