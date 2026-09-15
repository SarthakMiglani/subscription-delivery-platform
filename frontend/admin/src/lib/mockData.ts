/**
 * Mock responses for all admin API endpoints — used when VITE_MOCK=true
 */

export const MOCK_ADMIN_CUSTOMERS = {
  items: [
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      name: 'Ravi Kumar',
      email: 'ravi.kumar@example.com',
      phone: '9876543210',
      isActive: true,
      onboardingComplete: true,
      walletBalancePaise: 15000,
      activeSubscriptionCount: 2,
      createdAt: '2025-06-01T10:00:00+05:30',
    },
    {
      id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '9123456789',
      isActive: true,
      onboardingComplete: true,
      walletBalancePaise: 85000,
      activeSubscriptionCount: 1,
      createdAt: '2025-06-15T09:30:00+05:30',
    },
    {
      id: 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa',
      name: 'Amit Patel',
      email: 'amit.patel@example.com',
      phone: '9988776655',
      isActive: false,
      onboardingComplete: true,
      walletBalancePaise: 0,
      activeSubscriptionCount: 0,
      createdAt: '2025-07-01T08:00:00+05:30',
    },
    {
      id: 'dddddddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      phone: '9090909090',
      isActive: true,
      onboardingComplete: true,
      walletBalancePaise: 120000,
      activeSubscriptionCount: 3,
      createdAt: '2025-06-20T11:00:00+05:30',
    },
  ],
}

export const MOCK_ADMIN_CUSTOMER_DETAIL = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Ravi Kumar',
  email: 'ravi.kumar@example.com',
  phone: '9876543210',
  isActive: true,
  onboardingComplete: true,
  walletBalancePaise: 15000,
  address: {
    id: 'addr-uuid-1',
    line1: '42 MG Road',
    line2: 'Apt 3B',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    deliveryNotes: 'Leave at the door',
  },
  createdAt: '2025-06-01T10:00:00+05:30',
}

export const MOCK_ADMIN_PRODUCTS = {
  items: [
    {
      id: 'prod-uuid-1',
      name: 'Orange Juice',
      description: 'Freshly squeezed Valencia oranges, cold-pressed daily',
      pricePerUnitPaise: 2500,
      unitLabel: '500ml bottle',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
      createdAt: '2025-05-01T00:00:00+05:30',
    },
    {
      id: 'prod-uuid-2',
      name: 'Watermelon Juice',
      description: 'Cold-pressed watermelon with a hint of mint',
      pricePerUnitPaise: 3000,
      unitLabel: '500ml bottle',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1563746924237-f81d6a3a908c?w=400&q=80',
      createdAt: '2025-05-01T00:00:00+05:30',
    },
    {
      id: 'prod-uuid-3',
      name: 'Mixed Greens',
      description: 'Spinach, cucumber, apple & ginger blend',
      pricePerUnitPaise: 3500,
      unitLabel: '350ml bottle',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80',
      createdAt: '2025-05-01T00:00:00+05:30',
    },
    {
      id: 'prod-uuid-4',
      name: 'Pineapple Juice',
      description: 'Tropical fresh-pressed pineapple',
      pricePerUnitPaise: 2800,
      unitLabel: '500ml bottle',
      isAvailable: false,
      imageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=400&q=80',
      createdAt: '2025-05-01T00:00:00+05:30',
    },
  ],
}

export const MOCK_ADMIN_SUBSCRIPTIONS = {
  items: [
    {
      id: 'sub-uuid-1',
      customerId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      customerName: 'Ravi Kumar',
      productId: 'prod-uuid-1',
      productName: 'Orange Juice',
      quantity: 2,
      status: 'ACTIVE',
      effectiveStartDate: '2025-07-01',
      createdAt: '2025-06-30T09:00:00+05:30',
    },
    {
      id: 'sub-uuid-2',
      customerId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      customerName: 'Ravi Kumar',
      productId: 'prod-uuid-2',
      productName: 'Watermelon Juice',
      quantity: 1,
      status: 'PAUSED',
      effectiveStartDate: '2025-07-10',
      createdAt: '2025-07-09T10:00:00+05:30',
    },
    {
      id: 'sub-uuid-4',
      customerId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      customerName: 'Priya Sharma',
      productId: 'prod-uuid-3',
      productName: 'Mixed Greens',
      quantity: 1,
      status: 'ACTIVE',
      effectiveStartDate: '2025-07-05',
      createdAt: '2025-07-04T10:00:00+05:30',
    },
    {
      id: 'sub-uuid-5',
      customerId: 'dddddddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
      customerName: 'Sneha Reddy',
      productId: 'prod-uuid-1',
      productName: 'Orange Juice',
      quantity: 3,
      status: 'ACTIVE',
      effectiveStartDate: '2025-06-20',
      createdAt: '2025-06-19T08:00:00+05:30',
    },
  ],
}

export const MOCK_ADMIN_ORDERS = {
  items: [
    {
      id: 'order-uuid-1',
      customerId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      customerName: 'Ravi Kumar',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-29',
      status: 'SCHEDULED',
      isLocked: false,
    },
    {
      id: 'order-uuid-2',
      customerId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      customerName: 'Ravi Kumar',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-28',
      status: 'LOCKED',
      isLocked: true,
    },
    {
      id: 'order-uuid-3',
      customerId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      customerName: 'Priya Sharma',
      productName: 'Mixed Greens',
      quantity: 1,
      totalAmountPaise: 3500,
      deliveryDate: '2026-06-28',
      status: 'LOCKED',
      isLocked: true,
    },
    {
      id: 'order-uuid-4',
      customerId: 'dddddddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
      customerName: 'Sneha Reddy',
      productName: 'Orange Juice',
      quantity: 3,
      totalAmountPaise: 7500,
      deliveryDate: '2026-06-28',
      status: 'DELIVERED',
      isLocked: true,
    },
    {
      id: 'order-uuid-5',
      customerId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      customerName: 'Ravi Kumar',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-27',
      status: 'DELIVERED',
      isLocked: true,
    },
  ],
}

export const MOCK_DELIVERY_SHEET = {
  deliveryDate: '2026-06-28',
  generatedAt: '2026-06-28T06:00:00+05:30',
  orders: [
    {
      orderId: 'order-uuid-2',
      customerName: 'Ravi Kumar',
      phone: '9876543210',
      address: '42 MG Road, Apt 3B, Bengaluru 560001',
      deliveryNotes: 'Leave at the door',
      productName: 'Orange Juice',
      quantity: 2,
      deliveryStatus: 'DELIVERED',
    },
    {
      orderId: 'order-uuid-3',
      customerName: 'Priya Sharma',
      phone: '9123456789',
      address: '15 Koramangala, Bengaluru 560034',
      deliveryNotes: 'Ring bell twice',
      productName: 'Mixed Greens',
      quantity: 1,
      deliveryStatus: 'PENDING',
    },
    {
      orderId: 'order-uuid-4',
      customerName: 'Sneha Reddy',
      phone: '9090909090',
      address: '7 Indiranagar, Bengaluru 560038',
      deliveryNotes: '',
      productName: 'Orange Juice',
      quantity: 3,
      deliveryStatus: 'SKIPPED',
    },
  ],
  juiceSummary: [
    { productName: 'Orange Juice', totalQuantity: 5 },
    { productName: 'Mixed Greens', totalQuantity: 1 },
  ],
  ingredientSummary: [
    { ingredientId: 'ing-uuid-1', ingredientName: 'Orange', totalQuantity: 10, unit: 'pieces' },
    { ingredientId: 'ing-uuid-2', ingredientName: 'Spinach', totalQuantity: 100, unit: 'grams' },
    { ingredientId: 'ing-uuid-3', ingredientName: 'Cucumber', totalQuantity: 1, unit: 'pieces' },
    { ingredientId: 'ing-uuid-4', ingredientName: 'Apple', totalQuantity: 1, unit: 'pieces' },
  ],
  productsWithoutRecipe: [],
}

export const MOCK_INGREDIENTS = {
  items: [
    { id: 'ing-uuid-1', name: 'Orange', defaultUnit: 'pieces', createdAt: '2026-06-01T00:00:00+05:30' },
    { id: 'ing-uuid-2', name: 'Spinach', defaultUnit: 'grams', createdAt: '2026-06-01T00:00:00+05:30' },
    { id: 'ing-uuid-3', name: 'Cucumber', defaultUnit: 'pieces', createdAt: '2026-06-01T00:00:00+05:30' },
    { id: 'ing-uuid-4', name: 'Apple', defaultUnit: 'pieces', createdAt: '2026-06-01T00:00:00+05:30' },
    { id: 'ing-uuid-5', name: 'Ginger', defaultUnit: 'grams', createdAt: '2026-06-01T00:00:00+05:30' },
    { id: 'ing-uuid-6', name: 'Watermelon', defaultUnit: 'kg', createdAt: '2026-06-01T00:00:00+05:30' },
    { id: 'ing-uuid-7', name: 'Pineapple', defaultUnit: 'pieces', createdAt: '2026-06-01T00:00:00+05:30' },
  ],
}

export const MOCK_PRODUCT_RECIPES: Record<string, { ingredientId: string; ingredientName: string; quantityPerUnit: number; unit: string }[]> = {
  'prod-uuid-1': [
    { ingredientId: 'ing-uuid-1', ingredientName: 'Orange', quantityPerUnit: 2, unit: 'pieces' },
  ],
  'prod-uuid-2': [
    { ingredientId: 'ing-uuid-6', ingredientName: 'Watermelon', quantityPerUnit: 0.5, unit: 'kg' },
  ],
  'prod-uuid-3': [
    { ingredientId: 'ing-uuid-2', ingredientName: 'Spinach', quantityPerUnit: 50, unit: 'grams' },
    { ingredientId: 'ing-uuid-3', ingredientName: 'Cucumber', quantityPerUnit: 1, unit: 'pieces' },
    { ingredientId: 'ing-uuid-4', ingredientName: 'Apple', quantityPerUnit: 1, unit: 'pieces' },
    { ingredientId: 'ing-uuid-5', ingredientName: 'Ginger', quantityPerUnit: 10, unit: 'grams' },
  ],
  'prod-uuid-4': [
    { ingredientId: 'ing-uuid-7', ingredientName: 'Pineapple', quantityPerUnit: 1, unit: 'pieces' },
  ],
}

export const MOCK_INGREDIENTS_REPORT = {
  targetDate: '2026-06-28',
  ingredients: [
    { ingredientId: 'ing-uuid-1', ingredientName: 'Orange', totalQuantity: 10, unit: 'pieces' },
    { ingredientId: 'ing-uuid-2', ingredientName: 'Spinach', totalQuantity: 50, unit: 'grams' },
    { ingredientId: 'ing-uuid-3', ingredientName: 'Cucumber', totalQuantity: 1, unit: 'pieces' },
    { ingredientId: 'ing-uuid-4', ingredientName: 'Apple', totalQuantity: 1, unit: 'pieces' },
    { ingredientId: 'ing-uuid-5', ingredientName: 'Ginger', totalQuantity: 10, unit: 'grams' },
  ],
  productsWithoutRecipe: [],
}

export const MOCK_ADMIN_LEDGER = {
  items: [
    {
      id: 'ledger-1',
      entryType: 'DEBIT',
      sourceType: 'DELIVERY_DEBIT',
      amountPaise: 5000,
      balanceAfterPaise: 15000,
      description: 'Delivery on 2026-06-27 — Orange Juice ×2',
      createdAt: '2026-06-27T08:45:00+05:30',
    },
    {
      id: 'ledger-2',
      entryType: 'DEBIT',
      sourceType: 'DELIVERY_DEBIT',
      amountPaise: 5000,
      balanceAfterPaise: 20000,
      description: 'Delivery on 2026-06-26 — Orange Juice ×2',
      createdAt: '2026-06-26T08:45:00+05:30',
    },
    {
      id: 'ledger-3',
      entryType: 'CREDIT',
      sourceType: 'ADMIN_CREDIT',
      amountPaise: 50000,
      balanceAfterPaise: 25000,
      description: 'Wallet top-up by admin — UPI ref TXN9876',
      createdAt: '2026-06-25T11:00:00+05:30',
    },
  ],
}

export const MOCK_SCHEDULER_HISTORY = {
  items: [
    {
      id: 'job-1',
      jobName: 'DeliverySheetGenerationJob',
      status: 'COMPLETED',
      targetDate: '2026-06-28',
      ordersGenerated: 3,
      errorMessage: null,
      ranAt: '2026-06-28T06:00:00+05:30',
    },
    {
      id: 'job-2',
      jobName: 'OrderFreezeJob',
      status: 'COMPLETED',
      targetDate: '2026-06-28',
      ordersGenerated: null,
      errorMessage: null,
      ranAt: '2026-06-27T23:00:00+05:30',
    },
    {
      id: 'job-3',
      jobName: 'OrderGenerationJob',
      status: 'COMPLETED',
      targetDate: '2026-06-29',
      ordersGenerated: 4,
      errorMessage: null,
      ranAt: '2026-06-27T22:00:00+05:30',
    },
    {
      id: 'job-4',
      jobName: 'OrderFreezeJob',
      status: 'FAILED',
      targetDate: '2026-06-27',
      ordersGenerated: null,
      errorMessage: 'Timed out after 30s',
      ranAt: '2026-06-26T23:00:00+05:30',
    },
    {
      id: 'job-5',
      jobName: 'DeliverySheetGenerationJob',
      status: 'COMPLETED',
      targetDate: '2026-06-27',
      ordersGenerated: 2,
      errorMessage: null,
      ranAt: '2026-06-27T06:00:00+05:30',
    },
  ],
}

export const MOCK_HOLIDAYS = {
  items: [
    { id: 'hol-1', date: '2026-08-15', name: 'Independence Day', createdAt: '2026-01-01T00:00:00+05:30' },
    { id: 'hol-2', date: '2026-10-02', name: 'Gandhi Jayanti', createdAt: '2026-01-01T00:00:00+05:30' },
    { id: 'hol-3', date: '2026-11-01', name: 'Kannada Rajyotsava', createdAt: '2026-01-01T00:00:00+05:30' },
  ],
}
