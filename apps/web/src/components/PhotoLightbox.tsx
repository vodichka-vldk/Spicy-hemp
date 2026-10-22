"use client";

import { useRef } from "react";

/** Tap the picture to see it large; native <dialog> gives focus trapping and Esc for free. */
export function PhotoLightbox({ children, open, close, ratio = "1 / 1" }: { children: React.ReactNode; open: string; close: string; ratio?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" aria-label={open} onClick={() => ref.current?.showModal()} className="block h-full w-full cursor-zoom-in">
        {children}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-auto w-[min(92vw,34rem)] overflow-hidden rounded-3xl border-0 bg-card p-0 backdrop:bg-black/60"
      >
        <button type="button" onClick={() => ref.current?.close()} aria-label={close} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg shadow">×</button>
        <div style={{ aspectRatio: ratio }}>{children}</div>
      </dialog>
    </>
  );
}
