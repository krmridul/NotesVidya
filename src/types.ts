export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  ordersCount?: number;
  totalSpent?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  image?: string;
  status: 'active' | 'inactive';
  productCount?: number;
}

export interface SamplePage {
  pageNumber: number;
  title: string;
  excerpt: string;
  watermarkNotice: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  author: string;
  language: string;
  pages: number;
  fileSize: string; // e.g. "14.2 MB"
  originalPrice: number;
  sellingPrice: number;
  discount: number; // percentage
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  downloadCount: number;
  thumbnail: string;
  previewSamplePages: SamplePage[];
  pdfFileKey: string; // Internal protected key
  status: 'published' | 'draft' | 'archived';
  availability: 'available' | 'unavailable';
  featured: boolean;
  bestseller: boolean;
  tags: string[];
  keywords: string[];
  publishedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: 1;
}

export interface OrderItem {
  productId: string;
  title: string;
  thumbnail: string;
  price: number;
  categoryName: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentGateway: string;
  paymentMethod: string;
  paymentId: string;
  createdAt: string;
  paidAt?: string;
}

export interface PaymentRecord {
  id: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentGateway: string;
  paymentMethod: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface DownloadLog {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail: string;
  productId: string;
  productTitle?: string;
  orderId: string;
  accessedAt?: string;
  downloadedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumAmount: number;
  maximumDiscount: number;
  usageLimit: number;
  usedCount: number;
  startDate?: string;
  expiryDate: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  rating: number;
  review: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export interface StoreSettings {
  websiteName: string;
  logoText: string;
  tagline: string;
  contactEmail: string;
  supportPhone: string;
  currency: string;
  currencySymbol: string;
  taxPercentage: number;
  gatewayMode: 'test' | 'live';
  razorpayKeyId: string;
  allowGuestPreview: boolean;
  socialLinks: {
    telegram?: string;
    whatsapp?: string;
    youtube?: string;
    twitter?: string;
  };
  footerText: string;
  privacyPolicy: string;
  termsConditions: string;
  refundPolicy: string;
  // Email provider configuration (Brevo Transactional Email)
  emailProvider?: 'brevo' | 'smtp';
  brevoApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  emailSenderAddress?: string;
  emailSenderName?: string;
  // Compatibility aliases
  siteName?: string;
  storeName?: string;
  supportEmail?: string;
  currencyCode?: string;
  taxRate?: number;
  paymentGatewayMode?: 'test' | 'live';
}

export interface PendingRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  salt: string;
  otpHash: string;
  otpSalt: string;
  otpExpiresAt: number;
  otpAttempts: number;
  resendCount: number;
  lastOtpSentAt: number;
  emailVerified: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalSales: number;
  todaySales: number;
  monthlySales: number;
  totalOrders: number;
  successfulOrders: number;
  pendingOrders: number;
  failedPayments: number;
  totalCustomers: number;
  totalProducts: number;
  totalDownloads: number;
  popularProducts: Array<{ id: string; title: string; purchases: number; revenue: number }>;
  dailySalesHistory: Array<{ date: string; sales: number; orders: number }>;
  monthlySalesHistory: Array<{ month: string; sales: number }>;
  categoryDistribution: Array<{ name: string; count: number; sales: number }>;
}

export type DashboardStats = AnalyticsSummary;

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  type: 'welcome' | 'order_confirmation' | 'payment_success' | 'payment_failed' | 'password_reset' | 'admin_new_order' | 'otp_verification';
  contentSnippet: string;
  sentAt: string;
}
