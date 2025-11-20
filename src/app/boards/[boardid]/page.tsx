"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, ArrowLeft, X, Trash2, Calendar, FileText, UserPlus, Mail } from "lucide-react";
import RecommendationsPanel from "@/components/RecommendationsPanel";

type Card = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  position: number;
};

type CardDetails = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  list: { id: string; title: string };
  board: { id: string; title: string };
  createdBy: { id: string; name: string | null; email: string };
  createdAt: string;
  updatedAt: string;
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

export default function BoardPage() {
  const params = useParams();
  const boardId = params.boardId as string;
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [newList, setNewList] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [newCardListId, setNewCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; listId: string } | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
  const [loadingCardDetails, setLoadingCardDetails] = useState(false);
  const [editingCardTitle, setEditingCardTitle] = useState("");
  const [editingCardDescription, setEditingCardDescription] = useState("");
  const [editingCardDueDate, setEditingCardDueDate] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }
    if (!boardId) return;

    loadBoard();
  }, [boardId, router]);

  async function loadBoard() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setBoard(data);
      } else {
        setBoard(null);
      }
    } catch (err) {
      console.log("Error loading board", err);
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }

  async function createList() {
    if (!newList || !newList.trim()) {
      setNewList(null);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newList }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to create list:", errorText);
        return;
      }

      const data = await res.json();

      setBoard({
        ...board,
        lists: [...board.lists, { ...data, cards: data.cards || [] }],
      });
      setNewList(null);
    } catch (error) {
      console.error("Error creating list:", error);
    }
  }

  async function updateListTitle(listId: string, title: string) {
    if (!title.trim()) return;

    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to update list:", errorText);
        return;
      }

      setBoard({
        ...board,
        lists: board.lists.map((list) =>
          list.id === listId ? { ...list, title } : list
        ),
      });
      setEditingListId(null);
    } catch (error) {
      console.error("Error updating list:", error);
    }
  }

  async function deleteList(listId: string) {
    if (!confirm("Delete this list?")) return;

    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to delete list:", errorText);
        return;
      }

      setBoard({
        ...board,
        lists: board.lists.filter((list) => list.id !== listId),
      });
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  }

  async function createCard(listId: string) {
    if (!newCardTitle.trim()) {
      setNewCardListId(null);
      setNewCardTitle("");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/lists/${listId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newCardTitle }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to create card:", errorText);
        return;
      }

      const data = await res.json();

      if (board) {
        setBoard({
          ...board,
          lists: board.lists.map((list) =>
            list.id === listId
              ? { ...list, cards: [...list.cards, data] }
              : list
          ),
        });
        setNewCardListId(null);
        setNewCardTitle("");
      }
    } catch (error) {
      console.error("Error creating card:", error);
    }
  }

  async function openCardDetails(cardId: string) {
    setSelectedCardId(cardId);
    setLoadingCardDetails(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCardDetails(data);
        setEditingCardTitle(data.title);
        setEditingCardDescription(data.description || "");
        setEditingCardDueDate(data.dueDate ? data.dueDate.split("T")[0] : "");
      }
    } catch (error) {
      console.error("Error loading card details:", error);
    } finally {
      setLoadingCardDetails(false);
    }
  }

  async function updateCard(cardId: string) {
    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingCardTitle,
          description: editingCardDescription,
          dueDate: editingCardDueDate || null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to update card:", errorText);
        return;
      }

      const updated = await res.json();

      setBoard({
        ...board,
        lists: board.lists.map((list) => ({
          ...list,
          cards: list.cards.map((card) =>
            card.id === cardId
              ? {
                ...card,
                title: updated.title,
                description: updated.description,
                dueDate: updated.dueDate,
              }
              : card
          ),
        })),
      });

      if (cardDetails) {
        setCardDetails({
          ...cardDetails,
          title: updated.title,
          description: updated.description,
          dueDate: updated.dueDate,
        });
      }
    } catch (error) {
      console.error("Error updating card:", error);
    }
  }

  async function updateCardTitle(cardId: string, title: string) {
    if (!title.trim()) return;

    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to update card:", errorText);
        return;
      }

      setBoard({
        ...board,
        lists: board.lists.map((list) => ({
          ...list,
          cards: list.cards.map((card) =>
            card.id === cardId ? { ...card, title } : card
          ),
        })),
      });
      setEditingCardId(null);
    } catch (error) {
      console.error("Error updating card:", error);
    }
  }

  async function deleteCard(cardId: string, listId: string) {
    if (!confirm("Delete this card?")) return;

    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to delete card:", errorText);
        return;
      }

      setBoard({
        ...board,
        lists: board.lists.map((list) =>
          list.id === listId
            ? { ...list, cards: list.cards.filter((card) => card.id !== cardId) }
            : list
        ),
      });

      if (selectedCardId === cardId) {
        setSelectedCardId(null);
        setCardDetails(null);
      }
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  }

  async function moveCard(cardId: string, toListId: string, newPosition: number) {
    const token = localStorage.getItem("token");
    if (!token || !board) return;

    try {
      const res = await fetch(`/api/cards/${cardId}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toListId, newPosition }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to move card:", errorText);
        return;
      }

      await loadBoard();
    } catch (error) {
      console.error("Error moving card:", error);
    }
  }

  async function inviteUser() {
    if (!inviteEmail.trim()) return;

    const token = localStorage.getItem("token");
    if (!token || !board) return;

    setInviting(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to invite user");
        return;
      }

      alert("User invited sucessfully! An email has been sent.");
      setInviteEmail("");
      setShowInviteModal(false);
      await loadBoard();
    } catch (error) {
      console.error("Error inviting user:", error);
      alert("Failed to invite user");
    } finally {
      setInviting(false);
    }
  }

  function handleDragStart(e: React.DragEvent, cardId: string, listId: string) {
    setDraggedCard({ cardId, listId });
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    setDraggedCard(null);
    setDragOverListId(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetListId: string) {
    e.preventDefault();
    if (!draggedCard || !board) return;

    const targetList = board.lists.find((l) => l.id === targetListId);
    if (!targetList) return;

    const newPosition = targetList.cards.length;
    moveCard(draggedCard.cardId, targetListId, newPosition);
    setDraggedCard(null);
    setDragOverListId(null);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Board not found.</p>
          <button
            onClick={() => router.push("/boards")}
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            Go back to boards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50 overflow-hidden">
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/boards")}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="text-2xl font-semibold text-neutral-900">{board.title}</h1>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            <UserPlus size={18} /> Invite
          </button>
        </div>
      </div>

      {board && (
        <RecommendationsPanel
          boardId={boardId}
          board={board}
          onMoveCard={moveCard}
          onRefresh={loadBoard}
        />
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="inline-flex items-start gap-4 p-4 h-full min-w-max">
          {board.lists.map((list) => (
            <div
              key={list.id}
              className={`w-72 bg-neutral-100 rounded-lg shadow-sm flex flex-col h-full max-h-full ${dragOverListId === list.id ? "ring-2 ring-indigo-500 ring-offset-2" : ""
                }`}
              onDragOver={(e) => {
                handleDragOver(e);
                setDragOverListId(list.id);
              }}
              onDragLeave={() => setDragOverListId(null)}
              onDrop={(e) => handleDrop(e, list.id)}
            >
              <div className="flex-shrink-0 p-3 border-b border-neutral-200">
                {editingListId === list.id ? (
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => {
                      updateListTitle(list.id, editingTitle);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateListTitle(list.id, editingTitle);
                      } else if (e.key === "Escape") {
                        setEditingListId(null);
                      }
                    }}
                    autoFocus
                    className="w-full border border-indigo-300 rounded px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      className="font-semibold text-neutral-800 cursor-pointer hover:bg-neutral-200 px-2 py-1 rounded flex-1 transition"
                      onClick={() => {
                        setEditingListId(list.id);
                        setEditingTitle(list.title);
                      }}
                    >
                      {list.title}
                    </h2>
                    <button
                      onClick={() => deleteList(list.id)}
                      className="text-neutral-400 hover:text-red-600 p-1.5 rounded hover:bg-neutral-200 transition"
                      title="Delete list"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
                {(list.cards || []).map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id, list.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-white p-3 rounded-md border border-neutral-200 shadow-sm cursor-move hover:shadow-md hover:border-neutral-300 transition-all group"
                  >
                    {editingCardId === card.id ? (
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          updateCardTitle(card.id, editingTitle);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateCardTitle(card.id, editingTitle);
                          } else if (e.key === "Escape") {
                            setEditingCardId(null);
                          }
                        }}
                        autoFocus
                        className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="font-medium text-sm text-neutral-800 flex-1 cursor-pointer hover:text-indigo-600 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCardDetails(card.id);
                          }}
                        >
                          {card.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCard(card.id, list.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 p-1 rounded hover:bg-neutral-100 transition"
                          title="Delete card"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 p-3 border-t border-neutral-200">
                {newCardListId === list.id ? (
                  <div>
                    <input
                      placeholder="Enter card title..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onBlur={() => {
                        createCard(list.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          createCard(list.id);
                        } else if (e.key === "Escape") {
                          setNewCardListId(null);
                          setNewCardTitle("");
                        }
                      }}
                      autoFocus
                      className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setNewCardListId(list.id)}
                    className="w-full text-sm text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-300 rounded-md py-2 hover:bg-neutral-50 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} /> Add Card
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="w-72 flex-shrink-0">
            {newList !== null ? (
              <div className="bg-white border-2 border-dashed border-neutral-300 rounded-lg p-4">
                <input
                  placeholder="Enter list title..."
                  value={newList}
                  onChange={(e) => setNewList(e.target.value)}
                  onBlur={() => {
                    if (newList.trim()) {
                      createList();
                    } else {
                      setNewList(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      createList();
                    } else if (e.key === "Escape") {
                      setNewList(null);
                    }
                  }}
                  autoFocus
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ) : (
              <button
                onClick={() => setNewList("")}
                className="w-full bg-white border-2 border-dashed border-neutral-300 rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50 transition flex items-center justify-center gap-2 text-neutral-600 hover:text-indigo-600"
              >
                <Plus size={20} /> Add List
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedCardId && (
        <div
          className="fixed inset-0 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedCardId(null);
            setCardDetails(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingCardDetails ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-neutral-500">Loading card details...</p>
                </div>
              </div>
            ) : cardDetails ? (
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <input
                      value={editingCardTitle}
                      onChange={(e) => setEditingCardTitle(e.target.value)}
                      onBlur={() => updateCard(cardDetails.id)}
                      className="text-2xl font-semibold text-neutral-900 w-full border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 -ml-2"
                    />
                    <p className="text-sm text-neutral-500 mt-1">
                      in list <span className="font-medium">{cardDetails.list.title}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCardId(null);
                      setCardDetails(null);
                    }}
                    className="text-neutral-400 hover:text-neutral-600 p-2 rounded hover:bg-neutral-100 transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={20} className="text-neutral-600" />
                    <h3 className="font-semibold text-neutral-800">Description</h3>
                  </div>
                  <textarea
                    value={editingCardDescription}
                    onChange={(e) => setEditingCardDescription(e.target.value)}
                    onBlur={() => updateCard(cardDetails.id)}
                    placeholder="Add a more detailed description..."
                    className="w-full min-h-[100px] border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={20} className="text-neutral-600" />
                    <h3 className="font-semibold text-neutral-800">Due Date</h3>
                  </div>
                  <input
                    type="date"
                    value={editingCardDueDate}
                    onChange={(e) => setEditingCardDueDate(e.target.value)}
                    onBlur={() => updateCard(cardDetails.id)}
                    className="border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {editingCardDueDate && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Due: {new Date(editingCardDueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <button
                    onClick={() => {
                      if (confirm("Delete this card?")) {
                        const list = board?.lists.find((l) =>
                          l.cards.some((c) => c.id === cardDetails.id)
                        );
                        if (list) {
                          deleteCard(cardDetails.id, list.id);
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-md transition"
                  >
                    Delete Card
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    Created {new Date(cardDetails.createdAt).toLocaleDateString()} by{" "}
                    {cardDetails.createdBy.name || cardDetails.createdBy.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-12">
                <p className="text-neutral-500">Card not found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showInviteModal && (
        <div
          className="fixed inset-0 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowInviteModal(false);
            setInviteEmail("");
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Invite User</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded hover:bg-neutral-100 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    inviteUser();
                  } else if (e.key === "Escape") {
                    setShowInviteModal(false);
                    setInviteEmail("");
                  }
                }}
                autoFocus
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-neutral-500 mt-2">
                The user must have an account to be invited.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                }}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={inviteUser}
                disabled={!inviteEmail.trim() || inviting}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {inviting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Inviting...
                  </>
                ) : (
                  <>
                    <Mail size={16} /> Send Invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
