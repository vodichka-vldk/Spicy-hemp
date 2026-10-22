import { createHash } from "node:crypto";
import type { ScanEvent } from "./store/types";

export function visitorHash(ip: string, ua: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  const salt = process.env.ANALYTICS_SALT ?? "dev-salt";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 16);
}

export function parseUa(ua: string): { device: ScanEvent["device"]; os: string } {
  const device: ScanEvent["device"] = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|iphone|android/i.test(ua) ? "mobile" : "desktop";
  const os = /iphone|ipad|ios/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
  return { device, os };
}
