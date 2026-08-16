"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import type {
  AuthChangeEvent,
  Session,
  User,
} from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export default function AuthGate({
  children,
}: {
  children: (ctx: {
    user: User;
    profile: Profile | null;
    refreshProfile: () => Promise<void>;
  }) => ReactNode;
}) {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProfile(id: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,full_name,department,role")
      .eq("id", id)
      .single();

    setProfile((data as Profile | null) ?? null);
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(
      ({ data }: { data: { user: User | null } }) => {
        if (!mounted) return;

        const next = data.user ?? null;
        setUser(next);

        if (next) {
          loadProfile(next.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }
    );

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const next = session?.user ?? null;
        setUser(next);

        if (next) {
          void loadProfile(next.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const fullName = String(fd.get("full_name") || "").trim();
    const department = String(fd.get("department") || "").trim();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          department,
        },
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      setMessage("สร้างบัญชีแล้ว กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
    } else {
      setMessage("สร้างบัญชีเรียบร้อย");
    }
  }

  if (loading) {
    return (
      <main className="center-screen">
        <div className="loader-card">กำลังเชื่อมต่อ HelpDesk…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="brand-panel">
          <div className="brand-mark">HD</div>
          <p className="eyebrow">OFFICE IT SUPPORT</p>
          <h1>HelpDesk Live</h1>
          <p className="hero-copy">
            แจ้งปัญหา IT, รับเคส และปิดเคส พร้อมบันทึกเวลาแบบเรียลไทม์
          </p>
          <div className="feature-row">
            <span>● Realtime</span>
            <span>● Response time</span>
            <span>● Resolution time</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="segmented">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              เข้าสู่ระบบ
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              สร้างบัญชี
            </button>
          </div>

          <form onSubmit={submit} className="stack">
            {mode === "signup" && (
              <>
                <label>
                  ชื่อ-นามสกุล
                  <input
                    name="full_name"
                    required
                    placeholder="เช่น สมชาย ใจดี"
                  />
                </label>
                <label>
                  แผนก
                  <input
                    name="department"
                    required
                    placeholder="เช่น Accounting"
                  />
                </label>
              </>
            )}

            <label>
              อีเมลบริษัท
              <input
                name="email"
                type="email"
                required
                placeholder="name@company.com"
              />
            </label>

            <label>
              รหัสผ่าน
              <input
                name="password"
                type="password"
                minLength={6}
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </label>

            {error && <div className="alert error">{error}</div>}
            {message && <div className="alert success">{message}</div>}

            <button className="primary-btn" type="submit">
              {mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return <>{children({ user, profile, refreshProfile })}</>;
}
