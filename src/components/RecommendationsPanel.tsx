"use client";

import { useEffect, useState } from "react";
import { Sparkles, Calendar, ArrowRight, Link2, RefreshCw, X } from "lucide-react";

type Recommendation = {
  id: string;
  type: string;
  score: number;
  payload: any;
  cardId: string | null;
  createdAt: string;
};

type Card = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  position: number;
};

type List = {
  id: string;
  title: string;
  position: number;
  cards: Card[];
};

type Board = {
  id: string;
  title: string;
  lists: List[];
};

interface RecommendationsPanelProps {
  boardId: string;
  board: Board | null;
  onMoveCard?: (cardId: string, toListId: string, newPosition: number) => void;
  onRefresh?: () => void;
}

export default function RecommendationsPanel({
  boardId,
  board,
  onMoveCard,
  onRefresh,
}: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [boardId]);

  async function loadRecommendations() {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const res = await fetch(`/api/boards/${boardId}/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      } else {
        console.log("Failed to load recomendations");
      }
    } catch (error) {
      console.error("Error loading recomendations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshRecommendations() {
    const token = localStorage.getItem("token");
    if (!token) return;

    setRefreshing(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/recommendations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error("Error refreshing recomendations:", error);
    } finally {
      setRefreshing(false);
    }
  }

  function handleMoveCard(cardId: string, targetListId: string) {
    if (onMoveCard && board) {
      const targetList = board.lists.find(l => l.id === targetListId);
      if (targetList) {
        const newPosition = targetList.cards.length;
        onMoveCard(cardId, targetListId, newPosition);
      }
    }
    setRecommendations(recs => recs.filter(r => !(r.cardId === cardId && r.type === "list_movement")));
  }

  function getCardTitle(cardId: string | null): string {
    if (!cardId || !board) {
      return "Unknown Card";
    }

    for (let i = 0; i < board.lists.length; i++) {
      const list = board.lists[i];
      const card = list.cards.find(c => c.id === cardId);
      if (card) {
        return card.title;
      }
    }

    return "Unknown Card";
  }

  const dueDateRecs = recommendations.filter(r => r.type === "due_date");
  const listMovementRecs = recommendations.filter(r => r.type === "list_movement");
  const groupCardsRecs = recommendations.filter(r => r.type === "group_cards");

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-20 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition flex items-center gap-2 z-40"
      >
        <Sparkles size={18} />
        Recommendations
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-xl border border-neutral-200 z-40 max-h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-600" />
          <h3 className="font-semibold text-neutral-900">Recommendations</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshRecommendations}
            disabled={refreshing}
            className="text-neutral-500 hover:text-indigo-600 p-1.5 rounded hover:bg-neutral-100 transition"
            title="Refresh recomendations"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded hover:bg-neutral-100 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Sparkles size={32} className="mx-auto mb-2 text-neutral-300" />
            <p className="text-sm">No recomendations availble</p>
            <p className="text-xs mt-1">Try refreshing to genrate new ones</p>
          </div>
        ) : (
          <>
            {dueDateRecs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  Due Dates
                </h4>
                <div className="space-y-2">
                  {dueDateRecs.map(rec => (
                    <div
                      key={rec.id}
                      className="bg-indigo-50 border border-indigo-200 rounded-md p-3"
                    >
                      <p className="text-sm font-medium text-neutral-900 mb-1">
                        {rec.payload.cardTitle || getCardTitle(rec.cardId)}
                      </p>
                      <p className="text-xs text-neutral-600 mb-1">
                        Due: {new Date(rec.payload.dueDate).toLocaleDateString()}
                      </p>
                      {rec.payload.daysUntil !== undefined && (
                        <p className="text-xs text-indigo-600 mb-1">
                          {rec.payload.daysUntil} day{rec.payload.daysUntil !== 1 ? 's' : ''} away
                        </p>
                      )}
                      <p className="text-xs text-neutral-500">
                        {rec.payload.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {listMovementRecs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ArrowRight size={14} />
                  Suggested Moves
                </h4>
                <div className="space-y-2">
                  {listMovementRecs.map(rec => (
                    <div
                      key={rec.id}
                      className="bg-amber-50 border border-amber-200 rounded-md p-3"
                    >
                      <p className="text-sm font-medium text-neutral-900 mb-1">
                        {getCardTitle(rec.cardId)}
                      </p>
                      <p className="text-xs text-neutral-600 mb-1">
                        Move to <span className="font-medium">{rec.payload.targetListTitle}</span>
                      </p>
                      <p className="text-xs text-neutral-500 mb-2">
                        {rec.payload.reason}
                      </p>
                      <button
                        onClick={() => rec.cardId && handleMoveCard(rec.cardId, rec.payload.targetListId)}
                        className="text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700 transition"
                      >
                        Move
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupCardsRecs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Link2 size={14} />
                  Group Together
                </h4>
                <div className="space-y-2">
                  {groupCardsRecs.map(rec => (
                    <div
                      key={rec.id}
                      className="bg-purple-50 border border-purple-200 rounded-md p-3"
                    >
                      <p className="text-xs text-neutral-600 mb-2">
                        {rec.payload.reason}
                      </p>
                      <ul className="space-y-1">
                        {rec.payload.cardTitles?.slice(0, 5).map((title: string, idx: number) => (
                          <li key={idx} className="text-xs text-neutral-700">
                            • {title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
