import { login } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-3xl font-bold">Вхід в адмінку</h1>
      <form action={login} className="card mt-6 space-y-4 p-5">
        <input type="hidden" name="next" value={next ?? "/admin"} />
        <label className="field"><span>Електронна пошта</span><input name="email" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" required className="input" /></label>
        <label className="field"><span>Пароль</span><input name="password" type="password" autoComplete="current-password" required className="input" /></label>
        {error && <p role="alert" className="rounded-lg bg-soft p-3 text-sm font-semibold text-clay">{error === "locked" ? "Забагато спроб. Спробуйте за 10 хвилин." : "Невірна пошта або пароль."}</p>}
        <button className="btn btn-primary w-full" type="submit">Увійти</button>
      </form>
    </div>
  );
}
