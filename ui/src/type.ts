export type ProductStatus = "Active" | "Sold" | "Expired";

export type ConditionType = "New" | "Like New" | "Good" | "Fair";

export type SellFormData = {
  title: string;
  category: string;
  subcategory: string;
  tags: string[];
  price: number | "";
  condition: ConditionType | "";
  description: string;
  email: string;
  phone: string;
  location: string;
  deliveryPickup: boolean;
  deliveryShipping: boolean;
  images: string[];
};

export type Category = {
  id: number;
  name: string;
  icon: string;
  subcategories: string[];
};

export type Product = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  tags?: string[];
  sold?: boolean;
  status?: ProductStatus | string;
  price: number;
  condition: string;
  description: string;
  images: string[];
  email: string;
  phone: string;
  location: string;
  deliveryPickup: boolean;
  deliveryShipping: boolean;
  userId: string;
  createdAt: string | Date;
};

export type ProductListMeta = {
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

export type ProductListResponse = {
  data: Product[];
  meta: ProductListMeta;
};

export type Ad = {
  id: string;
  title: string;
  price: number;
  status: ProductStatus;
  images: string[];
  location: string;
  createdAt: string;
  userId: string;
};

export type ProductApiItem = {
  id: string;
  title: string;
  price: number | string;
  status: ProductStatus;
  images: string[];
  location: string;
  createdAt: string;
  userId: string;
};

export type UserProfile = {
  id: string;
  supabaseId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
};

export type SyncUserPayload = {
  firstName?: string;
  lastName?: string;
};

export type ConversationUser = {
  supabaseId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type ConversationLatestMessage = {
  id: string;
  senderId: string;
  sender?: ConversationUser | null;
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  productId: string;
  participantAId: string;
  participantBId: string;
  participantA?: ConversationUser | null;
  participantB?: ConversationUser | null;
  lastMessageAt?: string | null;
  lastReadAt?: string | null;
  createdAt: string;
  messages?: ConversationLatestMessage[];
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: ConversationUser | null;
  content: string;
  createdAt: string;
};

export type ConversationProductInfo = {
  id: string;
  title: string;
  images: string[];
  price?: number;
  location?: string;
};
