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

