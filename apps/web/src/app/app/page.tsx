import { MiniApp } from "@/components/MiniApp";

export const dynamic = "force-static";

export default function AppPage() {
  return <MiniApp bot={process.env.NEXT_PUBLIC_TG_BOT ?? ""} />;
}
