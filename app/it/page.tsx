"use client";

import AuthGate from "@/components/AuthGate";
import ItDashboard from "@/components/ItDashboard";

export default function ItPage() {
  return (
    <AuthGate>
      {({ user, profile }) => <ItDashboard user={user} profile={profile} />}
    </AuthGate>
  );
}
