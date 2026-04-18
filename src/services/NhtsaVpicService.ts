import { injectable } from 'inversify';
import { applyVpicReferenceExclusions } from '../config/vpicReferenceExclusions';
import loggers from '../utils/loggers';
import { AutoDevMakeModelsReference } from '../validation/interfaces/IAutoDev';

const VPIC_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

const BETWEEN_REQUESTS_MS = 200;
const BULK_FETCH_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 3;

/** Vehicle-type queries (partial names per vPIC LIKE semantics): passenger cars, SUVs/MPVs, light trucks. */
const VEHICLE_TYPE_QUERIES = ['car', 'mpv', 'truck'] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Union two make→models maps (e.g. vPIC + Auto.dev) for optional blending. */
export function mergeMakeModelMaps(
  a: AutoDevMakeModelsReference,
  b: AutoDevMakeModelsReference
): AutoDevMakeModelsReference {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: AutoDevMakeModelsReference = {};
  for (const k of keys) {
    const set = new Set<string>();
    for (const m of a[k] ?? []) {
      const t = m.trim();
      if (t) set.add(t);
    }
    for (const m of b[k] ?? []) {
      const t = m.trim();
      if (t) set.add(t);
    }
    out[k] = [...set].sort((x, y) => x.localeCompare(y));
  }
  return out;
}

interface VpicJsonResponse {
  Count?: number;
  Message?: string;
  Results?: any[];
}

@injectable()
export class NhtsaVpicService {
  private cache: { fetchedAt: number; data: AutoDevMakeModelsReference } | null = null;
  private readonly ttlMs = 1000 * 60 * 60 * 24; // 24h

  /**
   * Build make → models from NHTSA vPIC: allowed makes = car ∪ MPV ∪ truck, models from bulk
   * `GetModelsForMake/*` grouped by `Make_Name` (deduped). Matches US regulatory catalog; aligns
   * with case-insensitive filter matching used for Auto.dev listings.
   */
  async fetchMakeModelsReference(forceRefresh: boolean = false): Promise<AutoDevMakeModelsReference> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.cache.fetchedAt < this.ttlMs) {
      return this.cache.data;
    }

    const fallback = (): AutoDevMakeModelsReference => this.cache?.data ?? {};

    try {
      const allowedMakeIds = await this.fetchAllowedMakeIds();
      await sleep(BETWEEN_REQUESTS_MS);
      const bulk = await this.fetchBulkModelsWithRetry();
      const rows = bulk.Results ?? [];
      const raw = this.groupModelsByMake(rows, allowedMakeIds);
      const map = applyVpicReferenceExclusions(raw);
      this.cache = { fetchedAt: now, data: map };
      return map;
    } catch (e: any) {
      loggers.warn('NHTSA vPIC make/models fetch failed; using cache or empty map:', e?.message || e);
      return fallback();
    }
  }

  private async fetchAllowedMakeIds(): Promise<Set<number>> {
    const ids = new Set<number>();
    for (let i = 0; i < VEHICLE_TYPE_QUERIES.length; i++) {
      const t = VEHICLE_TYPE_QUERIES[i];
      const path = `/GetMakesForVehicleType/${encodeURIComponent(t)}?format=json`;
      const json = await this.vpicGet<VpicJsonResponse>(path);
      for (const row of json.Results ?? []) {
        const id = row.MakeId ?? row.Make_ID;
        if (typeof id === 'number' && Number.isFinite(id)) ids.add(id);
      }
      if (i < VEHICLE_TYPE_QUERIES.length - 1) await sleep(BETWEEN_REQUESTS_MS);
    }
    return ids;
  }

  private async fetchBulkModelsWithRetry(): Promise<VpicJsonResponse> {
    const path = `/GetModelsForMake/${encodeURIComponent('*')}?format=json`;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await this.vpicGet<VpicJsonResponse>(path, BULK_FETCH_TIMEOUT_MS);
      } catch (e) {
        lastErr = e;
        loggers.warn(`NHTSA vPIC bulk models attempt ${attempt}/${MAX_ATTEMPTS} failed`, e);
        if (attempt < MAX_ATTEMPTS) await sleep(400 * attempt);
      }
    }
    throw lastErr;
  }

  private groupModelsByMake(results: any[], allowedMakeIds: Set<number>): AutoDevMakeModelsReference {
    const byMake = new Map<string, Set<string>>();
    for (const row of results) {
      const makeId = row.Make_ID;
      if (typeof makeId !== 'number' || !allowedMakeIds.has(makeId)) continue;
      const makeName = String(row.Make_Name ?? '').trim();
      const modelName = String(row.Model_Name ?? '').trim();
      if (!makeName || !modelName) continue;
      if (!byMake.has(makeName)) byMake.set(makeName, new Set());
      byMake.get(makeName)!.add(modelName);
    }
    const out: AutoDevMakeModelsReference = {};
    for (const [make, set] of byMake) {
      out[make] = [...set].sort((a, b) => a.localeCompare(b));
    }
    return out;
  }

  private async vpicGet<T extends VpicJsonResponse>(path: string, timeoutMs = 30_000): Promise<T> {
    const url = `${VPIC_BASE}${path}`;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ac.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`vPIC HTTP ${res.status}: ${body.substring(0, 200)}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(t);
    }
  }
}
