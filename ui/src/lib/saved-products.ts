import { API_URL } from "./api/user";

export const SAVED_PRODUCTS_UPDATED_EVENT = "secondsy:saved-products-updated";

export type SavedProduct = {
  id: string;
  title: string;
  price: number | string;
  images?: string[];
  location?: string;
};

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

const emitSavedUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SAVED_PRODUCTS_UPDATED_EVENT));
};

export const getSavedProducts = async (accessToken: string) => {
  const response = await fetch(`${API_URL}/saved-products`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseResponse<SavedProduct[]>(response);
};

export const saveProductForLater = async (
  productId: string,
  accessToken: string,
) => {
  const response = await fetch(`${API_URL}/saved-products`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ productId }),
  });

  const result = await parseResponse<SavedProduct>(response);
  emitSavedUpdated();
  return result;
};

export const removeSavedProduct = async (
  productId: string,
  accessToken: string,
) => {
  const response = await fetch(`${API_URL}/saved-products/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = await parseResponse<{ success: boolean }>(response);
  emitSavedUpdated();
  return result;
};

export const isProductSaved = async (productId: string, accessToken: string) => {
  try {
    const savedProducts = await getSavedProducts(accessToken);
    return savedProducts.some((product) => product.id === productId);
  } catch {
    return false;
  }
};
