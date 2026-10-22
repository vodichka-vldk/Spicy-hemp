"use client";

import { useCallback, useMemo } from "react";

export type Res = { status: number; json: Record<string, unknown> };

/** Calls the Mini App API with Telegram's signed data. Every route verifies it on the server. */
export function useApi(initData: string | null) {
  const call = useCallback(async (path: string, body?: unknown): Promise<Res> => {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `tma ${initData}` }, body: JSON.stringify(body ?? {}) });
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  }, [initData]);
  const upload = useCallback(async (path: string, form: FormData): Promise<Res> => {
    const res = await fetch(path, { method: "POST", headers: { Authorization: `tma ${initData}` }, body: form });
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  }, [initData]);
  const blobUrl = useCallback(async (path: string): Promise<string | null> => {
    const res = await fetch(path, { headers: { Authorization: `tma ${initData}` } });
    return res.ok ? URL.createObjectURL(await res.blob()) : null;
  }, [initData]);
  return useMemo(() => ({ call, upload, blobUrl }), [call, upload, blobUrl]);
}

/** Resizes a photo to at most 1600 px and re-encodes it as JPEG so uploads stay small on mobile data. */
export async function compress(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k); canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // unsupported in this webview: the server still checks type and size
  }
}
