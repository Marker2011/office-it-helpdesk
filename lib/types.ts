export type Role = "user" | "it" | "admin";
export type TicketStatus = "new" | "accepted" | "in_progress" | "waiting_user" | "closed";
export type Priority = "low" | "normal" | "high" | "critical";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  role: Role;
};

export type Ticket = {
  id: number;
  ticket_number: string;
  requester_id: string;
  category: string;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  accepted_at: string | null;
  closed_at: string | null;
  resolution: string | null;
};

export type TicketWithPeople = Ticket & {
  requester?: { full_name: string | null; department: string | null; email: string | null } | null;
  assignee?: { full_name: string | null; email: string | null } | null;
};
