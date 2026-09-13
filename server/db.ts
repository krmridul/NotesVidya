import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import {
  User,
  Category,
  Product,
  Order,
  PaymentRecord,
  DownloadLog,
  Coupon,
  Review,
  WishlistItem,
  StoreSettings,
  EmailNotification,
  PendingRegistration,
} from '../src/types.js';

export interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  categories: Category[];
  products: Product[];
  orders: Order[];
  payments: PaymentRecord[];
  downloads: DownloadLog[];
  coupons: Coupon[];
  reviews: Review[];
  wishlists: WishlistItem[];
  settings: StoreSettings;
  emails: EmailNotification[];
  pendingRegistrations: PendingRegistration[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'production_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return result === hash;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Competitive Exams', slug: 'competitive-exams', description: 'UPSC, SSC, Banking, Railways & State PSC exam materials', iconName: 'GraduationCap', status: 'active', productCount: 0 },
  { id: 'cat-2', name: 'School Study Material', slug: 'school-study-material', description: 'Class 9th to 12th NCERT summaries, formulas & notes', iconName: 'BookOpen', status: 'active', productCount: 0 },
  { id: 'cat-3', name: 'College Notes', slug: 'college-notes', description: 'B.Tech, BCA, B.Sc, B.Com, MBA course materials & guides', iconName: 'Building2', status: 'active', productCount: 0 },
  { id: 'cat-4', name: 'E-Books', slug: 'e-books', description: 'Best-selling digital literature, skill mastery and guides', iconName: 'BookmarkCheck', status: 'active', productCount: 0 },
  { id: 'cat-5', name: 'General Knowledge', slug: 'general-knowledge', description: 'Static GK, History, Geography, Polity & World affairs', iconName: 'Globe', status: 'active', productCount: 0 },
  { id: 'cat-6', name: 'Previous Year Papers', slug: 'previous-year-papers', description: 'Last 10-15 years solved papers with step-by-step solutions', iconName: 'FileText', status: 'active', productCount: 0 },
  { id: 'cat-7', name: 'Practice Sets', slug: 'practice-sets', description: 'High-probability mock papers and chapter tests with solutions', iconName: 'CheckCircle2', status: 'active', productCount: 0 },
  { id: 'cat-8', name: 'Current Affairs', slug: 'current-affairs', description: 'Monthly capsules, one-liners, and MCQ compilations', iconName: 'TrendingUp', status: 'active', productCount: 0 },
  { id: 'cat-9', name: 'Computer', slug: 'computer', description: 'Computer Awareness, IT literacy, DSA & programming handbooks', iconName: 'Laptop', status: 'active', productCount: 0 },
  { id: 'cat-10', name: 'Mathematics', slug: 'mathematics', description: 'Quantitative Aptitude, Vedic Math tricks and formulas', iconName: 'Calculator', status: 'active', productCount: 0 },
  { id: 'cat-11', name: 'Reasoning', slug: 'reasoning', description: 'Verbal, Non-Verbal & Analytical Reasoning workbooks', iconName: 'Brain', status: 'active', productCount: 0 },
  { id: 'cat-12', name: 'English', slug: 'english', description: 'English Grammar rules, Vocabulary, Idioms and Comprehension', iconName: 'Languages', status: 'active', productCount: 0 },
  { id: 'cat-13', name: 'Hindi', slug: 'hindi', description: 'Hindi Vyakaran, Sahitya, Sandhi, Samas & Comprehension', iconName: 'PenTool', status: 'active', productCount: 0 },
  { id: 'cat-14', name: 'Other PDFs', slug: 'other-pdfs', description: 'Research papers, legal templates, self-help & miscellaneous', iconName: 'FolderArchive', status: 'active', productCount: 0 }
];

const INITIAL_SETTINGS: StoreSettings = {
  websiteName: 'NotesVidya',
  siteName: 'NotesVidya',
  storeName: 'NotesVidya',
  logoText: 'NotesVidya',
  tagline: 'Your Digital Library of Knowledge',
  contactEmail: process.env.CONTACT_EMAIL || 'support@notesvidya.com',
  supportPhone: process.env.CONTACT_PHONE || '+91 98765 43210',
  currency: 'INR',
  currencySymbol: '₹',
  taxPercentage: 0,
  gatewayMode: 'live',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  allowGuestPreview: true,
  socialLinks: {},
  footerText: '© 2025 NotesVidya. All rights reserved.',
  privacyPolicy: 'Your privacy is protected with end-to-end security.',
  termsConditions: 'Purchased digital PDFs are licensed exclusively to the authenticated customer for personal study.',
  refundPolicy: 'Due to the digital nature of instant PDF downloads, purchases are non-refundable once unlocked.'
};

class Database {
  private data: DatabaseSchema;
  private pgPool: pg.Pool | null = null;
  private lastMtime: number = 0;

  constructor() {
    this.data = this.loadInitial();
    this.initPostgresIfAvailable();
    this.ensureAdminFromEnv();
  }

  public syncFromFileIfNeeded(): void {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        if (stat.mtimeMs > this.lastMtime) {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.data = {
              ...this.data,
              ...parsed,
              settings: { ...this.data.settings, ...(parsed.settings || {}) }
            };
            this.lastMtime = stat.mtimeMs;
          }
        }
      }
    } catch {
      // Ignore concurrent file access race
    }
  }

  private loadInitial(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          categories: (parsed.categories && parsed.categories.length > 0) ? parsed.categories : INITIAL_CATEGORIES,
          products: parsed.products || [],
          orders: parsed.orders || [],
          payments: parsed.payments || [],
          downloads: parsed.downloads || [],
          coupons: parsed.coupons || [],
          reviews: parsed.reviews || [],
          wishlists: parsed.wishlists || [],
          settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
          emails: parsed.emails || [],
          pendingRegistrations: parsed.pendingRegistrations || []
        };
      } catch (err) {
        console.error('Error reading database file, initializing clean database', err);
      }
    }

    // Clean Production State - 0 demo items
    const cleanDb: DatabaseSchema = {
      users: [],
      categories: INITIAL_CATEGORIES,
      products: [],
      orders: [],
      payments: [],
      downloads: [],
      coupons: [],
      reviews: [],
      wishlists: [],
      settings: INITIAL_SETTINGS,
      emails: [],
      pendingRegistrations: []
    };

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(cleanDb, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to create clean database file', err);
    }

    return cleanDb;
  }

  private ensureAdminFromEnv() {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPass = process.env.ADMIN_PASSWORD?.trim();

    if (adminEmail && adminPass) {
      const existing = this.data.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());
      const { hash, salt } = hashPassword(adminPass);
      if (existing) {
        existing.role = 'admin';
        existing.passwordHash = hash;
        existing.salt = salt;
        existing.status = 'active';
      } else {
        const newAdmin: User & { passwordHash: string; salt: string } = {
          id: `usr-admin-${Date.now()}`,
          name: process.env.ADMIN_NAME || 'Store Administrator',
          email: adminEmail.toLowerCase(),
          phone: process.env.ADMIN_PHONE || '+91 9876543210',
          role: 'admin',
          status: 'active',
          ordersCount: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
          passwordHash: hash,
          salt
        };
        this.data.users.push(newAdmin);
      }
      this.save();
    }
  }

  private async initPostgresIfAvailable() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return;

    try {
      this.pgPool = new pg.Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });

      // Verify connection and create key-value state table if needed
      const client = await this.pgPool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_storage (
          key VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Try reading existing DB
      const res = await client.query('SELECT data FROM app_storage WHERE key = $1', ['store_state']);
      if (res.rows.length > 0 && res.rows[0].data) {
        const pgData = res.rows[0].data;
        this.data = {
          ...this.data,
          ...pgData,
          categories: (pgData.categories && pgData.categories.length > 0) ? pgData.categories : INITIAL_CATEGORIES
        };
      } else {
        // Sync local data to postgres
        await client.query(`
          INSERT INTO app_storage (key, data, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW();
        `, ['store_state', JSON.stringify(this.data)]);
      }
      client.release();
      console.log('Successfully connected to PostgreSQL database');
    } catch (err) {
      console.warn('PostgreSQL connection failed or not available, using local persistent storage', err);
      this.pgPool = null;
    }
  }

  public save(): void {
    try {
      // Atomic write to local file
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      if (fs.existsSync(DB_FILE)) {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch (err) {
      console.error('Error saving database to file:', err);
    }

    // Sync to PostgreSQL if connected
    if (this.pgPool) {
      this.pgPool.query(`
        INSERT INTO app_storage (key, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW();
      `, ['store_state', JSON.stringify(this.data)]).catch(err => {
        console.error('Error syncing state to PostgreSQL:', err);
      });
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      ordersCount: u.ordersCount,
      totalSpent: u.totalSpent,
      createdAt: u.createdAt
    }));
  }

  getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string) {
    this.syncFromFileIfNeeded();
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  addUser(user: User & { passwordHash: string; salt: string }) {
    this.syncFromFileIfNeeded();
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User & { passwordHash?: string; salt?: string }>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  deleteUser(id: string): boolean {
    const initial = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initial) {
      this.save();
      return true;
    }
    return false;
  }

  // Pending Registrations (Email OTP)
  getPendingRegistrations(): PendingRegistration[] {
    this.syncFromFileIfNeeded();
    this.cleanupExpiredPendingRegistrations();
    return this.data.pendingRegistrations || [];
  }

  getPendingRegistration(idOrEmail: string): PendingRegistration | undefined {
    this.syncFromFileIfNeeded();
    this.cleanupExpiredPendingRegistrations();
    const query = idOrEmail.toLowerCase().trim();
    return (this.data.pendingRegistrations || []).find(
      p => p.id === idOrEmail || p.email.toLowerCase() === query
    );
  }

  savePendingRegistration(pending: PendingRegistration): PendingRegistration {
    if (!this.data.pendingRegistrations) {
      this.data.pendingRegistrations = [];
    }
    const idx = this.data.pendingRegistrations.findIndex(
      p => p.id === pending.id || p.email.toLowerCase() === pending.email.toLowerCase()
    );
    if (idx !== -1) {
      this.data.pendingRegistrations[idx] = pending;
    } else {
      this.data.pendingRegistrations.push(pending);
    }
    this.save();
    return pending;
  }

  deletePendingRegistration(idOrEmail: string): boolean {
    if (!this.data.pendingRegistrations) return false;
    const query = idOrEmail.toLowerCase().trim();
    const initialLen = this.data.pendingRegistrations.length;
    this.data.pendingRegistrations = this.data.pendingRegistrations.filter(
      p => p.id !== idOrEmail && p.email.toLowerCase() !== query
    );
    if (this.data.pendingRegistrations.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  cleanupExpiredPendingRegistrations(): void {
    if (!this.data.pendingRegistrations) {
      this.data.pendingRegistrations = [];
      return;
    }
    const now = Date.now();
    // Exclude registrations older than 24 hours or expired over 1 hour ago
    const filtered = this.data.pendingRegistrations.filter(
      p => p.otpExpiresAt > (now - 60 * 60 * 1000)
    );
    if (filtered.length !== this.data.pendingRegistrations.length) {
      this.data.pendingRegistrations = filtered;
      this.save();
    }
  }

  // Categories
  getCategories(): Category[] {
    // Dynamic recalculation of real product count
    return this.data.categories.map(c => {
      const activeCount = this.data.products.filter(p => p.categoryId === c.id && p.status === 'published').length;
      return { ...c, productCount: activeCount };
    });
  }

  getCategoryById(id: string) {
    return this.data.categories.find(c => c.id === id);
  }

  addCategory(category: Category) {
    this.data.categories.push(category);
    this.save();
    return category;
  }

  updateCategory(id: string, updates: Partial<Category>) {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
      this.save();
      return this.data.categories[idx];
    }
    return null;
  }

  deleteCategory(id: string) {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.save();
  }

  // Products
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string) {
    return this.data.products.find(p => p.id === id);
  }

  getProductBySlug(slug: string) {
    return this.data.products.find(p => p.slug === slug);
  }

  addProduct(product: Product) {
    this.data.products.unshift(product);
    this.save();
    return product;
  }

  updateProduct(id: string, updates: Partial<Product>) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = {
        ...this.data.products[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.products[idx];
    }
    return null;
  }

  deleteProduct(id: string) {
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.save();
  }

  // Orders
  getOrders(): Order[] {
    return this.data.orders;
  }

  getOrderById(id: string) {
    return this.data.orders.find(o => o.id === id);
  }

  getOrdersByUserId(userId: string) {
    return this.data.orders.filter(o => o.userId === userId);
  }

  addOrder(order: Order) {
    this.data.orders.unshift(order);
    this.save();
    return order;
  }

  updateOrder(id: string, updates: Partial<Order>) {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
      this.save();
      return this.data.orders[idx];
    }
    return null;
  }

  // Payments
  getPayments(): PaymentRecord[] {
    return this.data.payments;
  }

  addPayment(record: PaymentRecord) {
    this.data.payments.unshift(record);
    this.save();
    return record;
  }

  // Downloads
  getDownloads(): DownloadLog[] {
    return this.data.downloads;
  }

  addDownload(log: DownloadLog) {
    this.data.downloads.unshift(log);
    const prod = this.getProductById(log.productId);
    if (prod) {
      prod.downloadCount = (prod.downloadCount || 0) + 1;
    }
    this.save();
    return log;
  }

  // Coupons
  getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  getCouponByCode(code: string) {
    return this.data.coupons.find(c => c.code.toUpperCase() === code.toUpperCase().trim());
  }

  addCoupon(coupon: Coupon) {
    this.data.coupons.push(coupon);
    this.save();
    return coupon;
  }

  updateCoupon(id: string, updates: Partial<Coupon>) {
    const idx = this.data.coupons.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.coupons[idx] = { ...this.data.coupons[idx], ...updates };
      this.save();
      return this.data.coupons[idx];
    }
    return null;
  }

  deleteCoupon(id: string) {
    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    this.save();
  }

  // Reviews
  getReviews(): Review[] {
    return this.data.reviews;
  }

  getReviewsByProductId(productId: string) {
    return this.data.reviews.filter(r => r.productId === productId && r.status === 'approved');
  }

  addReview(review: Review) {
    this.data.reviews.unshift(review);
    const approvedProductReviews = this.data.reviews.filter(r => r.productId === review.productId && r.status === 'approved');
    if (approvedProductReviews.length > 0) {
      const avg = approvedProductReviews.reduce((sum, r) => sum + r.rating, 0) / approvedProductReviews.length;
      const prod = this.getProductById(review.productId);
      if (prod) {
        prod.rating = Number(avg.toFixed(1));
        prod.reviewCount = approvedProductReviews.length;
      }
    }
    this.save();
    return review;
  }

  updateReview(id: string, updates: Partial<Review>) {
    const idx = this.data.reviews.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.reviews[idx] = { ...this.data.reviews[idx], ...updates };
      this.save();
      return this.data.reviews[idx];
    }
    return null;
  }

  deleteReview(id: string) {
    this.data.reviews = this.data.reviews.filter(r => r.id !== id);
    this.save();
  }

  // Wishlists
  getWishlistByUserId(userId: string) {
    return this.data.wishlists.filter(w => w.userId === userId);
  }

  addToWishlist(userId: string, productId: string) {
    const existing = this.data.wishlists.find(w => w.userId === userId && w.productId === productId);
    if (existing) return existing;
    const prod = this.getProductById(productId);
    if (!prod) return null;
    const item: WishlistItem = {
      id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      productId,
      product: prod,
      addedAt: new Date().toISOString()
    };
    this.data.wishlists.push(item);
    this.save();
    return item;
  }

  removeFromWishlist(userId: string, productId: string) {
    this.data.wishlists = this.data.wishlists.filter(w => !(w.userId === userId && w.productId === productId));
    this.save();
  }

  // Settings
  getSettings(): StoreSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<StoreSettings>) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // Emails
  getEmails(): EmailNotification[] {
    return this.data.emails;
  }

  addEmail(email: EmailNotification) {
    this.data.emails.unshift(email);
    this.save();
    return email;
  }

  // Ownership verification
  hasPurchasedProduct(userId: string, productId: string): boolean {
    const userOrders = this.data.orders.filter(o => o.userId === userId && o.paymentStatus === 'paid');
    return userOrders.some(order => order.items.some(item => item.productId === productId));
  }

  getCustomerPurchasedPdfs(userId: string) {
    const userOrders = this.data.orders.filter(o => o.userId === userId && o.paymentStatus === 'paid');
    const purchasedMap = new Map<string, { product: Product; order: Order; purchasedAt: string }>();

    for (const order of userOrders) {
      for (const item of order.items) {
        if (!purchasedMap.has(item.productId)) {
          const prod = this.getProductById(item.productId);
          if (prod) {
            purchasedMap.set(item.productId, {
              product: prod,
              order,
              purchasedAt: order.paidAt || order.createdAt
            });
          }
        }
      }
    }

    return Array.from(purchasedMap.values());
  }
}

export const db = new Database();
