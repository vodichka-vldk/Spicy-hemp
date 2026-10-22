import { Alert, Button, Icon } from "@/ds";
import { Flash, PageHeader, Panel } from "@/ui";
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
    <li className="flex gap-2"><span aria-hidden style={{ color: ok ? "var(--success)" : "var(--warning)" }}><Icon name={ok ? "circle-check" : "circle-alert"} size={18} /></span><span>{label}{!ok && hint ? <span className="sh-muted"> — {hint}</span> : null}</span></li>
  );
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Telegram-бот" />
      <Flash msg={sp.msg} />

      <Panel title="Стан підключення">
        <ul className="sh-stack body-sm">
          {row(token, `Токен бота${me ? ` (@${me.username})` : ""}`, "додайте TELEGRAM_BOT_TOKEN у змінні середовища")}
          {row(secret, "Секрет вебхука", "додайте TELEGRAM_WEBHOOK_SECRET (довгий випадковий рядок)")}
          {row(Boolean(hook?.url), "Вебхук підключено", "натисніть кнопку нижче")}
          {row(admins.length > 0, `Ваш Telegram прив'язано (${admins.length})`, "створіть код нижче")}
        </ul>
        {hook?.last_error_message && <Alert tone="danger" title="Остання помилка Telegram">{hook.last_error_message}</Alert>}
        <div className="flex flex-wrap gap-2">
          <form action={connectWebhook}><Button type="submit" variant="primary" disabled={!token || !secret}>Підключити вебхук</Button></form>
          <form action={sendTest}><Button type="submit" variant="secondary" disabled={!token || admins.length === 0}>Надіслати тест</Button></form>
        </div>
      </Panel>

      <Panel title="Прив'язати свій Telegram" lead="Сповіщення про нові замовлення й оплати приходитимуть тому, хто прив'язаний. Код діє 15 хвилин і одноразовий.">
        <form action={newLinkCode}><Button type="submit" variant="secondary" disabled={!token}>Створити код</Button></form>
        {sp.code && (
          <Alert tone="info" title="Надішліть боту повідомлення">
            <span className="font-mono label">/start link_{sp.code}</span>
            {bot && <> · <a className="underline" href={`https://t.me/${bot}?start=link_${sp.code}`} target="_blank" rel="noopener noreferrer">або відкрити бота за посиланням</a></>}
          </Alert>
        )}
        {admins.length > 0 && (
          <ul className="sh-stack body-sm">
            {admins.map((id) => (
              <li key={id} className="flex items-center justify-between">
                <span className="font-mono">{id}</span>
                <form action={removeAdmin}><input type="hidden" name="id" value={id} /><Button size="sm" variant="secondary" type="submit">Відв'язати</Button></form>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Mini App для власників">
        <p className="body-sm">Адреса застосунку: <span className="font-mono">{(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/app</span>. У @BotFather: «Bot Settings → Menu Button» (або «Configure Mini App») вкажіть цю адресу. Посилання на картці горщика використовує <span className="font-mono">NEXT_PUBLIC_TG_BOT</span>{bot ? ` (зараз @${bot})` : " (не задано)"}.</p>
      </Panel>
    </div>
  );
}
