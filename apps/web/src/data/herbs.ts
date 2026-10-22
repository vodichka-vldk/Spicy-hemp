import type { Herb } from "@/lib/types";
import { lamiaceae } from "./herbs-lamiaceae";
import { other } from "./herbs-other";

export const herbs: Herb[] = [...lamiaceae, ...other];
