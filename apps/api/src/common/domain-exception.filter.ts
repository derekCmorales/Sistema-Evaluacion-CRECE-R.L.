import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { DomainError, DuplicatePersonError } from "@crece/shared";
import type { Response } from "express";

/** Código de dominio → estado HTTP. Lo que no está aquí es un error de validación (400). */
const STATUS_BY_CODE: Record<string, number> = {
  FORBIDDEN: HttpStatus.FORBIDDEN,
  INVARIANT_VIOLATION: HttpStatus.CONFLICT,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
  DUPLICATE_PERSON: HttpStatus.CONFLICT,
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
      ...(exception instanceof DuplicatePersonError ? { existingPersonId: exception.existingPersonId } : {}),
    });
  }
}
