"use client";

import { usePathname } from "next/navigation";
import { Chip, Header } from "@/ds";

type Item = { href: string; label: string; icon: string };

const current = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));

/** Admin top bar: menu in the header from 768px, chips under it on a phone. */
export function AdminChrome({ items, end }: { items: Item[]; end?: React.ReactNode }) {
  const path = usePathname() ?? "";
  return (
    <>
      <Header brand="Spicy Hemp · адмінка" homeHref="/admin" items={[]} end={end} />
      <nav aria-label="Адмінка" className="sh-chiprow container-x">
        {items.map((i) => (<Chip key={i.href} href={i.href} icon={i.icon} selected={current(path, i.href)}>{i.label}</Chip>))}
      </nav>
    </>
  );
}
