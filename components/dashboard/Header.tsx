"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Header() {
  const [name, setName] = useState("");
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setName(d.user?.name || ""))
      .catch(() => {});
  }, []);
  return (
    <header className="hessa-header">
      <div>
        <p className="eyebrow">أهلًا {name}</p>
        <h2>خطوة جديدة نحو هدفك</h2>
      </div>
      <div className="actions">
        <Link href="/dashboard/account" className="text-button">
          حسابي
        </Link>
        <Link href="/dashboard/learning-plan" className="secondary-button">
          خطة اليوم
        </Link>
        <button
          className="text-button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
          }}
        >
          خروج
        </button>
      </div>
    </header>
  );
}
