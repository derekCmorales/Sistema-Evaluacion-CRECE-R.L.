import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { DomainError } from "@crece/shared";
import type { Response } from "express";

/** Código de dominio (incluidos los del motor de IA, design D20) → estado HTTP. */
const STATUS_BY_CODE: Record<string, number> = {
  FORBIDDEN: HttpStatus.FORBIDDEN,
  INVARIANT_VIOLATION: HttpStatus.CONFLICT,
  AI_DISABLED: HttpStatus.SERVICE_UNAVAILABLE,
  AI_FORBIDDEN: HttpStatus.FORBIDDEN,
  AI_NOT_FOUND: HttpStatus.NOT_FOUND,
  AI_INPUT_UNSUPPORTED_TYPE: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
  AI_INPUT_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
  AI_INPUT_ENCRYPTED: HttpStatus.UNPROCESSABLE_ENTITY,
  AI_INPUT_CORRUPT: HttpStatus.UNPROCESSABLE_ENTITY,
  AI_REINDEX_REQUIRED: HttpStatus.CONFLICT,
  AI_PROVIDER_TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
  AI_PROVIDER_RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  AI_PROVIDER_AUTH: HttpStatus.BAD_GATEWAY,
  AI_PROVIDER_ERROR: HttpStatus.BAD_GATEWAY,
  AI_OUTPUT_INVALID: HttpStatus.BAD_GATEWAY,
  AI_OUTPUT_FORBIDDEN: HttpStatus.BAD_GATEWAY,
  AI_TASK_UNAVAILABLE: HttpStatus.NOT_IMPLEMENTED,
  AI_RUN_INTERRUPTED: HttpStatus.SERVICE_UNAVAILABLE,
  AI_INTERNAL: HttpStatus.INTERNAL_SERVER_ERROR,
};

export function httpStatusForDomainCode(code: string): number {
  return STATUS_BY_CODE[code] ?? HttpStatus.BAD_REQUEST;
}

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = httpStatusForDomainCode(exception.code);
    res.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
