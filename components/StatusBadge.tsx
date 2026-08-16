import type { Priority, TicketStatus } from "@/lib/types";

const statusText: Record<TicketStatus, string> = {
  new: "รอรับเคส",
  accepted: "รับเคสแล้ว",
  in_progress: "กำลังดำเนินการ",
  waiting_user: "รอ User",
  closed: "ปิดเคส",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge status-${status}`}>{statusText[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const text = { low: "Low", normal: "Normal", high: "High", critical: "Critical" }[priority];
  return <span className={`badge priority-${priority}`}>{text}</span>;
}
