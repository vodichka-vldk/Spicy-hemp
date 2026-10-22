"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-3xl font-bold">Something went wrong / Щось пішло не так</h1>
      <button className="btn btn-primary mt-8" onClick={reset}>Try again / Спробувати ще раз</button>
    </div>
  );
}
