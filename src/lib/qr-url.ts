export function getSecureScanUrl(origin: string, qrToken: string): string {
  return `${origin}/scan/${qrToken}`;
}
