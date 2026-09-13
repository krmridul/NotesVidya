import {
  User,
  Product,
  Category,
  Order,
  PaymentRecord,
  DownloadLog,
  Coupon,
  Review,
  WishlistItem,
  StoreSettings,
  EmailNotification,
  DashboardStats
} from '../types.js';
import { auth } from './firebase.js';

const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

function normalizeUrl(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/api/')) {
    return trimmed;
  }
  if (trimmed === '/api') {
    return '/api';
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_BASE}${cleanPath}`;
}

async function request<T>(endpoint: string, options: RequestOptions = {}, retryCount = 0): Promise<T> {
  let token = options.token;
  if (!token && auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch {
      // ignore
    }
  }
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  // Only add Content-Type: application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = normalizeUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorMessage = 'An unexpected server error occurred';
    let errorData: any = {};
    try {
      if (contentType.includes('application/json')) {
        errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        const text = await response.text();
        errorMessage = text && !text.startsWith('<') ? text : `Server returned ${response.status} ${response.statusText}`;
      }
    } catch {
      errorMessage = `Server returned ${response.status} ${response.statusText}`;
    }
    const err: any = new Error(errorMessage);
    err.status = response.status;
    err.code = errorData.code;
    err.requiresConfig = errorData.requiresConfig;
    err.configHelp = errorData.configHelp;
    err.actionUrl = errorData.actionUrl;
    err.detectedIp = errorData.detectedIp;
    throw err;
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // If the server returned HTML (e.g. during dev server compilation or temporary reload), retry up to 2 times
    if (retryCount < 2 && (contentType.includes('text/html') || text.trim().startsWith('<'))) {
      await new Promise(res => setTimeout(res, 400));
      return request<T>(endpoint, options, retryCount + 1);
    }
    throw new Error(`Expected JSON response from ${endpoint} but server returned non-JSON format (${response.status})`);
  }
}

export const api = {
  // Config
  getPaymentConfig: () =>
    request<{
      razorpayKeyId: string;
      isConfigured: boolean;
      currency: string;
      currencySymbol: string;
    }>('/config/payment'),

  getStoreConfig: () =>
    request<{ settings: StoreSettings }>('/config/store'),

  // Auth
  checkNeedsAdminSetup: () =>
    request<{ needsAdminSetup: boolean }>('/auth/needs-admin-setup'),

  setupAdmin: (body: { name: string; email: string; phone: string; password: string }) =>
    request<{ token: string; user: User; message: string }>('/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  // Email OTP Registration
  initiateRegistration: (body: { name: string; email: string; phone: string; password: string; confirmPassword?: string }) =>
    request<{
      success: boolean;
      registrationId: string;
      email: string;
      expiresAt: number;
      message: string;
      emailDeliveryWarning?: {
        isIpRestricted: boolean;
        detectedIp?: string;
        actionUrl?: string;
        message: string;
      };
    }>('/auth/register-initiate', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  verifyOtp: (body: { registrationId?: string; email?: string; otp: string }) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  resendOtp: (body: { registrationId?: string; email?: string }) =>
    request<{
      success: boolean;
      expiresAt: number;
      message: string;
      emailDeliveryWarning?: {
        isIpRestricted: boolean;
        detectedIp?: string;
        actionUrl?: string;
        message: string;
      };
    }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  changeRegistrationEmail: (body: { registrationId?: string; oldEmail?: string; newEmail: string }) =>
    request<{
      success: boolean;
      email: string;
      expiresAt: number;
      message: string;
      emailDeliveryWarning?: {
        isIpRestricted: boolean;
        detectedIp?: string;
        actionUrl?: string;
        message: string;
      };
    }>('/auth/change-registration-email', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  getEmailStatus: () =>
    request<{ isConfigured: boolean; provider: string; fromAddress: string; fromName: string }>('/system/email-status'),

  register: (body: { name: string; email: string; phone: string; password: string; confirmPassword?: string }) =>
    request<{ token: string; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  getMe: () =>
    request<{ user: User }>('/auth/me'),

  updateProfile: (body: { name: string; phone: string }) =>
    request<{ user: User; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword?: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  // Products
  getProducts: (params: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    bestseller?: boolean;
    featured?: boolean;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.minPrice !== undefined) query.set('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) query.set('maxPrice', params.maxPrice.toString());
    if (params.sort) query.set('sort', params.sort);
    if (params.bestseller) query.set('bestseller', 'true');
    if (params.featured) query.set('featured', 'true');
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return request<{ products: Product[]; pagination?: { page: number; limit: number; totalItems: number; totalPages: number } }>(
      qs ? `/products?${qs}` : '/products'
    );
  },

  getFeaturedProducts: () =>
    request<{ featured: Product[]; bestsellers: Product[] }>('/products/featured'),

  getProduct: (idOrSlug: string) =>
    request<{ product: Product; reviews: Review[] }>(`/products/${idOrSlug}`),

  getProductPreview: (id: string) =>
    request<{
      product: { id: string; title: string; author: string; pages: number; categoryName: string; thumbnail: string };
      samplePages: Array<{ pageNumber: number; title: string; excerpt: string; watermarkNotice: string }>;
      notice: string;
    }>(`/products/${id}/preview`),

  // Categories
  getCategories: () =>
    request<{ categories: Category[] }>('/categories'),

  // Cart & Coupon
  validateCoupon: (code: string, cartTotal: number) =>
    request<{
      valid: boolean;
      code: string;
      discountType: string;
      discountValue: number;
      calculatedDiscount: number;
      discountAmount: number;
      message: string;
    }>('/cart/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, cartTotal })
    }),

  // Orders & Razorpay Checkout
  createOrder: (payload: {
    productIds: string[];
    couponCode?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) =>
    request<{
      order: Order;
      razorpayOrderPayload: {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        customer: { name: string; email: string; phone: string };
      };
    }>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  verifyPayment: (payload: {
    orderId: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    paymentMethod?: string;
  }) =>
    request<{ success: boolean; order: Order; message: string }>('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Secure DRM PDF Access
  requestPdfDownloadToken: (productId: string) =>
    request<{
      token: string;
      expiresInMinutes: number;
      downloadUrl: string;
      streamUrl: string;
    }>(`/secure-pdf/request-token/${productId}`),

  requestPdfToken: (productId: string) =>
    request<{
      token: string;
      expiresInMinutes: number;
      downloadUrl: string;
      streamUrl: string;
    }>(`/secure-pdf/request-token/${productId}`),

  // Customer Dashboard
  getCustomerPurchased: () =>
    request<{ purchased: Array<{ product: Product; order: Order; purchasedAt: string }> }>('/customer/purchased'),

  getMyPurchasedPdfs: () =>
    request<{ purchased: Array<{ product: Product; order: Order; purchasedAt: string }> }>('/customer/purchased'),

  getCustomerOrders: () =>
    request<{ orders: Order[] }>('/customer/orders'),

  getMyOrders: () =>
    request<{ orders: Order[] }>('/customer/orders'),

  getCustomerDownloads: () =>
    request<{ downloads: DownloadLog[] }>('/customer/downloads'),

  getMyDownloads: () =>
    request<{ downloads: DownloadLog[] }>('/customer/downloads'),

  getCustomerWishlist: () =>
    request<{ wishlist: WishlistItem[] }>('/customer/wishlist'),

  getMyWishlist: () =>
    request<{ wishlist: WishlistItem[] }>('/customer/wishlist'),

  addToWishlist: (productId: string) =>
    request<{ item: WishlistItem; message: string }>('/customer/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId })
    }),

  removeFromWishlist: (productId: string) =>
    request<{ message: string }>(`/customer/wishlist/${productId}`, {
      method: 'DELETE'
    }),

  submitReview: (productIdOrData: string | { productId: string; rating: number; review: string }, rating?: number, review?: string) => {
    const payload = typeof productIdOrData === 'string'
      ? { productId: productIdOrData, rating: rating || 5, review: review || '' }
      : productIdOrData;
    return request<{ review?: Review; message: string }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Admin File Uploads
  uploadPdfFile: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return request<{ success: boolean; fileKey: string; originalName: string; fileSize: string; message: string }>(
      '/admin/upload-pdf',
      {
        method: 'POST',
        body: formData
      }
    );
  },

  uploadThumbnailFile: async (file: File) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return request<{ success: boolean; url: string; message: string }>(
      '/admin/upload-thumbnail',
      {
        method: 'POST',
        body: formData
      }
    );
  },

  // Admin Dashboard & Management
  getAdminDashboardStats: () =>
    request<DashboardStats>('/admin/dashboard-stats'),

  getAdminStats: () =>
    request<any>('/admin/dashboard-stats'),

  getAdminProducts: () =>
    request<{ products: Product[] }>('/admin/products'),

  createAdminProduct: (data: Partial<Product>) =>
    request<{ product: Product; message: string }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAdminProduct: (id: string, updates: Partial<Product>) =>
    request<{ product: Product; message: string }>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteAdminProduct: (id: string) =>
    request<{ message: string }>(`/admin/products/${id}`, {
      method: 'DELETE'
    }),

  getAdminCategories: () =>
    request<{ categories: Category[] }>('/admin/categories'),

  createAdminCategory: (data: Partial<Category>) =>
    request<{ category: Category; message: string }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAdminCategory: (id: string, updates: Partial<Category>) =>
    request<{ category: Category; message: string }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteAdminCategory: (id: string) =>
    request<{ message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE'
    }),

  getAdminOrders: () =>
    request<{ orders: Order[] }>('/admin/orders'),

  updateAdminOrder: (id: string, updates: Partial<Order>) =>
    request<{ order: Order; message: string }>(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  updateAdminOrderStatus: (id: string, updates: { orderStatus?: string; paymentStatus?: string }) =>
    request<{ order: Order; message: string }>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  getAdminCustomers: () =>
    request<{ customers: User[] }>('/admin/customers'),

  updateAdminCustomerStatus: (id: string, status: 'active' | 'inactive') =>
    request<{ customer: User; message: string }>(`/admin/customers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  getAdminPayments: () =>
    request<{ payments: PaymentRecord[] }>('/admin/payments'),

  getAdminCoupons: () =>
    request<{ coupons: Coupon[] }>('/admin/coupons'),

  createAdminCoupon: (data: Partial<Coupon>) =>
    request<{ coupon: Coupon; message: string }>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAdminCoupon: (id: string, updates: Partial<Coupon>) =>
    request<{ coupon: Coupon; message: string }>(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteAdminCoupon: (id: string) =>
    request<{ message: string }>(`/admin/coupons/${id}`, {
      method: 'DELETE'
    }),

  getAdminReviews: () =>
    request<{ reviews: Review[] }>('/admin/reviews'),

  updateAdminReviewStatus: (id: string, status: 'approved' | 'pending' | 'hidden') =>
    request<{ review: Review; message: string }>(`/admin/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  deleteAdminReview: (id: string) =>
    request<{ message: string }>(`/admin/reviews/${id}`, {
      method: 'DELETE'
    }),

  getAdminSettings: () =>
    request<{ settings: StoreSettings }>('/admin/settings'),

  updateAdminSettings: (settings: Partial<StoreSettings>) =>
    request<{ settings: StoreSettings; message: string }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  getAdminDownloads: () =>
    request<{ downloads: DownloadLog[] }>('/admin/downloads'),

  getAdminEmails: () =>
    request<{ emails: EmailNotification[] }>('/admin/emails')
};
