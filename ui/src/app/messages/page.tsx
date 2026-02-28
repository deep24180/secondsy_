"use client";

import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Button } from "../../components/ui/button";
import PageLoader from "../../components/ui/page-loader";
import { UserContext } from "../../context/user-context";
import {
  getConversationMessages,
  getConversations,
  sendConversationMessage,
  startConversation,
} from "../../lib/api/message";
import type {
  ChatMessage,
  Conversation,
  ConversationProductInfo,
  ConversationUser,
} from "../../type";
import { API_URL } from "../../lib/api/user";
import { markConversationSeen } from "../../lib/message-unread";
import {
  createImageMessageContent,
  getImageMessageUrl,
  uploadImageToCloudinary,
} from "../../lib/cloudinary";
import { Input } from "../../components/ui/input";
import ImagePreviewModal from "../../components/modal/ImagePreviewModal";
import { getProductById } from "../../lib/api/product";

const formatPriceINR = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

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

const getConversationPartnerId = (
  conversation: Conversation,
  currentUserId: string,
) =>
  conversation.participantAId === currentUserId
    ? conversation.participantBId
    : conversation.participantAId;

const getConversationPartner = (
  conversation: Conversation,
  currentUserId: string,
) =>
  conversation.participantAId === currentUserId
    ? conversation.participantB
    : conversation.participantA;

const getUserDisplayName = (
  profile: ConversationUser | null | undefined,
  fallbackId: string,
) => {
  const firstName = profile?.firstName?.trim();
  const lastName = profile?.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (fullName) return fullName;
  if (profile?.email) return profile.email;
  if (fallbackId.length <= 8) return fallbackId;
  return `${fallbackId.slice(0, 6)}...${fallbackId.slice(-4)}`;
};

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
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [productsById, setProductsById] = useState<
    Record<string, ConversationProductInfo>
  >({});
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

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
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) || null,
    [conversations, selectedConversationId],
  );
  const selectedConversationProduct = useMemo(
    () =>
      selectedConversation ? productsById[selectedConversation.productId] : null,
    [productsById, selectedConversation],
  );

  const selectedConversationSeenAt = useMemo(() => {
    if (!selectedConversationId) return null;

    const selectedConversationMessages =
      messagesByConversation[selectedConversationId] || [];
    const latestLoadedMessage =
      selectedConversationMessages[selectedConversationMessages.length - 1];

    if (latestLoadedMessage?.createdAt) {
      return latestLoadedMessage.createdAt;
    }

    if (selectedConversation?.messages?.[0]?.createdAt) {
      return selectedConversation.messages[0].createdAt;
    }

    if (selectedConversation?.lastMessageAt) {
      return selectedConversation.lastMessageAt;
    }

    return new Date().toISOString();
  }, [
    selectedConversationId,
    selectedConversation,
    messagesByConversation,
  ]);

  const filteredConversations = useMemo(() => {
    const keyword = conversationSearch.trim().toLowerCase();
    if (!keyword) return sortedConversations;

    return sortedConversations.filter((conversation) => {
      const partnerId = getConversationPartnerId(conversation, user?.id || "");
      const partnerProfile = getConversationPartner(
        conversation,
        user?.id || "",
      );
      const partnerName = getUserDisplayName(partnerProfile, partnerId);
      const latestMessage = getConversationLatestMessage(
        conversation,
        messagesByConversation,
      );

      return [partnerName, latestMessage?.content || ""]
        .concat(productsById[conversation.productId]?.title || "")
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [
    conversationSearch,
    sortedConversations,
    user?.id,
    messagesByConversation,
    productsById,
  ]);

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
            const aLast =
              a.messages?.[0]?.createdAt || a.lastMessageAt || a.createdAt;
            const bLast =
              b.messages?.[0]?.createdAt || b.lastMessageAt || b.createdAt;
            return new Date(bLast).getTime() - new Date(aLast).getTime();
          });
          const matchingConversation = sorted.find((conversation) => {
            if (!productId || conversation.productId !== productId) return false;
            if (!sellerId) return true;

            return (
              conversation.participantAId === sellerId ||
              conversation.participantBId === sellerId
            );
          });
          const firstId = sorted[0].id;
          setSelectedConversationId(
            matchingConversation?.id || firstId,
          );
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error ? err.message : "Failed to load messages.",
        );
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
    if (conversations.length === 0) return;

    const missingProductIds = Array.from(
      new Set(
        conversations
          .map((conversation) => conversation.productId)
          .filter((id) => id && !productsById[id]),
      ),
    );

    if (missingProductIds.length === 0) return;

    let mounted = true;

    Promise.all(
      missingProductIds.map(
        async (id): Promise<ConversationProductInfo | null> => {
        try {
          const product = await getProductById(id);

          if (!product?.id) return null;

          return {
            id: product.id,
            title: product.title || "Untitled Product",
            images: Array.isArray(product.images) ? product.images : [],
            price:
              typeof product.price === "number" ? product.price : undefined,
            location:
              typeof product.location === "string"
                ? product.location
                : undefined,
          };
        } catch {
          return null;
        }
      }),
    ).then((products) => {
      if (!mounted) return;

      const nextEntries = products.filter(
        (product): product is ConversationProductInfo => Boolean(product),
      );

      if (nextEntries.length === 0) return;

      setProductsById((prev) => {
        const updated = { ...prev };
        for (const product of nextEntries) {
          updated[product.id] = product;
        }
        return updated;
      });
    });

    return () => {
      mounted = false;
    };
  }, [conversations, productsById]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(API_URL, {
      transports: ["websocket"],
      auth: {
        token: accessToken,
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketReady(true);
      setError((current) =>
        current === "Socket disconnected." ? null : current,
      );
    });

    socket.on("disconnect", () => {
      setSocketReady(false);
    });

    socket.on("connect_error", () => {
      setError((current) => current || "Socket disconnected.");
    });

    socket.on(
      "new_message",
      (incoming: { conversationId?: string; message?: ChatMessage }) => {
        const conversationId = incoming.conversationId;
        const message = incoming.message;

        if (!conversationId || !message) {
          return;
        }

        setMessagesByConversation((prev) => {
          const existing = prev[conversationId] || [];
          const hasMessage = existing.some((item) => item.id === message.id);

          if (hasMessage) return prev;

          return {
            ...prev,
            [conversationId]: [...existing, message],
          };
        });
      },
    );

    socket.on("message_error", (incoming: { message?: string }) => {
      setError(incoming.message || "Socket message error.");
    });

    return () => {
      socketRef.current?.disconnect();
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
    if (!selectedConversationId || !accessToken || !selectedConversationSeenAt) {
      return;
    }

    void markConversationSeen(
      selectedConversationId,
      accessToken,
      selectedConversationSeenAt,
    )
      .then((result) => {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === selectedConversationId
              ? { ...conversation, lastReadAt: result.lastReadAt }
              : conversation,
          ),
        );
      })
      .catch(() => {
        // read receipts are best-effort and should not block chat UI
      });
  }, [selectedConversationId, selectedConversationSeenAt, accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [selectedConversationId, selectedMessages.length]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();

    const content = newMessage.trim();
    const socket = socketRef.current;

    if (!content || !selectedConversationId || !accessToken) {
      return;
    }

    if (socket?.connected) {
      socket.emit("send_message", {
        conversationId: selectedConversationId,
        content,
      });
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

    if (socket?.connected) {
      socket.emit("send_message", {
        conversationId: selectedConversationId,
        content,
      });
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
    <main className="min-h-screen bg-[linear-gradient(160deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)] px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-[linear-gradient(130deg,_#0f172a_0%,_#1e293b_42%,_#1d4ed8_100%)] px-4 py-4 text-white shadow-[0_24px_55px_-35px_rgba(15,23,42,0.7)] sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
              Inbox
            </p>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              Messages
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-blue-50 transition hover:bg-white/20"
          >
            Go back
          </Link>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid min-h-[72vh] gap-4 rounded-3xl border border-slate-200/70 bg-white/90 p-3 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop- md:grid-cols-[320px_1fr] md:p-4">
          <aside
            className={`${
              mobileView === "chat" ? "hidden md:flex" : "flex"
            } h-[72vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)]`}
          >
            <div className="border-b border-slate-200 bg-blue-50/60 p-3">
              <div className="mb-2 text-xs font-medium text-blue-700">
                Conversations ({filteredConversations.length})
              </div>
              <Input
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="Search conversations"
                className="h-9 border-blue-200 bg-white"
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {filteredConversations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-8 text-center text-sm text-blue-700">
                  No conversations yet.
                </p>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive = selectedConversationId === conversation.id;
                  const partnerId = getConversationPartnerId(
                    conversation,
                    user.id,
                  );
                  const partnerProfile = getConversationPartner(
                    conversation,
                    user.id,
                  );
                  const partnerName = getUserDisplayName(
                    partnerProfile,
                    partnerId,
                  );
                  const partnerInitial = partnerName
                    .slice(0, 1)
                    .toUpperCase();
                  const lastMessage = getConversationLatestMessage(
                    conversation,
                    messagesByConversation,
                  );
                  const previewText = getMessagePreview(
                    lastMessage?.content || "",
                  );
                  const previewTime =
                    lastMessage?.createdAt ||
                    conversation.lastMessageAt ||
                    conversation.createdAt;
                  const conversationProduct =
                    productsById[conversation.productId];
                  const productTitle =
                    conversationProduct?.title || "Product unavailable";
                  const productImage = conversationProduct?.images?.[0];

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setSelectedConversationId(conversation.id);
                        setMobileView("chat");
                      }}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                        isActive
                          ? "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/80 text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isActive
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {partnerInitial}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">
                              {partnerName}
                            </p>
                            <span
                              className={`shrink-0 text-[11px] ${
                                isActive ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {formatMessageDate(previewTime)}
                            </span>
                          </div>
                          <p
                            className={`mt-1 line-clamp-1 text-xs ${
                              isActive ? "text-slate-600" : "text-slate-500"
                            }`}
                          >
                            {previewText}
                          </p>
                          <p className="mt-1 line-clamp-1 text-[11px] font-medium text-blue-700/90">
                            product: {productTitle}
                          </p>
                        </div>

                        {productImage ? (
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            <Image
                              src={productImage}
                              alt={productTitle}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div
            className={`${
              mobileView === "list" ? "hidden md:flex" : "flex"
            } h-[72vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)]`}
          >
            <div className="border-b border-slate-200 bg-blue-50/60 px-4 py-3">
              {selectedConversation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMobileView("list")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white text-sm text-blue-700 md:hidden"
                        aria-label="Back to conversations"
                      >
                        ←
                      </button>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-700">
                          Conversation
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {getUserDisplayName(
                            getConversationPartner(selectedConversation, user.id),
                            getConversationPartnerId(selectedConversation, user.id),
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        socketReady
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {socketReady ? "Live" : "Reconnecting"}
                    </span>
                  </div>

                  <Link
                    href={`/product/${selectedConversation.productId}`}
                    className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2 transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    {selectedConversationProduct?.images?.[0] ? (
                      <Image
                        src={selectedConversationProduct.images[0]}
                        alt={selectedConversationProduct?.title || "Product"}
                        width={52}
                        height={52}
                        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-500">
                        ITEM
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-blue-700">
                        Listing
                      </p>
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                        {selectedConversationProduct?.title || "View product"}
                      </p>
                      {typeof selectedConversationProduct?.price === "number" ? (
                        <p className="text-xs font-semibold text-slate-700">
                          {formatPriceINR(selectedConversationProduct.price)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Select a conversation to start chatting.
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#eef2ff_100%)] p-4">
              {!selectedConversationId ? (
                <p className="text-sm text-slate-500">Select a conversation.</p>
              ) : selectedMessages.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No messages in this conversation yet.
                </p>
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
                              ? "rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
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
                                className="max-h-72 w-auto rounded-xl border border-slate-200 object-cover"
                              />
                            </button>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}
                          <p
                            className={`mt-1 text-[11px] ${
                              isMine ? "text-blue-100" : "text-slate-400"
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
              className="border-t border-slate-200 bg-white/95 p-3 sm:p-4"
            >
              <div className="mb-2 flex flex-wrap gap-2">
                {["Is this still available?", "Can you share final price?"].map(
                  (quickText) => (
                    <button
                      key={quickText}
                      type="button"
                      onClick={() => setNewMessage(quickText)}
                      disabled={!selectedConversationId}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {quickText}
                    </button>
                  ),
                )}
              </div>
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
                  className="h-10 shrink-0 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
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
                  className="h-10 flex-1 rounded-full border-blue-200 bg-white px-4 focus-visible:ring-blue-200"
                />
                <Button
                  type="submit"
                  disabled={!selectedConversationId || !newMessage.trim()}
                  className="h-10 shrink-0 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700"
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
