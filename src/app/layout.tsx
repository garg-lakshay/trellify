import "./globals.css";
import type { ReactNode } from "react";
import Nav from "@/components/nav";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Trellify",
  description: "Task management app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen">
        <AuthProvider>
          <Nav />
          <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
