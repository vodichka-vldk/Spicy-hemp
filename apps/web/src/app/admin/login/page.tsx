import { Alert, Button, Input } from "@/ds";
import { Panel } from "@/ui";
import { login } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm py-10">
      <form action={login} className="sh-stack-lg">
        <h1>Вхід в адмінку</h1>
        <Panel>
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <Input label="Електронна пошта" name="email" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" required />
          <Input label="Пароль" name="password" type="password" autoComplete="current-password" required />
          {error && <Alert tone="danger">{error === "locked" ? "Забагато спроб. Спробуйте за 10 хвилин." : "Невірна пошта або пароль."}</Alert>}
          <Button type="submit" variant="primary" full>Увійти</Button>
        </Panel>
      </form>
    </div>
  );
}
