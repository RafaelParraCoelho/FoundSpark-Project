import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Product {
  id: number;
  title: string;
  source: string;
  url: string;
  category: string;
  price_brl: number;
  collected_at: string;
}

export interface PriceSnapshot {
  price_brl: number;
  collected_at: string;
}

export interface ProductsResponse {
  products: Product[];
}

export interface PriceHistoryResponse {
  product_id: number;
  history: PriceSnapshot[];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get<ProductsResponse>('/products');
  return response.data.products;
};

export const getProductHistory = async (productId: number): Promise<PriceSnapshot[]> => {
  const response = await api.get<PriceHistoryResponse>(`/products/${productId}/history`);
  return response.data.history;
};

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getDbCheck = async () => {
  const response = await api.get('/db-check');
  return response.data;
};
