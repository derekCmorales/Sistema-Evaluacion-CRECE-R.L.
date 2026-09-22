import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { DomainError } from "@crece/shared";
import type { Response } from "express";

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception.code === "FORBIDDEN"
        ? HttpStatus.FORBIDDEN
        : exception.code === "INVARIANT_VIOLATION"
          ? HttpStatus.CONFLICT
          : HttpStatus.BAD_REQUEST;
    res.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
