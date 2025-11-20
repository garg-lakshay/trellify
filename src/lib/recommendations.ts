import prisma from "@/lib/prisma";

type CardWithList = {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    listId: string;
    list: {
        id: string;
        title: string;
    };
};

type List = {
    id: string;
    title: string;
    position: number;
};

function suggestListMovement(
    card: CardWithList,
    lists: List[]
): { targetListId: string; targetListTitle: string; reason: string } | null {
    const description = (card.description || "").toLowerCase();
    const currentListTitle = card.list.title.toLowerCase();

    if (description.includes("started")) {
        const isInTodo = currentListTitle.includes("todo") ||
            currentListTitle.includes("to do") ||
            currentListTitle.includes("backlog");

        if (isInTodo) {
            const progressList = lists.find(list => {
                const title = list.title.toLowerCase();
                return title.includes("progress") ||
                    title.includes("in progress") ||
                    title.includes("doing");
            });

            if (progressList && progressList.id !== card.listId) {
                return {
                    targetListId: progressList.id,
                    targetListTitle: progressList.title,
                    reason: "Card description contains 'started' - should be in Progress"
                };
            }
        }
    }

    return null;
}

function calculateSimilarity(card1: CardWithList, card2: CardWithList): number {
    if (card1.id === card2.id) return 0;

    const text1 = `${card1.title} ${card1.description || ""}`.toLowerCase();
    const text2 = `${card2.title} ${card2.description || ""}`.toLowerCase();

    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) {
        return 0;
    }

    return intersection.size / union.size;
}

function findRelatedCards(
    card: CardWithList,
    allCards: CardWithList[],
    threshold: number = 0.2
): Array<{ card: CardWithList; similarity: number }> {
    const similarities = allCards
        .map(otherCard => ({
            card: otherCard,
            similarity: calculateSimilarity(card, otherCard)
        }))
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

    return similarities;
}

export async function generateRecommendations(boardId: string): Promise<void> {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
            lists: {
                orderBy: { position: "asc" },
                include: {
                    cards: {
                        orderBy: { position: "asc" },
                    },
                },
            },
        },
    });

    if (!board) {
        throw new Error("Board not found");
    }

    await prisma.recommendation.deleteMany({
        where: { boardId },
    });

    const allCards: CardWithList[] = [];
    for (let i = 0; i < board.lists.length; i++) {
        const list = board.lists[i];
        for (const card of list.cards) {
            allCards.push({
                ...card,
                list: {
                    id: list.id,
                    title: list.title,
                },
            });
        }
    }

    const lists: List[] = board.lists.map(list => ({
        id: list.id,
        title: list.title,
        position: list.position,
    }));

    const recomendations: Array<{
        type: string;
        score: number;
        payload: any;
        cardId: string | null;
    }> = [];

    const cardsWithDueDates = allCards.filter(card => {
        return card.dueDate !== null;
    });

    if (cardsWithDueDates.length === 1) {
        const card = cardsWithDueDates[0];
        recomendations.push({
            type: "due_date",
            score: 0.7,
            payload: {
                cardId: card.id,
                cardTitle: card.title,
                dueDate: card.dueDate!.toISOString(),
                reason: "This card has a due date",
            },
            cardId: card.id,
        });
    } else if (cardsWithDueDates.length >= 2) {
        const now = new Date();
        const sortedByDueDate = cardsWithDueDates
            .map(card => ({
                card,
                daysUntil: Math.floor((card.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            }))
            .filter(item => item.daysUntil >= 0)
            .sort((a, b) => a.daysUntil - b.daysUntil);

        if (sortedByDueDate.length > 0) {
            const nearestCard = sortedByDueDate[0];
            recomendations.push({
                type: "due_date",
                score: 0.8,
                payload: {
                    cardId: nearestCard.card.id,
                    cardTitle: nearestCard.card.title,
                    dueDate: nearestCard.card.dueDate!.toISOString(),
                    daysUntil: nearestCard.daysUntil,
                    reason: `This card has the nearest due date (${nearestCard.daysUntil} day${nearestCard.daysUntil !== 1 ? 's' : ''} away) - should be done first`,
                },
                cardId: nearestCard.card.id,
            });
        }
    }

    for (const card of allCards) {
        const listMovement = suggestListMovement(card, lists);
        if (listMovement) {
            recomendations.push({
                type: "list_movement",
                score: 0.8,
                payload: {
                    targetListId: listMovement.targetListId,
                    targetListTitle: listMovement.targetListTitle,
                    reason: listMovement.reason,
                },
                cardId: card.id,
            });
        }
    }

    const relatedCardsMap = new Map<string, Array<{ card: CardWithList; similarity: number }>>();

    for (const card of allCards) {
        const relatedCards = findRelatedCards(card, allCards);
        if (relatedCards.length > 0) {
            relatedCardsMap.set(card.id, relatedCards);
        }
    }

    const groupedCards = new Map<string, string[]>();

    for (const [cardId, relatedCards] of relatedCardsMap.entries()) {
        const cardIds = [cardId, ...relatedCards.map(rc => rc.card.id)];
        const sortedIds = cardIds.sort();
        const key = sortedIds.join(",");

        if (!groupedCards.has(key)) {
            groupedCards.set(key, sortedIds);
        }
    }

    for (const [key, cardIds] of groupedCards.entries()) {
        if (cardIds.length >= 2) {
            const cards = cardIds.map(id => allCards.find(c => c.id === id)).filter(Boolean) as CardWithList[];
            if (cards.length >= 2) {
                recomendations.push({
                    type: "group_cards",
                    score: 0.6,
                    payload: {
                        cardIds: cardIds,
                        cardTitles: cards.map(c => c.title),
                        reason: "You may want to group these cards together",
                    },
                    cardId: null,
                });
            }
        }
    }

    await prisma.recommendation.createMany({
        data: recomendations.map(rec => ({
            type: rec.type,
            score: rec.score,
            payload: rec.payload,
            boardId,
            cardId: rec.cardId,
        })),
    });
}
