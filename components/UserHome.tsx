"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { Profile, Ticket } from "@/lib/types";
import { formatBangkok, duration } from "@/lib/time";
import { PriorityBadge, StatusBadge } from "./StatusBadge";
import Header from "./Header";

const categories = [
  "Computer / Notebook",
  "Printer",
  "Internet / Wi-Fi",
  "Email",
  "Software",
  "Account / Password",
  "Other",
];

export default function UserHome({ user, profile }: { user: User; profile: Profile | null }) {
  const supabase = getSupabase();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  }, [supabase, user.id]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`my-tickets-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, supabase, user.id]);

  async function createTicket(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from("tickets").insert({
      requester_id: user.id,
      category: String(fd.get("category")),
      title: String(fd.get("title")),
      description: String(fd.get("description")),
      priority: String(fd.get("priority")),
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    e.currentTarget.reset();
    setFormOpen(false);
    load();
  }

  return (
    <>
      <Header profile={profile} />
      <main className="page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">EMPLOYEE PORTAL</p>
            <h1>เคส IT ของฉัน</h1>
            <p className="muted">สถานะจะอัปเดตอัตโนมัติเมื่อทีม IT รับหรือปิดเคส</p>
          </div>
          <button className="primary-btn compact" onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? "ยกเลิก" : "+ แจ้งปัญหา IT"}
          </button>
        </div>

        {formOpen && (
          <section className="panel form-panel">
            <div className="panel-title"><h2>แจ้งปัญหาใหม่</h2><span>เวลาสร้างเคสบันทึกจาก Database</span></div>
            <form className="ticket-form" onSubmit={createTicket}>
              <label>ประเภทปัญหา
                <select name="category" required defaultValue="">
                  <option value="" disabled>เลือกประเภท</option>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>ความเร่งด่วน
                <select name="priority" defaultValue="normal">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="wide">หัวข้อ
                <input name="title" required maxLength={140} placeholder="เช่น Printer ชั้น 3 ปริ้นไม่ออก" />
              </label>
              <label className="wide">รายละเอียด
                <textarea name="description" required rows={5} placeholder="อธิบายอาการ, error ที่พบ, ชื่ออุปกรณ์ หรือสิ่งที่ลองแก้แล้ว" />
              </label>
              {error && <div className="alert error wide">{error}</div>}
              <div className="wide form-actions">
                <button className="primary-btn" disabled={saving}>{saving ? "กำลังส่ง…" : "ส่งเคส"}</button>
              </div>
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-title">
            <h2>รายการเคส</h2>
            <span className="live-dot">● LIVE</span>
          </div>
          {loading ? <p className="muted">กำลังโหลด…</p> : tickets.length === 0 ? (
            <div className="empty-state"><div>✓</div><h3>ยังไม่มีเคส</h3><p>เมื่อมีปัญหา กด “แจ้งปัญหา IT” ได้เลย</p></div>
          ) : (
            <div className="ticket-list">
              {tickets.map((t) => (
                <article className="ticket-card" key={t.id}>
                  <div className="ticket-main">
                    <div className="ticket-meta">
                      <strong>{t.ticket_number}</strong>
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <small>{t.category}</small>
                  </div>
                  <div className="ticket-times">
                    <div><span>แจ้งเมื่อ</span><strong>{formatBangkok(t.created_at)}</strong></div>
                    <div><span>IT รับเคส</span><strong>{formatBangkok(t.accepted_at)}</strong></div>
                    <div><span>ปิดเคส</span><strong>{formatBangkok(t.closed_at)}</strong></div>
                    <div><span>Response</span><strong>{duration(t.created_at, t.accepted_at)}</strong></div>
                    <div><span>Resolution</span><strong>{duration(t.created_at, t.closed_at)}</strong></div>
                    {t.resolution && <div className="resolution"><span>วิธีแก้</span><strong>{t.resolution}</strong></div>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
