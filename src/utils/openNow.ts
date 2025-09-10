import type { HoursMap } from "../types/store";

const DAYS: Array<"sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat"> =
  ["sun","mon","tue","wed","thu","fri","sat"];

export function isOpenNow(hours?: HoursMap): boolean {
  if (!hours) return false;
  const now = new Date();
  const key = DAYS[now.getDay()];
  const spans = hours[key] || [];
  return spans.some(span => {
    const [start, end] = span.split("-");
    const [sh, sm = "0"] = start.split(":");
    const [eh, em = "0"] = end.split(":");
    const s = new Date(now); s.setHours(Number(sh), Number(sm), 0, 0);
    const e = new Date(now); e.setHours(Number(eh), Number(em), 0, 0);
    return now >= s && now <= e;
  });
}