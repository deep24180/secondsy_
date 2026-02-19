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
import { Input } from "@/components/ui/input";

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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  const selectedMessages = useMemo(() => {
    if (!selectedConversationId) return [];
    return messagesByConversation[selectedConversationId] || [];
  }, [messagesByConversation, selectedConversationId]);

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
          const firstId = convos[0].id;
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
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <Link href="/profile" className="text-sm text-slate-500 hover:text-slate-700">
          Back to profile
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[280px_1fr]">
        <aside className="space-y-2 border-b pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-3">
          {conversations.length === 0 ? (
            <p className="text-sm text-slate-500">No conversations yet.</p>
          ) : (
            conversations.map((conversation) => {
              const isActive = selectedConversationId === conversation.id;
              const lastMessage = messagesByConversation[conversation.id]?.slice(-1)[0];
              const otherId =
                conversation.participantAId === user.id
                  ? conversation.participantBId
                  : conversation.participantAId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    isActive
                      ? "border-slate-900 bg-slate-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">User: {otherId}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    {lastMessage?.content || "No messages yet"}
                  </p>
                </button>
              );
            })
          )}
        </aside>

        <div className="flex min-h-[420px] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border bg-slate-50 p-3">
            {!selectedConversationId ? (
              <p className="text-sm text-slate-500">Select a conversation.</p>
            ) : selectedMessages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages in this conversation yet.</p>
            ) : (
              selectedMessages.map((message) => {
                const isMine = message.senderId === user.id;
                const imageUrl = getImageMessageUrl(message.content);

                return (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      isMine
                        ? "ml-auto bg-slate-900 text-white"
                        : "bg-white text-slate-800"
                    }`}
                  >
                    {imageUrl ? (
                      <a href={imageUrl} target="_blank" rel="noreferrer">
                        <Image
                          src={imageUrl}
                          alt="Shared in conversation"
                          width={720}
                          height={720}
                          className="max-h-72 w-auto rounded-lg object-cover"
                        />
                      </a>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    <p className={`mt-1 text-[11px] ${isMine ? "text-slate-300" : "text-slate-400"}`}>
                      {formatMessageDate(message.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-3 flex gap-2">
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
            >
              {isUploadingImage ? "Uploading..." : "Image"}
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="h-10 flex-1 rounded-lg border px-3 text-sm outline-none focus:border-slate-400"
            />
            <Button type="submit" disabled={!selectedConversationId || !newMessage.trim()}>
              Send
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
