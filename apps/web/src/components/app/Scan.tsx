"use client";

import { useState } from "react";
import { Alert, Button, Input } from "@/ds";
import { codeFromScan } from "@/lib/pots";
import type { T } from "./text";

type Tg = { WebApp?: { showScanQrPopup?: (p: { text?: string }, cb: (data: string) => boolean | void) => void; closeScanQrPopup?: () => void } };

export function Scan({ t, message, onCode }: { t: T; message: string; onCode: (code: string) => void }) {
  const [code, setCode] = useState("");
  const tg = typeof window !== "undefined" ? (window as unknown as { Telegram?: Tg }).Telegram?.WebApp : undefined;
  const scan = () => tg?.showScanQrPopup?.({ text: t.scanHint }, (data) => { const c = codeFromScan(data); if (c.length === 8) { tg?.closeScanQrPopup?.(); onCode(c); return true; } });
  return (
    <div className="sh-stack-lg">
      {message && <Alert tone="danger">{message}</Alert>}
      {tg?.showScanQrPopup && <Button variant="accent" size="lg" icon="scan-line" onClick={scan}>{t.scanButton}</Button>}
      <form className="sh-stack" onSubmit={(e) => { e.preventDefault(); onCode(codeFromScan(code)); }}>
        <Input label={t.orCode} value={code} onChange={(e: { target: { value: string } }) => setCode(e.target.value)} placeholder={t.codePh} maxLength={12} autoCapitalize="characters" className="font-mono" />
        <div><Button type="submit" variant="secondary">{t.addPot}</Button></div>
      </form>
    </div>
  );
}
