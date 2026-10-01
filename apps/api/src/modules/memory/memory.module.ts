import { Module } from "@nestjs/common";
import { InMemoryPersonStore } from "../persons/in-memory-person.store";
import { InMemoryOperationStore } from "../operations/in-memory-operation.store";
import { InMemoryAuditLog } from "./in-memory-audit-log";
import { WatchlistPolicy } from "./watchlist-policy";

/** Un solo repositorio en memoria para landing y agencia. */
@Module({
  providers: [InMemoryPersonStore, InMemoryOperationStore, InMemoryAuditLog, WatchlistPolicy],
  exports: [InMemoryPersonStore, InMemoryOperationStore, InMemoryAuditLog, WatchlistPolicy],
})
export class MemoryModule {}
