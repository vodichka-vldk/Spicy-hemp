import { randomUUID } from "node:crypto";
import { common } from "@/data/problems";
import { getHerb } from "./content";
import { adminIds } from "./admins";
import { potLabel, type Send } from "./care";
import type { Item, Owner, Question, Store } from "./store";
import type { Locale } from "./types";

export const SLA_HOURS = 24;
export const MAX_QUESTION = 1000;
const QMSG = "qmsg:"; // setting key: Telegram message in Katya's chat -> question id

export type Symptom = keyof typeof common;
export const SYMPTOMS = Object.keys(common) as Symptom[];
export const isSymptom = (v: unknown): v is Symptom => typeof v === "string" && (SYMPTOMS as string[]).includes(v);

/** First aid from the knowledge base for the symptom the owner picked. */
export const hintFor = (symptom: string | undefined, locale: Locale): { symptom: string; fix: string } | null =>
  symptom && isSymptom(symptom) ? { symptom: common[symptom].symptom[locale], fix: common[symptom].fix[locale] } : null;

export const cleanText = (raw: string, max = MAX_QUESTION) => raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);

/** Ready-made answers Katya can paste and edit. */
export const ANSWER_TEMPLATES: Array<{ title: string; uk: string }> = [
  { title: "Дякую за фото", uk: "Дякую, що поділилися! Рослина виглядає здоровою. Продовжуйте в тому ж дусі." },
  { title: "Зменшити полив", uk: "Схоже на надлишок вологи. Дайте верхньому шару ґрунту підсохнути на 2–3 см і не залишайте воду в піддоні." },
  { title: "Більше світла", uk: "Рослині бракує світла. Поставте горщик на найсвітліше вікно, а взимку додайте лампу." },
  { title: "Потрібне фото", uk: "Надішліть, будь ласка, фото листя зблизька й усього горщика, і я підкажу точніше." },
];

export type AskResult = { ok: true; question: Question } | { ok: false; reason: "empty" | "not_yours" };

/** The owner asks Katya about a pot; she gets a card in Telegram with the pot, the question and the first-aid hint. */
export async function askQuestion(db: Store, send: Send, siteUrl: string, owner: Owner, itemCode: string, body: string, symptom?: string, now = new Date()): Promise<AskResult> {
  const text = cleanText(body);
  if (!text) return { ok: false, reason: "empty" };
  const item = await db.getItem(itemCode);
  if (!item || item.ownerId !== owner.id) return { ok: false, reason: "not_yours" };
  const q: Question = { id: randomUUID(), itemCode, ownerId: owner.id, body: text, ...(isSymptom(symptom) ? { symptom } : {}), status: "open", createdAt: now.toISOString() };
  await db.upsertQuestion(q);
  await notifyQuestion(db, send, siteUrl, owner, item, q);
  return { ok: true, question: q };
}

async function notifyQuestion(db: Store, send: Send, siteUrl: string, owner: Owner, item: Item, q: Question) {
  const herbs = item.species.map((s) => getHerb(s)?.names.uk ?? s).join(", ");
  const sym = hintFor(q.symptom, "uk");
  const who = owner.username ? `${owner.firstName ?? ""} @${owner.username}` : owner.firstName ?? `id ${owner.telegramId}`;
  const text = [`❓ Питання від ${who.trim()}`, `${potLabel(item, "uk")} · ${herbs}`, sym ? `Симптом: ${sym.symptom}` : "", "", q.body, "", "Відповісти: надішліть відповідь реплаєм на це повідомлення або в адмінці:", `${siteUrl}/admin/questions`].filter((l, i) => l !== "" || i > 0).join("\n");
  for (const chat of await adminIds(db)) {
    const res = (await send(chat, text)) as { message_id?: number } | null;
    if (res && typeof res === "object" && res.message_id) await db.setSetting(`${QMSG}${chat}:${res.message_id}`, q.id);
  }
}

export async function questionForReply(db: Store, chat: number, messageId: number): Promise<Question | null> {
  const id = await db.getSetting<string>(`${QMSG}${chat}:${messageId}`);
  return id ? db.getQuestion(id) : null;
}

export type AnswerResult = { ok: true; question: Question } | { ok: false; reason: "not_found" | "empty" };

/** Katya answers (in Telegram or the admin): the answer is saved and sent to the owner. */
export async function answerQuestion(db: Store, send: Send, id: string, answer: string, now = new Date()): Promise<AnswerResult> {
  const q = await db.getQuestion(id);
  if (!q) return { ok: false, reason: "not_found" };
  const text = cleanText(answer, 2000);
  if (!text) return { ok: false, reason: "empty" };
  const next: Question = { ...q, status: "answered", answer: text, answeredAt: now.toISOString() };
  await db.upsertQuestion(next);
  const owner = (await db.listOwners()).find((o) => o.id === q.ownerId);
  if (owner) {
    const item = await db.getItem(q.itemCode);
    const head = owner.locale === "en" ? "💬 Katya replied" : "💬 Катя відповіла";
    await send(owner.telegramId, `${head}${item ? ` (${potLabel(item, owner.locale)})` : ""}:\n\n${text}`);
  }
  return { ok: true, question: next };
}

export const isOverdue = (q: Question, now = new Date()) => q.status === "open" && now.getTime() - new Date(q.createdAt).getTime() > SLA_HOURS * 3_600_000;
export const waitingHours = (q: Question, now = new Date()) => Math.max(0, Math.floor((now.getTime() - new Date(q.createdAt).getTime()) / 3_600_000));
