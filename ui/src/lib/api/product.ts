import type { SellFormData } from "@/app/sell-item/page";
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

export const getProductById = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data || null;
  } catch (error) {
    console.error("Error while fetching product:", error);
    throw error;
  }
};

export const updateProductStatus = async (
  id: string,
  status: "Active" | "Sold" | "Expired",
  accessToken: string,
) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data || null;
  } catch (error) {
    console.error("Error while updating product status:", error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  updateData: SellFormData,
  accessToken: string,
) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data || null;
  } catch (error) {
    console.error("Error while updating product:", error);
    throw error;
  }
};
