import type { Prisma } from '../generated/prisma/client';

export function normalizeVehicleToken(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Comma-separated OR; used for filters.make, filters.model, filters.vehicleType, etc. */
export function splitCsv(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function matchesVehicleTypeFilterOne(vehicleType: string, listing: any): boolean {
  const vt = String(vehicleType || '').toUpperCase();
  const vehicle = listing?.vehicle || listing || {};
  const rawBody = normalizeVehicleToken(vehicle.bodyStyle || listing?.bodyStyle || '');
  const rawType = normalizeVehicleToken(
    vehicle.type || listing?.type || vehicle.style || listing?.style || ''
  );

  switch (vt) {
    case 'CAR':
      return rawBody === 'car';
    case 'SUV':
      return rawBody === 'suv' || rawType.includes('suv') || rawType.includes('crossover');
    case 'TRUCK':
      return rawBody === 'truck' || rawType.includes('truck') || rawType.includes('pickup');
    case 'VAN':
      return rawBody === 'van' || rawType.includes('van') || rawType.includes('minivan');
    case 'SEDAN':
      return rawType.includes('sedan') || rawType.includes('saloon') || rawBody === 'car';
    case 'COUPE':
      return rawType.includes('coupe');
    case 'HATCHBACK':
      return rawType.includes('hatchback');
    case 'WAGON':
      return rawType.includes('wagon') || rawType.includes('estate');
    case 'CONVERTIBLE':
      return rawType.includes('convertible') || rawType.includes('cabrio') || rawType.includes('roadster');
    case 'MOTORCYCLE':
      return rawType.includes('motorcycle') || rawType.includes('motorbike') || rawType.includes('bike');
    default:
      return false;
  }
}

/** Comma-separated vehicle types: match if any token matches (OR). */
export function matchesVehicleTypeFilter(vehicleType: string, listing: any): boolean {
  const parts = splitCsv(vehicleType);
  if (parts.length === 0) return true;
  return parts.some((p) => matchesVehicleTypeFilterOne(p, listing));
}

/** Matches if any comma-separated body style matches (single value still works). */
export function matchesBodyStyleFilter(selectedBodyStyle: string, listing: any): boolean {
  const parts = splitCsv(selectedBodyStyle);
  if (parts.length === 0) return true;
  return parts.some((p) => matchesBodyStyleFilterOne(p, listing));
}

function matchesBodyStyleFilterOne(selectedBodyStyle: string, listing: any): boolean {
  const vehicle = listing?.vehicle || listing || {};
  const rawBody = normalizeVehicleToken(vehicle.bodyStyle || listing?.bodyStyle || '');
  const rawType = normalizeVehicleToken(
    vehicle.type || listing?.type || vehicle.style || listing?.style || ''
  );
  const selected = normalizeVehicleToken(selectedBodyStyle);

  if (!selected) return true;
  if (selected === 'minivan') return rawType.includes('minivan') || rawBody === 'van';
  return rawBody === selected;
}

/** Comma-separated OR; exact case-insensitive match on listing field. */
export function matchesCsvFieldInsensitive(filterCsv: string | undefined, actual: unknown): boolean {
  const parts = splitCsv(filterCsv);
  if (parts.length === 0) return true;
  const a = String(actual ?? '').trim().toLowerCase();
  return parts.some((p) => a === p.toLowerCase());
}

/**
 * Make filter OR: UI uses "Mercedes-Benz", "Land Rover"; Auto.dev may return "Mercedes", "Mercedes-Benz", etc.
 * Avoid exact-only matching so post-filter keeps API rows (same family of issue as model trim names).
 */
export function matchesCsvMakeFilterInsensitive(filterCsv: string | undefined, actual: unknown): boolean {
  const parts = splitCsv(filterCsv);
  if (parts.length === 0) return true;
  const a = String(actual ?? '').trim();
  const al = a.toLowerCase();
  const na = normalizeVehicleToken(a);

  return parts.some((p) => {
    const t = p.trim().toLowerCase();
    if (!t) return true;
    if (al === t) return true;
    const nt = normalizeVehicleToken(t);
    if (!na || !nt) return false;
    if (na === nt) return true;
    // "mercedes" vs "mercedesbenz", "landrover" vs "landroverdefender"
    if (nt.length >= 3 && na.length >= 3 && (na.startsWith(nt) || nt.startsWith(na))) return true;
    // Very short tokens: only exact (already handled) or skip fuzzy
    return false;
  });
}

/**
 * Catalog "A-Class", "C-Class" vs Auto.dev trim strings "A 220", "C 300" (letter + space + digits).
 * Without this, only "RX" matches because "RX 350" shares a prefix with "RX", while "A 220" does not with "A-Class".
 */
function matchesLetterClassModelToken(filterTokenLower: string, actualLower: string): boolean {
  const m = /^([a-z])-class$/.exec(filterTokenLower);
  if (!m) return false;
  const letter = m[1];
  const trimmed = actualLower.trim();
  const firstSeg = trimmed.split(/[\s/]+/)[0] ?? '';
  if (firstSeg !== letter) return false;
  return new RegExp(`^${letter}\\s+\\d`).test(trimmed);
}

/** One model token vs listing model string (trim-aware). */
export function matchesSingleModelToken(token: string, rawModel: string): boolean {
  const raw = String(rawModel ?? '').trim();
  const a = raw.toLowerCase();
  const t = token.trim().toLowerCase();
  if (!t) return true;
  if (a === t) return true;
  const firstSeg = a.split(/[\s/]+/)[0] ?? a;
  if (firstSeg === t) return true;
  if (a.startsWith(t + ' ') || a.startsWith(t + '-')) return true;
  const nt = normalizeVehicleToken(t);
  const na = normalizeVehicleToken(a);
  if (nt.length >= 2 && na.startsWith(nt)) return true;
  if (matchesLetterClassModelToken(t, a)) return true;
  return false;
}

/**
 * Which OEM(s) a catalog model token usually refers to. Used when several makes are selected:
 * e.g. "A-Class" applies to Mercedes — Lexus rows should not be required to match it (show all Lexus).
 * `null` = token is not make-specific; every selected make must satisfy it (strict).
 */
function primaryMakesForModelToken(token: string): string[] | null {
  const tl = token.trim().toLowerCase();
  const nt = normalizeVehicleToken(tl);
  const firstSeg = (tl.split(/[\s/]+/)[0] ?? tl).toLowerCase();
  const firstNt = normalizeVehicleToken(firstSeg);

  if (/^[a-z]-class$/.test(tl)) {
    return ['mercedes-benz', 'mercedes'];
  }

  const mercedesOnly = new Set([
    'gla',
    'glb',
    'glc',
    'gle',
    'gls',
    'cla',
    'sl',
    'slc',
    'metris',
    'sprinter',
    'eqb',
    'eqe',
    'eqs',
    'eqc',
  ]);
  if (mercedesOnly.has(nt) || mercedesOnly.has(firstNt)) {
    return ['mercedes-benz', 'mercedes'];
  }

  const lexusOnly = new Set(['rx', 'es', 'nx', 'ux', 'gx', 'lx', 'is', 'ls', 'lc', 'rc', 'lfa', 'rz']);
  if (lexusOnly.has(nt) || lexusOnly.has(firstNt)) {
    return ['lexus'];
  }

  return null;
}

function makeHintMatchesListing(hint: string, listingMake: string): boolean {
  const lm = listingMake.trim().toLowerCase();
  const lh = hint.trim().toLowerCase();
  const nlm = normalizeVehicleToken(listingMake);
  const nh = normalizeVehicleToken(hint);
  if (!nlm || !nh) return false;
  if (nlm === nh) return true;
  if (nh.length >= 3 && nlm.length >= 3 && (nlm.startsWith(nh) || nh.startsWith(nlm))) return true;
  return false;
}

/**
 * Auto.dev `/listings` is called **once per make** with a single `vehicle.make` (we do not rely on
 * comma-separated multi-value params). `filtersToAutoDevParams` would still set `vehicle.model` for
 * the full filter string — e.g. model `A-Class` on a **Lexus** request yields zero rows from the API
 * before our post-filter runs. Only pass model query params that apply to this make; otherwise omit
 * `vehicle.model` and let post-filters handle it.
 */
export function autoDevVehicleModelParamForMake(
  singleMake: string,
  modelsCsv: string | undefined
): string | undefined {
  const tokens = splitCsv(modelsCsv);
  if (tokens.length === 0) return undefined;

  const applicable = tokens.filter((mt) => {
    const primaries = primaryMakesForModelToken(mt);
    if (primaries === null) return true;
    return primaries.some((hint) => makeHintMatchesListing(hint, singleMake));
  });

  if (applicable.length === 0) return undefined;
  if (applicable.length === 1) return applicable[0];
  return undefined;
}

function prismaModelBranchForOneToken(modelTok: string): Prisma.VehicleWhereInput {
  const trimmed = modelTok.trim();
  const modelOrs: Prisma.VehicleWhereInput[] = [
    { model: { contains: trimmed, mode: 'insensitive' } },
  ];
  const letterClass = /^([a-z])-class$/i.exec(trimmed);
  if (letterClass) {
    const L = letterClass[1].toUpperCase();
    modelOrs.push({ model: { startsWith: `${L} `, mode: 'insensitive' } });
  }
  return { OR: modelOrs };
}

/**
 * Multi-make + **one** model token: OEM-specific exemption per make (see {@link matchesCsvModelFilterMultiMake}).
 */
function buildMultiMakeSingleModelPrismaOr(makes: string[], models: string[]): Prisma.VehicleWhereInput {
  const branches: Prisma.VehicleWhereInput[] = [];
  for (const makeStr of makes) {
    const modelsThatApply = models.filter((mt) => {
      const primaries = primaryMakesForModelToken(mt);
      if (primaries === null) return true;
      return primaries.some((hint) => makeHintMatchesListing(hint, makeStr));
    });
    if (modelsThatApply.length === 0) {
      branches.push({ make: { equals: makeStr, mode: 'insensitive' } });
    } else {
      const modelOrs: Prisma.VehicleWhereInput[] = [];
      for (const mt of modelsThatApply) {
        const trimmed = mt.trim();
        modelOrs.push({ model: { contains: trimmed, mode: 'insensitive' } });
        const letterClass = /^([a-z])-class$/i.exec(trimmed);
        if (letterClass) {
          const L = letterClass[1].toUpperCase();
          modelOrs.push({ model: { startsWith: `${L} `, mode: 'insensitive' } });
        }
      }
      branches.push({
        AND: [
          { make: { equals: makeStr, mode: 'insensitive' } },
          { OR: modelOrs },
        ],
      });
    }
  }
  return { OR: branches };
}

/**
 * Prisma `where` for several makes + models: **positional pairs** when multiple models are present;
 * otherwise delegates to {@link buildMultiMakeSingleModelPrismaOr}.
 */
export function buildMakeModelPrismaWhere(makes: string[], models: string[]): Prisma.VehicleWhereInput {
  if (makes.length > 1 && models.length === 1) {
    return buildMultiMakeSingleModelPrismaOr(makes, models);
  }
  if (makes.length > 1 && models.length > 1) {
    const k = Math.min(makes.length, models.length);
    return {
      OR: Array.from({ length: k }, (_, i) => ({
        AND: [
          { make: { equals: makes[i], mode: 'insensitive' } },
          prismaModelBranchForOneToken(models[i]),
        ],
      })),
    };
  }
  return { OR: makes.map((m) => ({ make: { equals: m, mode: 'insensitive' } })) };
}

/**
 * Multi-make + **exactly one** model token: token applies only to relevant OEMs; other selected
 * makes are not required to match that model (see `primaryMakesForModelToken`).
 */
export function matchesCsvModelFilterMultiMake(
  makesCsv: string | undefined,
  modelsCsv: string | undefined,
  listingMake: unknown,
  listingModel: unknown
): boolean {
  const makes = splitCsv(makesCsv);
  if (makes.length <= 1) {
    return matchesCsvModelFilterInsensitive(modelsCsv, listingModel);
  }
  const tokens = splitCsv(modelsCsv);
  if (tokens.length === 0) return true;

  const lm = String(listingMake ?? '').trim();
  const lmodel = String(listingModel ?? '').trim();

  if (matchesCsvModelFilterInsensitive(modelsCsv, lmodel)) return true;

  for (const token of tokens) {
    const primaries = primaryMakesForModelToken(token);
    if (primaries === null) {
      return false;
    }
    const appliesToListing = primaries.some((hint) => makeHintMatchesListing(hint, lm));
    if (appliesToListing) {
      if (!matchesSingleModelToken(token, lmodel)) return false;
    }
  }
  return true;
}

/**
 * Combined make + model filter:
 * - **Several models (same count as makes):** positional AND per pair, OR across pairs:
 *   (make₀ ∧ model₀) ∨ (make₁ ∧ model₁) ∨ …
 * - **One make, several models:** make ∧ (model₀ ∨ model₁ ∨ …).
 * - **Several makes, one model:** {@link matchesCsvModelFilterMultiMake} (OEM-specific rules).
 */
export function listingMatchesMakeModelPairedFilter(
  makesCsv: string | undefined,
  modelsCsv: string | undefined,
  listingMake: unknown,
  listingModel: unknown
): boolean {
  const makes = splitCsv(makesCsv);
  const models = splitCsv(modelsCsv);
  const lm = String(listingMake ?? '').trim();
  const lmodel = String(listingModel ?? '').trim();

  if (makes.length === 0 && models.length === 0) return true;
  if (makes.length === 0) return matchesCsvModelFilterInsensitive(modelsCsv, lmodel);
  if (models.length === 0) return matchesCsvMakeFilterInsensitive(makesCsv, lm);

  if (makes.length === 1) {
    return (
      matchesCsvMakeFilterInsensitive(makes[0], lm) &&
      matchesCsvModelFilterInsensitive(modelsCsv, lmodel)
    );
  }

  if (models.length === 1) {
    return matchesCsvModelFilterMultiMake(makesCsv, modelsCsv, listingMake, listingModel);
  }

  const k = Math.min(makes.length, models.length);
  return Array.from({ length: k }, (_, i) =>
    matchesCsvMakeFilterInsensitive(makes[i], lm) && matchesSingleModelToken(models[i], lmodel)
  ).some(Boolean);
}

/**
 * Model filter OR: UI/catalog often sends short tokens ("RX", "GLC") while Auto.dev returns
 * full trim names ("RX 350", "GLC 300 4MATIC"). Exact-only matching would drop every row.
 */
export function matchesCsvModelFilterInsensitive(filterCsv: string | undefined, actual: unknown): boolean {
  const parts = splitCsv(filterCsv);
  if (parts.length === 0) return true;
  const raw = String(actual ?? '').trim();
  return parts.some((p) => matchesSingleModelToken(p, raw));
}

