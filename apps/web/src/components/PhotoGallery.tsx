"use client";

import { useState } from "react";

/** Big photo with thumbnails below; tap a thumbnail to switch. */
export function PhotoGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-[2rem] border border-line bg-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[i]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto" aria-label="Photos">
          {photos.map((src, n) => (
            <li key={src}>
              <button type="button" onClick={() => setI(n)} aria-label={`${alt} ${n + 1}`} aria-current={n === i} className={`block h-16 w-16 overflow-hidden rounded-xl border-2 ${n === i ? "border-leaf" : "border-line"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
