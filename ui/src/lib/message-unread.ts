import type { Conversation } from "../type";

const STORAGE_KEY_PREFIX = "secondsy_message_seen_v1:";
export const MESSAGE_READ_EVENT = "secondsy:message-read";

type SeenByConversation = Record<string, string>;

const getStorageKey = (userId: string) => `${STORAGE_KEY_PREFIX}${userId}`;

const readSeenMap = (userId: string): SeenByConversation => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as SeenByConversation;
    if (!parsed || typeof parsed !== "object") return {};

    return parsed;
  } catch {
    return {};
  }
};

const writeSeenMap = (userId: string, map: SeenByConversation) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(map));
};

export const markConversationSeen = (
  userId: string,
  conversationId: string,
  seenAt: string,
) => {
  const current = readSeenMap(userId);
  const previous = current[conversationId];

  if (previous && new Date(previous).getTime() >= new Date(seenAt).getTime()) {
    return;
  }

  current[conversationId] = seenAt;
  writeSeenMap(userId, current);
  window.dispatchEvent(new CustomEvent(MESSAGE_READ_EVENT));
};

const isConversationUnread = (conversation: Conversation, userId: string) => {
  const latestMessage = conversation.messages?.[0];
  if (!latestMessage) return false;

  if (latestMessage.senderId === userId) return false;

  const seenAt = readSeenMap(userId)[conversation.id];
  if (!seenAt) return true;

  return (
    new Date(latestMessage.createdAt).getTime() > new Date(seenAt).getTime()
  );
};

export const getUnreadConversationsCount = (
  conversations: Conversation[],
  userId: string,
) =>
  conversations.reduce((total, conversation) => {
    return isConversationUnread(conversation, userId) ? total + 1 : total;
  }, 0);
