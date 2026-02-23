export const API_URL = process.env.BASE_URL || "http://localhost:3001";

export const syncCurrentUser = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data?.data || [];
  } catch (error) {
    throw error;
  }
};
