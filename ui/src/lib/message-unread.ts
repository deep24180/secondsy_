import type { Conversation } from "../type";
import { markConversationRead } from "./api/message";

export const MESSAGE_READ_EVENT = "secondsy:message-read";

const parseDate = (value?: string | null) => {
  if (!value) return 0;
  const date = new Date(value).getTime();
  return Number.isNaN(date) ? 0 : date;
};

const isConversationUnread = (conversation: Conversation, userId: string) => {
  const latestMessage = conversation.messages?.[0];
  if (!latestMessage) return false;
  if (latestMessage.senderId === userId) return false;

  const latestAt = parseDate(latestMessage.createdAt);
  const lastReadAt = parseDate(conversation.lastReadAt);
  return latestAt > lastReadAt;
};

export const getUnreadConversationsCount = (
  conversations: Conversation[],
  userId: string,
) =>
  conversations.reduce((total, conversation) => {
    return isConversationUnread(conversation, userId) ? total + 1 : total;
  }, 0);

export const markConversationSeen = async (
  conversationId: string,
  accessToken: string,
  seenAt?: string,
) => {
  const result = await markConversationRead(conversationId, accessToken, seenAt);
  window.dispatchEvent(
    new CustomEvent(MESSAGE_READ_EVENT, {
      detail: result,
    }),
  );
  return result;
};
