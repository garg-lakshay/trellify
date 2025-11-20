"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  KanbanSquare,
  Users,
  Lightbulb,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-between px-6">
      <motion.section
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mt-20 mb-12 w-full"
      >
        <h2 className="text-5xl font-semibold mb-4 leading-tight">
          Organize Work. <span className="text-indigo-600">Effortlessly.</span>
        </h2>
        <p className="text-neutral-600 text-lg max-w-2xl mx-auto mb-10">
          Create boards, manage tasks, colaborate with your team, and receive
          smart recomendations — all inside Trellify, your modern task
          management workspace.
        </p>

        <Link
          href="/register"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg px-8 py-3 rounded-md shadow-sm transition"
        >
          Start Managing Tasks
        </Link>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 mb-24 max-w-6xl w-full"
      >
        <FeatureCard
          icon={<KanbanSquare className="w-10 h-10 text-indigo-600" />}
          title="Interactive Boards"
          description="Create boards, lists, and cards with an intuitive drag-and-drop interface."
        />

        <FeatureCard
          icon={<Users className="w-10 h-10 text-indigo-600" />}
          title="Team Colaboration"
          description="Invite members to boards and colaborate in real-time on shared tasks."
        />

        <FeatureCard
          icon={<Lightbulb className="w-10 h-10 text-indigo-600" />}
          title="Smart Sugestions"
          description="Get automatic recomendations for due dates, card movement, and grouping."
        />

        <FeatureCard
          icon={<Sparkles className="w-10 h-10 text-indigo-600" />}
          title="Clean & Fast UI"
          description="A seamless user experience powered by Next.js, TailwindCSS, and Prisma."
        />
      </motion.section>

      <footer className="pb-6 text-center text-sm text-neutral-500 w-full">
        © {new Date().getFullYear()} Trellify —{" "}
        <span className="text-neutral-800 font-medium">Lakshay Garg</span>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition transform hover:-translate-y-1">
      <div className="flex flex-col items-center">
        {icon}
        <h3 className="text-lg font-medium mt-4 mb-2">{title}</h3>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
    </div>
  );
}
