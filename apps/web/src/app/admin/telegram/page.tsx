import { adminIds } from "@/lib/bot";
import { store } from "@/lib/store";
import { tgCall } from "@/lib/telegram";
import { connectWebhook, newLinkCode, removeAdmin, sendTest } from "./actions";

export const dynamic = "force-dynamic";

/** Connect the bot: link Katya's Telegram, register the webhook, send a test message. */
export default async function TelegramAdmin({ searchParams }: { searchParams: Promise<{ code?: string; msg?: string }> }) {
  const sp = await searchParams;
  const token = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const secret = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);
  const me = token ? await tgCall<{ username: string }>("getMe", {}) : null;
  const bot = me?.username ?? process.env.NEXT_PUBLIC_TG_BOT ?? "";
  const hook = token ? await tgCall<{ url?: string; last_error_message?: string }>("getWebhookInfo", {}) : null;
  const admins = await adminIds(store());
  const row = (ok: boolean, label: string, hint?: string) => (
    <li className="flex gap-2"><span aria-hidden>{ok ? "✅" : "⬜"}</span><span>{label}{!ok && hint ? <span className="text-muted"> — {hint}</span> : null}</span></li>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Telegram-бот</h1>
      {sp.msg && <p role="status" className="rounded-lg bg-soft p-3 text-sm font-semibold">{sp.msg}</p>}

      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Стан підключення</h2>
        <ul className="space-y-2 text-sm">
          {row(token, `Токен бота${me ? ` (@${me.username})` : ""}`, "додайте TELEGRAM_BOT_TOKEN у змінні середовища")}
          {row(secret, "Секрет вебхука", "додайте TELEGRAM_WEBHOOK_SECRET (довгий випадковий рядок)")}
          {row(Boolean(hook?.url), "Вебхук підключено", "натисніть кнопку нижче")}
          {row(admins.length > 0, `Ваш Telegram прив'язано (${admins.length})`, "створіть код нижче")}
        </ul>
        {hook?.last_error_message && <p className="mt-2 text-sm text-clay">Остання помилка Telegram: {hook.last_error_message}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={connectWebhook}><button className="btn btn-primary" type="submit" disabled={!token || !secret}>Підключити вебхук</button></form>
          <form action={sendTest}><button className="btn btn-ghost" type="submit" disabled={!token || admins.length === 0}>Надіслати тест</button></form>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-xl font-bold">Прив'язати свій Telegram</h2>
        <p className="mb-3 text-sm text-muted">Сповіщення про нові замовлення й оплати приходитимуть тому, хто прив'язаний. Код діє 15 хвилин і одноразовий.</p>
        <form action={newLinkCode}><button className="btn btn-ghost" type="submit" disabled={!token}>Створити код</button></form>
        {sp.code && (
          <div className="mt-4 rounded-xl bg-soft p-4">
            <p className="text-sm">Надішліть боту повідомлення:</p>
            <p className="mt-1 font-mono text-lg font-bold">/start link_{sp.code}</p>
            {bot && <a className="mt-2 inline-block text-leaf underline" href={`https://t.me/${bot}?start=link_${sp.code}`} target="_blank" rel="noopener noreferrer">або відкрити бота за посиланням →</a>}
          </div>
        )}
        {admins.length > 0 && (
          <ul className="mt-4 divide-y divide-line text-sm">
            {admins.map((id) => (
              <li key={id} className="flex items-center justify-between py-2">
                <span className="font-mono">{id}</span>
                <form action={removeAdmin}><input type="hidden" name="id" value={id} /><button className="chip !min-h-8" type="submit">Відв'язати</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5 text-sm">
        <h2 className="mb-2 text-xl font-bold">Mini App для власників</h2>
        <p>Адреса застосунку: <span className="font-mono">{(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/app</span>. У @BotFather: «Bot Settings → Menu Button» (або «Configure Mini App») вкажіть цю адресу. Посилання на картці горщика використовує <span className="font-mono">NEXT_PUBLIC_TG_BOT</span>{bot ? ` (зараз @${bot})` : " (не задано)"}.</p>
      </section>
    </div>
  );
}
