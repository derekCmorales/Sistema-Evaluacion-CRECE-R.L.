import { Injectable } from "@nestjs/common";
import {
  DEFAULT_REQUIRED_WATCHLIST_SOURCES,
  type WatchlistSource,
} from "@crece/shared";

/**
 * Semilla de listas requeridas. En producción esta fila vive en configuración.
 */
@Injectable()
export class WatchlistPolicy {
  readonly requiredSources: readonly WatchlistSource[] = [
    ...DEFAULT_REQUIRED_WATCHLIST_SOURCES,
  ];
}
