export type Role = "owner" | "staff";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Category = {
  id: string;
  name: string;
  productCount?: number;
  createdAt?: string;
};

export type Product = {
  id: string;
  categoryId: string | null;
  sku: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  category?: { id: string; name: string } | null;
  createdAt?: string;
};

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt?: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPrice: number | string;
  quantity: number;
  lineTotal: number | string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  status: OrderStatus;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  notes: string | null;
  createdAt: string;
  customer?: { id: string; name: string; phone?: string } | null;
  creator?: { id: string; name: string };
  items?: OrderItem[];
  statusHistory?: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    changedAt: string;
    changer?: { id: string; name: string };
  }>;
};

export type DashboardData = {
  totalActiveProducts: number;
  ordersToday: number;
  totalSalesCompleted: number | string;
  recentOrders: Array<
    Order & { items?: Array<{ id: string; quantity: number }> }
  >;
  lowStock: Array<Product & { category?: { name: string } | null }>;
  lowStockCount: number;
};

export type ReportSummary = {
  from: string;
  to: string;
  totalSalesCompleted: number | string;
  ordersByStatus: Partial<
    Record<OrderStatus, { count: number; total: number | string }>
  >;
  newCustomers: number;
};

export type TopProduct = {
  productId: string;
  name: string;
  sku: string | null;
  quantitySold: number;
  revenue: number | string;
  ordersCount: number;
};
