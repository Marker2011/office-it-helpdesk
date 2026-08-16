"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { Profile, TicketWithPeople } from "@/lib/types";
import { duration, formatBangkok } from "@/lib/time";
import { PriorityBadge, StatusBadge } from "./StatusBadge";
import Header from "./Header";

export default function ItDashboard({ user, profile }: { user: User; profile: Profile | null }) {
  const supabase = getSupabase();
  const [tickets, setTickets] = useState<TicketWithPeople[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [closeId, setCloseId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"open" | "all" | "closed">("open");
  const isStaff = profile?.role === "it" || profile?.role === "admin";

  const load = useCallback(async () => {
    if (!isStaff) return;
    const { data } = await supabase
      .from("tickets")
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(full_name,department,email),
        assignee:profiles!tickets_assigned_to_fkey(full_name,email)
      `)
      .order("created_at", { ascending: false });
    setTickets((data as unknown as TicketWithPeople[]) ?? []);
    setLoading(false);
  }, [isStaff, supabase]);

  useEffect(() => {
    if (!isStaff) {
      setLoading(false);
      return;
    }
    load();
    const channel = supabase
      .channel("it-dashboard-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isStaff, load, supabase]);

  const visible = useMemo(() => tickets.filter((t) => {
    if (filter === "open") return t.status !== "closed";
    if (filter === "closed") return t.status === "closed";
    return true;
  }), [tickets, filter]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const createdToday = tickets.filter((t) =>
      new Date(t.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) === today
    );
    const closedToday = tickets.filter((t) =>
      t.closed_at && new Date(t.closed_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) === today
    );
    return {
      new: tickets.filter((t) => t.status === "new").length,
      active: tickets.filter((t) => ["accepted", "in_progress", "waiting_user"].includes(t.status)).length,
      closedToday: closedToday.length,
      totalToday: createdToday.length,
    };
  }, [tickets]);

  async function accept(id: number) {
    setBusy(id);
    await supabase.rpc("accept_ticket", { p_ticket_id: id });
    setBusy(null);
    load();
  }

  async function setStatus(id: number, status: "in_progress" | "waiting_user") {
    setBusy(id);
    await supabase.rpc("set_ticket_status", { p_ticket_id: id, p_status: status });
    setBusy(null);
    load();
  }

  async function closeTicket(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const resolution = String(fd.get("resolution") || "").trim();
    if (!resolution) return;
    setBusy(id);
    await supabase.rpc("close_ticket", { p_ticket_id: id, p_resolution: resolution });
    setBusy(null);
    setCloseId(null);
    load();
  }

  if (!isStaff) {
    return (
      <>
        <Header profile={profile} />
        <main className="page"><div className="panel access-denied"><h1>ไม่มีสิทธิ์เข้าหน้านี้</h1><p>บัญชีนี้เป็น User กรุณาให้ Admin เปลี่ยน role เป็น <code>it</code> หรือ <code>admin</code></p></div></main>
      </>
    );
  }

  return (
    <>
      <Header profile={profile} />
      <main className="page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">IT OPERATIONS</p>
            <h1>IT Dashboard</h1>
            <p className="muted">รับเคสและปิดเคส — เวลาอ้างอิงจาก Database</p>
          </div>
          <span className="live-pill">● REALTIME CONNECTED</span>
        </div>

        <section className="stat-grid">
          <div className="stat-card"><span>เคสใหม่</span><strong>{stats.new}</strong><small>รอ IT รับ</small></div>
          <div className="stat-card"><span>กำลังดำเนินการ</span><strong>{stats.active}</strong><small>Accepted / Working / Waiting</small></div>
          <div className="stat-card"><span>แจ้งวันนี้</span><strong>{stats.totalToday}</strong><small>Asia/Bangkok</small></div>
          <div className="stat-card"><span>ปิดวันนี้</span><strong>{stats.closedToday}</strong><small>จากเคสที่แจ้งวันนี้</small></div>
        </section>

        <section className="panel">
          <div className="panel-title toolbar">
            <div><h2>Ticket Queue</h2><span>{visible.length} เคส</span></div>
            <div className="segmented mini">
              <button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>Open</button>
              <button className={filter === "closed" ? "active" : ""} onClick={() => setFilter("closed")}>Closed</button>
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
            </div>
          </div>

          {loading ? <p className="muted">กำลังโหลด…</p> : (
            <div className="ticket-list">
              {visible.map((t) => (
                <article className={`ticket-card staff-card ${t.priority === "critical" ? "critical-edge" : ""}`} key={t.id}>
                  <div className="ticket-main">
                    <div className="ticket-meta">
                      <strong>{t.ticket_number}</strong>
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <div className="requester-line">
                      <span>{t.requester?.full_name || t.requester?.email || "Unknown user"}</span>
                      <span>{t.requester?.department || "—"}</span>
                      <span>{t.category}</span>
                    </div>
                    {t.assignee && <small>ผู้รับผิดชอบ: {t.assignee.full_name || t.assignee.email}</small>}
                    {t.resolution && <div className="resolution-box"><b>Resolution:</b> {t.resolution}</div>}
                  </div>

                  <div className="staff-side">
                    <div className="mini-times">
                      <div><span>แจ้ง</span><b>{formatBangkok(t.created_at)}</b></div>
                      <div><span>รับ</span><b>{formatBangkok(t.accepted_at)}</b></div>
                      <div><span>Response</span><b>{duration(t.created_at, t.accepted_at)}</b></div>
                    </div>

                    {t.status === "new" && (
                      <button className="primary-btn" disabled={busy === t.id} onClick={() => accept(t.id)}>
                        {busy === t.id ? "กำลังรับ…" : "รับเคส"}
                      </button>
                    )}

                    {["accepted", "in_progress", "waiting_user"].includes(t.status) && (
                      <div className="action-stack">
                        {t.status !== "in_progress" && <button className="secondary-btn" onClick={() => setStatus(t.id, "in_progress")}>กำลังดำเนินการ</button>}
                        {t.status !== "waiting_user" && <button className="secondary-btn" onClick={() => setStatus(t.id, "waiting_user")}>รอ User</button>}
                        <button className="close-btn" onClick={() => setCloseId(closeId === t.id ? null : t.id)}>ปิดเคส</button>
                      </div>
                    )}

                    {closeId === t.id && (
                      <form className="close-form" onSubmit={(e) => closeTicket(e, t.id)}>
                        <textarea name="resolution" required rows={3} placeholder="ระบุวิธีแก้ไขก่อนปิดเคส" />
                        <button className="close-btn" disabled={busy === t.id}>ยืนยันปิดเคส</button>
                      </form>
                    )}

                    {t.status === "closed" && (
                      <div className="closed-summary">
                        <span>ปิด {formatBangkok(t.closed_at)}</span>
                        <strong>{duration(t.created_at, t.closed_at)}</strong>
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {visible.length === 0 && <div className="empty-state"><div>✓</div><h3>ไม่มีเคสในรายการนี้</h3></div>}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
