export const API_URL = process.env.BASE_URL || "http://localhost:3001";

export const createUser = async (createUsersData: {
  supabaseId: string;
  email: string;
}) => {
  console.log(createUsersData);
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createUsersData),
    });

    const data = await response.json();
    console.log(response);
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data?.data || [];
  } catch (error) {
    console.error("Error while creating user:", error);
    throw error;
  }
};
