/**
 * API Services Index
 * Export all services for easy importing
 */

export { apiClient, type ApiResponse, type PaginatedResponse } from './api-client';
export { authService, type User, type LoginResponse } from './auth-service';
export {
  productService,
  type Product,
  type ProductDetail,
  type ProductVariant,
  type VariantInput,
  type Review as ProductReview,
} from './product-service';
export {
  orderService,
  type Cart,
  type CartItem,
  type Order,
  type OrderRequest,
  type OrderItem,
} from './order-service';
export { locationService, type Country, type City, type Currency } from './location-service';
export {
  userService,
  type UserProfile,
  type UserAddress,
  type User as AdminUser,
  UserRole,
  UserStatus,
} from './user-service';
export {
  promotionService,
  type Promotion,
  type FlashSale,
  type Coupon as PromotionCoupon,
  PromotionType,
  CouponStatus,
} from './promotion-service';
export { notificationService, type Notification } from './notification-service';
export { wishlistService, type Wishlist, type WishlistItem } from './wishlist-service';
export {
  franchiseService,
  type Franchise,
  type FranchiseLocation,
  type FranchiseStats,
  FranchiseStatus,
} from './franchise-service';
export { categoryService, type Category, type CategoryTree } from './category-service';
export {
  stockService,
  type Stock,
  type LocationStock,
  type StockTransfer,
  type StockAdjustment,
  StockStatus,
} from './stock-service';
export {
  analyticsService,
  type DashboardMetrics,
  type SalesData,
  type ProductPerformance,
  type OrderMetrics,
  type CustomerMetrics,
  type RevenueReport,
  type InventoryMetrics,
} from './analytics-service';
