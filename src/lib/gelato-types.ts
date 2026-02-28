// SPEC-PRINT-002: Gelato API request/response types

// Gelato product UIDs for business cards
export const GELATO_PRODUCT_UIDS = {
  STANDARD: 'cards_pf_bb_pt_350-gsm-coated-silk_cl_4-4_hor',
  MATT_COATING:
    'cards_pf_bb_pt_350-gsm-coated-silk_cl_4-4_ct_matt-protection_prt_1-1_hor',
} as const;

// Gelato API base URLs
export const GELATO_API_URLS = {
  ORDER: 'https://order.gelatoapis.com/v3',
  PRODUCT: 'https://product.gelatoapis.com/v3',
  SHIPMENT: 'https://shipment.gelatoapis.com/v1',
  ORDER_STATUS: 'https://order.gelatoapis.com/v4',
} as const;

// --- Quote types ---

export interface GelatoQuoteItem {
  itemReferenceId: string;
  productUid: string;
  files: GelatoFile[];
  quantity: number;
}

export interface GelatoFile {
  type: 'default' | 'front' | 'back';
  url: string;
}

export interface GelatoQuoteRequest {
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  items: GelatoQuoteItem[];
  shippingAddress: GelatoShippingAddress;
  shipmentMethodUid?: string;
}

export interface GelatoShippingAddress {
  companyName?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postCode: string;
  country: string;
  email: string;
  phone: string;
}

export interface GelatoQuoteResponse {
  orderReferenceId: string;
  quotes: GelatoQuote[];
}

export interface GelatoQuote {
  shipmentMethodUid: string;
  shipmentMethodName: string;
  items: GelatoQuoteItemResult[];
  fulfillmentCountry: string;
  totalPrice: number;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface GelatoQuoteItemResult {
  itemReferenceId: string;
  price: number;
}

// --- Order types ---

export interface GelatoOrderRequest {
  orderType: 'draft' | 'order';
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  items: GelatoQuoteItem[];
  shippingAddress: GelatoShippingAddress;
  shipmentMethodUid?: string;
}

export interface GelatoOrderResponse {
  id: string;
  orderReferenceId: string;
  orderType: string;
  status: string;
  items: GelatoOrderItemResponse[];
  createdAt: string;
}

export interface GelatoOrderItemResponse {
  id: string;
  itemReferenceId: string;
  productUid: string;
  status: string;
}

// --- Order status (v4 API) ---

export interface GelatoOrderStatusResponse {
  id: string;
  orderReferenceId: string;
  fulfillmentStatus: string;
  financialStatus: string;
  items: GelatoOrderItemStatus[];
  shipments: GelatoShipment[];
  createdAt: string;
  updatedAt: string;
}

export interface GelatoOrderItemStatus {
  id: string;
  itemReferenceId: string;
  fulfillmentStatus: string;
}

export interface GelatoShipment {
  id: string;
  shipmentMethodUid: string;
  trackingCode: string;
  trackingUrl: string;
}

// --- Product info ---

export interface GelatoProductResponse {
  productUid: string;
  title: string;
  description: string;
  productSpecification: Record<string, string>;
}

// --- Shipping methods ---

export interface GelatoShipmentMethod {
  shipmentMethodUid: string;
  name: string;
  type: string;
  isBusiness: boolean;
}

// --- Webhook events ---

export interface GelatoWebhookEvent {
  event: 'order_status_updated' | 'order_item_status_updated';
  orderId: string;
  orderReferenceId?: string;
  status?: string;
  itemId?: string;
  itemReferenceId?: string;
  itemStatus?: string;
  trackingCode?: string;
  trackingUrl?: string;
  timestamp: string;
}

// --- API error ---

export interface GelatoApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
