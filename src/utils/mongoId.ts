/** MongoDB ObjectId: exactly 24 hexadecimal characters. */
export function isMongoObjectId(id: string): boolean {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}
