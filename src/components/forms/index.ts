/**
 * Forms Index
 * Export all form components for easy importing
 */

// Authentication Forms
export { default as LoginForm } from './LoginForm';
export { default as RegisterForm } from './RegisterForm';

// Product & Catalog Forms
export { default as ProductForm } from './ProductForm';
export { default as CategoryForm } from './CategoryForm';
export { VariantsManager } from './VariantsManager';

// Bulk Creation Forms (Multiple items at once)
export { default as BulkProductForm } from './BulkProductForm';
export { default as BulkCategoryForm } from './BulkCategoryForm';
export { default as FlashSaleForm } from './FlashSaleForm';

// Admin Forms
export { default as PromotionForm } from './PromotionForm';
export { default as CouponForm } from './CouponForm';
export { default as LocationForm } from './LocationForm';
export { default as FranchiseForm } from './FranchiseForm';

// Form Utilities
export * from '@/lib/form-validation';
