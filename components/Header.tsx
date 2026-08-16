"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export default function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  async function logout() {
    await getSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isStaff = profile?.role === "it" || profile?.role === "admin";

  return (
    <header className="topbar">
      <Link href="/" className="logo"><span>HD</span> HelpDesk Live</Link>
      <nav>
        <Link href="/">My Tickets</Link>
        {isStaff && <Link href="/it">IT Dashboard</Link>}
        <span className="user-chip">{profile?.full_name || profile?.email || "User"}</span>
        <button className="ghost-btn" onClick={logout}>ออกจากระบบ</button>
      </nav>
    </header>
  );
}
