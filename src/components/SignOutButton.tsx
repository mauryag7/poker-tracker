"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button className="secondary-btn" onClick={() => signOut({ callbackUrl: '/login' })} style={{ margin: 0, padding: "5px 10px", width: "auto" }}>Sign Out</button>
  );
}
