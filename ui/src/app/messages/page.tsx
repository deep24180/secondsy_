"use client";

import { ChangeEvent, FormEvent, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import PageLoader from "../../components/ui/page-loader";
import { UserContext } from "../../context/user-context";
import {
  ChatMessage,
  Conversation,
  getConversationMessages,
  getConversations,
  sendConversationMessage,
  startConversation,
} from "../../lib/api/message";
import { API_URL } from "../../lib/api/user";
import { markConversationSeen } from "../../lib/message-unread";
import {
  createImageMessageContent,
  getImageMessageUrl,
  uploadImageToCloudinary,
} from "../../lib/cloudinary";
import { Input } from "../../components/ui/input";
import ImagePreviewModal from "../../components/modal/ImagePreviewModal";

type WsIncoming = {
  type: string;
  payload?: {
    conversationId?: string;
    messages?: ChatMessage[];
    message?: ChatMessage;
  };
};

const toWsUrl = (baseUrl: string, token: string) => {
  const normalized = baseUrl.replace(/\/$/, "");
  const wsBase = normalized.startsWith("https://")
    ? normalized.replace("https://", "wss://")
    : normalized.replace("http://", "ws://");

  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
};

const formatMessageDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getConversationPartnerId = (conversation: Conversation, currentUserId: string) =>
  conversation.participantAId === currentUserId
    ? conversation.participantBId
    : conversation.participantAId;

const getMessagePreview = (content: string) => {
  if (getImageMessageUrl(content)) return "Sent an image";
  return content || "No messages yet";
};

const getConversationLatestMessage = (
  conversation: Conversation,
  messagesByConversation: Record<string, ChatMessage[]>,
) =>
  messagesByConversation[conversation.id]?.slice(-1)[0] ||
  conversation.messages?.[0];

export default function MessagesPage() {
  const { user, loading, accessToken } = useContext(UserContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get("productId") || "";
  const sellerId = searchParams.get("sellerId") || "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  const selectedMessages = useMemo(() => {
    if (!selectedConversationId) return [];
    return messagesByConversation[selectedConversationId] || [];
  }, [messagesByConversation, selectedConversationId]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aLast =
        getConversationLatestMessage(a, messagesByConversation)?.createdAt ||
        a.lastMessageAt ||
        a.createdAt;
      const bLast =
        getConversationLatestMessage(b, messagesByConversation)?.createdAt ||
        b.lastMessageAt ||
        b.createdAt;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    });
  }, [conversations, messagesByConversation]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent("/messages")}`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!accessToken || !user?.id) return;

    let mounted = true;

    const init = async () => {
      try {
        setLoadingPage(true);
        setError(null);

        if (productId && sellerId && sellerId !== user.id) {
          await startConversation(productId, sellerId, accessToken);
        }

        const convos = await getConversations(accessToken);

        if (!mounted) return;

        setConversations(convos);

        if (convos.length > 0) {
          const sorted = [...convos].sort((a, b) => {
            const aLast = a.messages?.[0]?.createdAt || a.lastMessageAt || a.createdAt;
            const bLast = b.messages?.[0]?.createdAt || b.lastMessageAt || b.createdAt;
            return new Date(bLast).getTime() - new Date(aLast).getTime();
          });
          const firstId = sorted[0].id;
          setSelectedConversationId((current) => current || firstId);
        }
      } catch (err) {
        if (!mounted) return;

        setError(err instanceof Error ? err.message : "Failed to load messages.");
      } finally {
        if (mounted) setLoadingPage(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [accessToken, productId, sellerId, user?.id]);

  useEffect(() => {
    if (!accessToken) return;

    shouldReconnectRef.current = true;

    const connect = () => {
      const socket = new WebSocket(toWsUrl(API_URL, accessToken));
      socketRef.current = socket;

      socket.onopen = () => {
        setSocketReady(true);
        setError((current) => (current === "WebSocket disconnected." ? null : current));
      };

      socket.onclose = () => {
        setSocketReady(false);

        if (!shouldReconnectRef.current) {
          return;
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 1500);
      };

      socket.onerror = () => {
        setError((current) => current || "WebSocket disconnected.");
      };

      socket.onmessage = (event) => {
        let incoming: WsIncoming;

        try {
          incoming = JSON.parse(event.data) as WsIncoming;
        } catch {
          return;
        }

        if (incoming.type === "conversation_joined") {
          const conversationId = incoming.payload?.conversationId as string;
          const messages = (incoming.payload?.messages || []) as ChatMessage[];

          setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: messages,
          }));
          return;
        }

        if (incoming.type === "new_message") {
          const conversationId = incoming.payload?.conversationId as string;
          const message = incoming.payload?.message as ChatMessage;

          if (!conversationId || !message) return;

          setMessagesByConversation((prev) => {
            const existing = prev[conversationId] || [];
            const hasMessage = existing.some((item) => item.id === message.id);

            if (hasMessage) return prev;

            return {
              ...prev,
              [conversationId]: [...existing, message],
            };
          });
        }
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!selectedConversationId || !accessToken) return;

    getConversationMessages(selectedConversationId, accessToken)
      .then((messages) => {
        setError((current) =>
          current === "Failed to load conversation messages." ? null : current,
        );
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversationId]: messages,
        }));
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load conversation messages.",
        );
      });
  }, [selectedConversationId, accessToken]);

  useEffect(() => {
    if (!selectedConversationId || !user?.id) return;

    const selectedConversationMessages =
      messagesByConversation[selectedConversationId] || [];
    const latestMessage =
      selectedConversationMessages[selectedConversationMessages.length - 1];

    const seenAt = latestMessage?.createdAt || new Date().toISOString();
    markConversationSeen(user.id, selectedConversationId, seenAt);
  }, [selectedConversationId, user?.id, messagesByConversation]);

  useEffect(() => {
    if (!selectedConversationId || !socketReady) return;

    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "join_conversation",
        payload: { conversationId: selectedConversationId },
      }),
    );
  }, [selectedConversationId, socketReady]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedConversationId, selectedMessages.length]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();

    const content = newMessage.trim();
    const socket = socketRef.current;

    if (!content || !selectedConversationId || !accessToken) {
      return;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "send_message",
          payload: {
            conversationId: selectedConversationId,
            content,
          },
        }),
      );
    } else {
      try {
        const response = await sendConversationMessage(
          selectedConversationId,
          content,
          accessToken,
        );

        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversationId]: [
            ...(prev[selectedConversationId] || []),
            response.message,
          ],
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send message.",
        );
        return;
      }
    }

    setNewMessage("");
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!selectedConversationId || !accessToken) return;

    const socket = socketRef.current;
    const content = createImageMessageContent(imageUrl);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "send_message",
          payload: {
            conversationId: selectedConversationId,
            content,
          },
        }),
      );
      return;
    }

    const response = await sendConversationMessage(
      selectedConversationId,
      content,
      accessToken,
    );

    setMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversationId]: [
        ...(prev[selectedConversationId] || []),
        response.message,
      ],
    }));
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (!selectedConversationId || !accessToken) {
      setError("Select a conversation before sharing an image.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);

      const imageUrl = await uploadImageToCloudinary(file);
      await sendImageMessage(imageUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload and send image.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (loading || loadingPage) {
    return <PageLoader message="Loading messages..." />;
  }

  if (!user) {
    return <PageLoader message="Checking account..." />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#e2e8f0_50%,_#dbeafe_100%)] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inbox</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Messages</h1>
          </div>
          <Link
            href="/profile"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            Back to profile
          </Link>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid min-h-[70vh] gap-4 rounded-3xl border border-white/70 bg-white/90 p-3 shadow-xl md:grid-cols-[320px_1fr] md:p-4">
          <aside className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-2 md:p-3">
            <div className="mb-2 px-2 py-1 text-xs font-medium text-slate-500">
              Conversations ({sortedConversations.length})
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {sortedConversations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No conversations yet.
                </p>
              ) : (
                sortedConversations.map((conversation) => {
                  const isActive = selectedConversationId === conversation.id;
                  const partnerId = getConversationPartnerId(conversation, user.id);
                  const partnerInitial = partnerId.slice(0, 1).toUpperCase();
                  const lastMessage = getConversationLatestMessage(
                    conversation,
                    messagesByConversation,
                  );
                  const previewText = getMessagePreview(lastMessage?.content || "");
                  const previewTime =
                    lastMessage?.createdAt ||
                    conversation.lastMessageAt ||
                    conversation.createdAt;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`h-20 w-full rounded-xl border px-3 py-3 text-left transition-all ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {partnerInitial}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">
                              User {partnerId}
                            </p>
                            <span
                              className={`shrink-0 text-[11px] ${
                                isActive ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              {formatMessageDate(previewTime)}
                            </span>
                          </div>
                          <p
                            className={`mt-1 line-clamp-1 text-xs ${
                              isActive ? "text-slate-200" : "text-slate-500"
                            }`}
                          >
                            {previewText}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              {selectedConversation ? (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Conversation
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      User {getConversationPartnerId(selectedConversation, user.id)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      socketReady
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {socketReady ? "Live" : "Reconnecting"}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a conversation to start chatting.</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4">
              {!selectedConversationId ? (
                <p className="text-sm text-slate-500">Select a conversation.</p>
              ) : selectedMessages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages in this conversation yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedMessages.map((message) => {
                    const isMine = message.senderId === user.id;
                    const imageUrl = getImageMessageUrl(message.content);

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[75%] ${
                            isMine
                              ? "rounded-br-md bg-slate-900 text-white"
                              : "rounded-bl-md bg-white text-slate-800"
                          }`}
                        >
                          {imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(imageUrl)}
                              className="block"
                              aria-label="Open image preview"
                            >
                              <Image
                                src={imageUrl}
                                alt="Shared in conversation"
                                width={720}
                                height={720}
                                className="max-h-72 w-auto rounded-xl object-cover"
                              />
                            </button>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                          <p
                            className={`mt-1 text-[11px] ${
                              isMine ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {formatMessageDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={sendMessage}
              className="border-t border-slate-200 bg-white p-3 sm:p-4"
            >
              <div className="flex items-center gap-2">
                <Input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedConversationId || isUploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                  className="shrink-0"
                >
                  {isUploadingImage ? "Uploading..." : "Image"}
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    selectedConversationId
                      ? "Type a message"
                      : "Choose a conversation first"
                  }
                  disabled={!selectedConversationId}
                  className="h-10 flex-1 rounded-full border-slate-300 bg-slate-50 px-4"
                />
                <Button
                  type="submit"
                  disabled={!selectedConversationId || !newMessage.trim()}
                  className="shrink-0"
                >
                  Send
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <ImagePreviewModal
        isOpen={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </main>
  );
}
