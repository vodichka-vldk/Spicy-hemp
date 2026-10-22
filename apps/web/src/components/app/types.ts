export type Q = { id: string; body: string; answer: string | null; status: string; createdAt: string };
export type PotItem = { code: string; label: string; name: string | null; title: string | null; activatedAt: string | null; questions: Q[] };
export type Symptom = { key: string; label: string };
export type Owner = { firstName: string | null; locale: "uk" | "en"; notify: boolean; timezone: string; quietFrom: string; quietUntil: string };
export type Me = { owner: Owner; items: PotItem[]; symptoms: Symptom[]; startParam: string | null };
export type Task = { itemCode: string; task: "water" | "feed" | "photo"; label: string; herbs: string[]; dueAt: string; overdue: boolean };
export type Entry = { id: string; kind: string; date: string; light?: string; watered?: boolean; note?: string; symptom?: string; photos: string[]; createdAt: string };
export type Api = ReturnType<typeof import("./api").useApi>;
