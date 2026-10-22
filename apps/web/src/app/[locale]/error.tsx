"use client";

import { Button, EmptyState } from "@/ds";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-16">
      <EmptyState icon="circle-alert" title="Something went wrong / Щось пішло не так" action={<Button variant="accent" onClick={reset}>Try again / Спробувати ще раз</Button>} />
    </div>
  );
}
