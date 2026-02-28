// SPEC-PRINT-002 M2: Gelato API client (Cloudflare Workers compatible)

import {
  GELATO_API_URLS,
  type GelatoQuoteRequest,
  type GelatoQuoteResponse,
  type GelatoOrderRequest,
  type GelatoOrderResponse,
  type GelatoOrderStatusResponse,
  type GelatoProductResponse,
  type GelatoShipmentMethod,
  type GelatoApiError,
} from './gelato-types';

class GelatoApiClient {
  private apiKey: string;
  private maxRetries = 2;

  constructor() {
    const apiKey = process.env.GELATO_API_KEY;
    if (!apiKey) {
      throw new Error('GELATO_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  /**
   * Send an authenticated request to the Gelato API.
   * Retries on network errors up to maxRetries times.
   * Throws on 4xx/5xx with the GelatoApiError message.
   */
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          let errorBody: GelatoApiError | null = null;
          try {
            errorBody = (await response.json()) as GelatoApiError;
          } catch {
            // Response body is not valid JSON
          }
          const message = errorBody?.message ?? `Gelato API error: ${response.status}`;
          throw new GelatoClientError(message, response.status, errorBody);
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof GelatoClientError) {
          // Do not retry on 4xx/5xx responses
          throw error;
        }
        // Network error - retry if attempts remain
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxRetries) {
          continue;
        }
      }
    }

    throw lastError ?? new Error('Gelato API request failed');
  }

  /**
   * Create a shipping quote for the given items and address.
   */
  async createQuote(params: GelatoQuoteRequest): Promise<GelatoQuoteResponse> {
    return this.request(`${GELATO_API_URLS.ORDER}/orders:quote`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a new order (draft or live).
   */
  async createOrder(params: GelatoOrderRequest): Promise<GelatoOrderResponse> {
    return this.request(`${GELATO_API_URLS.ORDER}/orders`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get the current status of an order (v4 API).
   */
  async getOrder(orderId: string): Promise<GelatoOrderStatusResponse> {
    return this.request(`${GELATO_API_URLS.ORDER_STATUS}/orders/${orderId}`);
  }

  /**
   * Confirm a draft order so it enters production.
   */
  async confirmDraft(orderId: string): Promise<GelatoOrderResponse> {
    return this.request(`${GELATO_API_URLS.ORDER}/orders/${orderId}:confirm`, {
      method: 'POST',
    });
  }

  /**
   * Get product information by product UID.
   */
  async getProduct(productUid: string): Promise<GelatoProductResponse> {
    return this.request(`${GELATO_API_URLS.PRODUCT}/products/${productUid}`);
  }

  /**
   * List all available shipment methods.
   */
  async getShipmentMethods(): Promise<GelatoShipmentMethod[]> {
    const result = await this.request<{ shipmentMethods: GelatoShipmentMethod[] }>(
      `${GELATO_API_URLS.SHIPMENT}/shipment-methods`
    );
    return result.shipmentMethods;
  }
}

/**
 * Error class for Gelato API failures (4xx/5xx responses).
 */
export class GelatoClientError extends Error {
  public readonly statusCode: number;
  public readonly apiError: GelatoApiError | null;

  constructor(message: string, statusCode: number, apiError: GelatoApiError | null = null) {
    super(message);
    this.name = 'GelatoClientError';
    this.statusCode = statusCode;
    this.apiError = apiError;
  }
}

/**
 * Get a Gelato API client instance.
 * Creates a new instance each time (stateless for edge runtime).
 */
export function getGelatoClient(): GelatoApiClient {
  return new GelatoApiClient();
}
