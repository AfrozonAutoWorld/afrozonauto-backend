/**
 * Mask VINs in API responses for non-admin clients.
 * Replaces full VIN strings with asterisks + last 4; handles nested apiData.
 * Photo URLs under common image CDNs are left unchanged so thumbnails keep working (VIN may still appear in those URLs).
 */

export function maskVinValue(vin?: string | null): string | null {
  if (!vin) return null;
  if (vin.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, vin.length - 4))}${vin.slice(-4)}`;
}

function maskSquishVin(s: string): string {
  if (s.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

function isLikelyVehicleImageUrl(s: string): boolean {
  return /^https?:\/\//i.test(s) && /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(s);
}

/**
 * `temp-<VIN>` is the client routing key for GET /vehicles/:id — must stay unmasked.
 */
function isTempVinRouteId(s: string, fullVin: string): boolean {
  return s.startsWith("temp-") && s.slice("temp-".length) === fullVin;
}

/**
 * Deep-clones and masks a vehicle-shaped object (including apiData.listing / raw).
 */
export function maskVehicleForPublic<T>(vehicle: T): T {
  if (!vehicle || typeof vehicle !== "object") return vehicle;

  const src = vehicle as Record<string, unknown>;
  const fullVin = typeof src.vin === "string" && src.vin.length >= 4 ? src.vin : null;
  if (!fullVin) return vehicle;

  const maskedDisplay = maskVinValue(fullVin)!;
  const cloned = JSON.parse(JSON.stringify(vehicle)) as Record<string, unknown>;

  if (typeof cloned.slug === "string" && fullVin.length >= 6) {
    const last6 = fullVin.slice(-6);
    if (cloned.slug.endsWith(last6)) {
      cloned.slug = cloned.slug.slice(0, -6) + "******";
    }
  }

  const deep = (val: unknown, fieldKey?: string): unknown => {
    if (val === null || val === undefined) return val;
    if (typeof val === "string") {
      if (fieldKey === "id" && isTempVinRouteId(val, fullVin)) return val;
      if (val === fullVin) return maskedDisplay;
      if (val.includes(fullVin)) {
        if (isLikelyVehicleImageUrl(val)) return val;
        return val.split(fullVin).join(maskedDisplay);
      }
      return val;
    }
    if (Array.isArray(val)) return val.map((item) => deep(item));
    if (typeof val === "object") {
      const o = val as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(o)) {
        if (k === "squishVin" && typeof x === "string") {
          out[k] = maskSquishVin(x);
        } else {
          out[k] = deep(x, k);
        }
      }
      return out;
    }
    return val;
  };

  return deep(cloned) as T;
}

export function maskVehiclesForPublic<T>(vehicles: T[]): T[] {
  return vehicles.map((v) => maskVehicleForPublic(v));
}

export function maskRecommendedOrSpecialtyItems<T extends { vehicle: unknown }>(
  items: T[],
): T[] {
  return items.map((item) => ({
    ...item,
    vehicle: maskVehicleForPublic(item.vehicle),
  }));
}
