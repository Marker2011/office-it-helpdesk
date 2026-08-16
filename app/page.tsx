"use client";

import AuthGate from "@/components/AuthGate";
import UserHome from "@/components/UserHome";

export default function HomePage() {
  return (
    <AuthGate>
      {({ user, profile }) => <UserHome user={user} profile={profile} />}
    </AuthGate>
  );
}
