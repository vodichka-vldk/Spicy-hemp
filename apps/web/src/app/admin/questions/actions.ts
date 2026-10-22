"use server";

import { revalidatePath } from "next/cache";
import { answerQuestion } from "@/lib/questions";
import { store } from "@/lib/store";
import { sendMessage } from "@/lib/telegram";

export async function answer(formData: FormData) {
  const id = String(formData.get("id"));
  const text = String(formData.get("answer") ?? "");
  await answerQuestion(store(), (c, t, m) => sendMessage(c, t, m), id, text);
  revalidatePath("/admin/questions");
}

export async function closeQuestion(formData: FormData) {
  const db = store();
  const q = await db.getQuestion(String(formData.get("id")));
  if (q && q.status === "open") await db.upsertQuestion({ ...q, status: "closed" });
  revalidatePath("/admin/questions");
}
