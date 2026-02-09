import { SellFormData } from "@/app/sell-item/page";
import { API_URL } from "./user";

export const createProduct = async (
  createProductData: SellFormData,
  accessToken: string,
) => {
  console.log(createProductData);
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createProductData),
    });

    const data = await response.json();
    console.log(response);
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data?.data || [];
  } catch (error) {
    console.error("Error while creating product:", error);
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`);

    const data = await response.json();
    console.log(data);
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error while fetching products:", error);
    throw error;
  }
};
