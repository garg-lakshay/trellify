"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid } from "lucide-react";

type Board = {
  id: string;
  title: string;
};

export default function BoardsPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoard, setNewBoard] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchBoards() {
      try {
        const res = await fetch("/api/boards", {
          headers: { Authorization: `Bearer ${token}`  },
        });
        const data = await res.json();
        setBoards(Array.isArray(data) ? data : data.boards ?? []);

      } catch (_) {
        console.log("Error loading boards");
      } finally {
        setLoading(false);
      }
    }

    fetchBoards();
  }, [router]);

  async function createBoard() {
    if (!newBoard.trim()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newBoard }),
      });

      const data = await res.json();
      if (res.ok) {
        setBoards((prev) => [...prev, data]);
        setNewBoard("");
      } else {
        console.log("Failed to create board");
      }
    } catch (err) {
      console.log("Error creating board", err);
    }
  }

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <LayoutGrid className="w-7 h-7 text-indigo-600" /> Boards
        </h1>

        <div className="flex gap-3">
          <input
            placeholder="New board name"
            value={newBoard}
            onChange={(e) => setNewBoard(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm"
          />
          <button
            onClick={createBoard}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading boards...</p>
      ) : boards.length === 0 ? (
        <p className="text-neutral-500">No boards yet. Create one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => router.push(`/boards/${board.id}`)}
              className="p-6 bg-white border rounded-xl hover:shadow-md transition cursor-pointer"
            >
              <h2 className="font-medium text-lg mb-2">{board.title}</h2>
              <p className="text-sm text-neutral-500">Open board →</p>
            </div>
          ))}
        </div>
      )}

      
    </div>
  );
}
