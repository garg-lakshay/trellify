"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          <span className="text-indigo-600">Trelli</span>fy
        </Link>

        {isHome ? (
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-1 rounded-md border hover:bg-neutral-100">
              Login
            </Link>
            <Link href="/register" className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              Register
            </Link>
          </div>
        ) : user ? (
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-sm border px-3 py-1 rounded hover:bg-neutral-100"
          >
            Logout
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-1 rounded-md border hover:bg-neutral-100">
              Login
            </Link>
            <Link href="/register" className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
