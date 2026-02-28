import type { Product, ProductListResponse, SellFormData } from "../../type";
import { API_URL } from "./user";

type ProductQuery = {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  subcategory?: string;
  tag?: string;
  userId?: string;
  status?: string;
  excludeStatus?: string;
};

type ProductResponse = Product | { data: Product };

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

const toQueryString = (query?: ProductQuery) => {
  if (!query) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const createProduct = async (
  createProductData: SellFormData,
  accessToken: string,
) => {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(createProductData),
  });

  return parseResponse(response);
};

export const getProducts = async (query?: ProductQuery) => {
  const response = await fetch(`${API_URL}/products${toQueryString(query)}`);
  return parseResponse<ProductListResponse>(response);
};

export const getProductById = async (id: string) => {
  const response = await fetch(`${API_URL}/products/${id}`);
  const result = await parseResponse<ProductResponse>(response);
  return "data" in result ? result.data : result;
};

export const updateProductStatus = async (
  id: string,
  status: "Active" | "Sold" | "Expired",
  accessToken: string,
) => {
  const response = await fetch(`${API_URL}/products/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ status }),
  });

  return parseResponse(response);
};

export const updateProduct = async (
  id: string,
  updateData: SellFormData,
  accessToken: string,
) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(updateData),
  });

  return parseResponse(response);
};

export const deleteProduct = async (id: string, accessToken: string) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseResponse(response);
};
