import { randomBytes } from "node:crypto";

const HEX = "0123456789abcdef";

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    out += HEX.charAt(byte >> 4) + HEX.charAt(byte & 0x0f);
  }
  return out;
}

export function uuidv7(): string {
  const bytes = randomBytes(16);
  const millis = Date.now();

  bytes[0] = (millis / 0x10000000000) & 0xff;
  bytes[1] = (millis / 0x100000000) & 0xff;
  bytes[2] = (millis / 0x1000000) & 0xff;
  bytes[3] = (millis / 0x10000) & 0xff;
  bytes[4] = (millis / 0x100) & 0xff;
  bytes[5] = millis & 0xff;

  bytes[6] = (bytes[6]! & 0x0f) | 0x70;

  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
