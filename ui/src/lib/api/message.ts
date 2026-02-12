import { API_URL } from "./user";

export type Conversation = {
  id: string;
  productId: string;
  participantAId: string;
  participantBId: string;
  lastMessageAt?: string | null;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data as T;
};

const authHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
});

export const startConversation = async (
  productId: string,
  otherUserId: string,
  accessToken: string,
) => {
  const response = await fetch(`${API_URL}/messages/conversations/start`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ productId, otherUserId }),
  });

  return parseResponse<Conversation>(response);
};

export const getConversations = async (accessToken: string) => {
  const response = await fetch(`${API_URL}/messages/conversations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseResponse<Conversation[]>(response);
};

export const getConversationMessages = async (
  conversationId: string,
  accessToken: string,
) => {
  const response = await fetch(
    `${API_URL}/messages/conversations/${conversationId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return parseResponse<ChatMessage[]>(response);
};

export const sendConversationMessage = async (
  conversationId: string,
  content: string,
  accessToken: string,
) => {
  const response = await fetch(
    `${API_URL}/messages/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify({ content }),
    },
  );

  return parseResponse<{ message: ChatMessage }>(response);
};
