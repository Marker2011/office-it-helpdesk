export function formatBangkok(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function duration(from: string | null, to: string | null) {
  if (!from || !to) return "—";
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (ms < 0) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} ชม. ${rest} นาที`;
}
