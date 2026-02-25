export const API_URL = process.env.BASE_URL || "http://localhost:3001";

export type UserProfile = {
  id: string;
  supabaseId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
};

type SyncUserPayload = {
  firstName?: string;
  lastName?: string;
};

export const syncCurrentUser = async (
  accessToken: string,
  payload?: SyncUserPayload,
) => {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload || {}),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data as UserProfile;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUserProfile = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data as UserProfile | null;
  } catch (error) {
    throw error;
  }
};
