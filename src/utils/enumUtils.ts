import { ApiError } from './ApiError';

/**
 * Validates a single query-param / body string against an enum.
 *
 * @param value   - raw string from req.query / req.body (may be undefined)
 * @param enumObj - the Prisma-generated enum object  (e.g. OrderStatus)
 * @param field   - human-readable field name used in the error message
 * @returns       - the typed enum value, or undefined if value was absent
 * @throws 400    - if value is present but not a member of the enum
 */
export function allowEnum<T extends Record<string, string>>(
  value: string | undefined,
  enumObj: T,
  field: string,
): T[keyof T] | undefined {
  if (value === undefined || value === '') return undefined;
  const valid = Object.values(enumObj) as string[];
  if (!valid.includes(value)) {
    throw ApiError.badRequest(
      `Invalid value "${value}" for ${field}. Allowed values: ${valid.join(', ')}`,
    );
  }
  return value as T[keyof T];
}

/**
 * Same as allowEnum but throws if the value is also absent.
 */
export function requireEnum<T extends Record<string, string>>(
  value: string | undefined,
  enumObj: T,
  field: string,
): T[keyof T] {
  const result = allowEnum(value, enumObj, field);
  if (result === undefined) {
    throw ApiError.badRequest(
      `${field} is required. Allowed values: ${Object.values(enumObj).join(', ')}`,
    );
  }
  return result;
}

/**
 * Validates an array of query-param strings against an enum.
 * Filters out empty strings; throws 400 on first invalid value.
 */
export function allowEnumArray<T extends Record<string, string>>(
  values: string[],
  enumObj: T,
  field: string,
): T[keyof T][] {
  return values
    .filter(v => v !== '')
    .map(v => allowEnum(v, enumObj, field) as T[keyof T]);
}
