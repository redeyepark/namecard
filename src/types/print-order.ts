// SPEC-PRINT-002: Print order types for Gelato integration

export type PrintStatus =
  | 'draft'
  | 'pending'
  | 'production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export type PrintCardStatus =
  | 'ordered'
  | 'printed'
  | 'shipped'
  | 'delivered';

export type ShippingMethod = 'normal' | 'express' | 'overnight';

export interface ShippingAddress {
  companyName?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postCode: string;
  country: string; // ISO 3166-1 alpha-2, default 'KR'
  email: string;
  phone: string;
}

export interface PrintOrderItem {
  id: string;
  printOrderId: string;
  cardRequestId: string;
  productUid: string;
  quantity: number;
  frontPdfUrl: string | null;
  backPdfUrl: string | null;
  createdAt: string;
}

export interface PrintOrder {
  id: string;
  gelatoOrderId: string | null;
  status: PrintStatus;
  orderType: 'draft' | 'order';
  items: PrintOrderItem[];
  shippingAddress: ShippingAddress | null;
  shippingMethod: ShippingMethod | null;
  quoteAmount: number | null;
  quoteCurrency: string | null;
  trackingUrl: string | null;
  trackingCode: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Database row types (snake_case matching Supabase)
export interface PrintOrderRow {
  id: string;
  gelato_order_id: string | null;
  status: PrintStatus;
  order_type: 'draft' | 'order';
  shipping_address: ShippingAddress | null;
  shipping_method: ShippingMethod | null;
  quote_amount: number | null;
  quote_currency: string | null;
  tracking_url: string | null;
  tracking_code: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PrintOrderItemRow {
  id: string;
  print_order_id: string;
  card_request_id: string;
  product_uid: string;
  quantity: number;
  front_pdf_url: string | null;
  back_pdf_url: string | null;
  created_at: string;
}

/**
 * Convert a database row + item rows to the domain PrintOrder model.
 */
export function toPrintOrder(
  row: PrintOrderRow,
  items: PrintOrderItemRow[]
): PrintOrder {
  return {
    id: row.id,
    gelatoOrderId: row.gelato_order_id,
    status: row.status,
    orderType: row.order_type,
    items: items.map(toPrintOrderItem),
    shippingAddress: row.shipping_address,
    shippingMethod: row.shipping_method,
    quoteAmount: row.quote_amount,
    quoteCurrency: row.quote_currency,
    trackingUrl: row.tracking_url,
    trackingCode: row.tracking_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert a database item row to the domain PrintOrderItem model.
 */
export function toPrintOrderItem(row: PrintOrderItemRow): PrintOrderItem {
  return {
    id: row.id,
    printOrderId: row.print_order_id,
    cardRequestId: row.card_request_id,
    productUid: row.product_uid,
    quantity: row.quantity,
    frontPdfUrl: row.front_pdf_url,
    backPdfUrl: row.back_pdf_url,
    createdAt: row.created_at,
  };
}
