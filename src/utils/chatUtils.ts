type PrimitiveId = string | number | null | undefined;

const candidateKeys = [
    "id",
    "chatId",
    "conversationId",
    "roomId",
    "threadId",
] as const;

export function resolveChatId(chatResponse: any): string | null {
    if (!chatResponse) return null;

    const direct = candidateKeys
        .map((key) => chatResponse?.[key])
        .find(isValidPrimitiveId);
    if (isValidPrimitiveId(direct)) {
        return String(direct);
    }

    const nested =
        chatResponse?.chat ||
        chatResponse?.conversation ||
        chatResponse?.data ||
        Array.isArray(chatResponse?.chats) ? chatResponse.chats[0] : null;

    if (nested) {
        const nestedId = candidateKeys
            .map((key) => nested?.[key])
            .find(isValidPrimitiveId);
        if (isValidPrimitiveId(nestedId)) {
            return String(nestedId);
        }
    }

    return null;
}

function isValidPrimitiveId(value: PrimitiveId): value is string | number {
    return (
        (typeof value === "string" && value.trim().length > 0) ||
        (typeof value === "number" && !Number.isNaN(value))
    );
}

