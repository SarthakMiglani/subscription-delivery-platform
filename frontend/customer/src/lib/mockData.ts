/**
 * Mock responses for all API endpoints — used when VITE_MOCK=true
 * Covers every screen in the customer app with realistic data.
 */

export const MOCK_PROFILE = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Ravi Kumar',
  email: 'ravi.kumar@example.com',
  phone: '9876543210',
  onboardingComplete: true,
  address: {
    id: 'addr-uuid-1',
    line1: '42 MG Road',
    line2: 'Apt 3B',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    deliveryNotes: 'Leave at the door',
  },
  wallet: {
    balancePaise: 15000,
    lowBalanceWarning: true,
    lowBalanceThresholdPaise: 20000,
  },
  createdAt: '2025-06-01T10:00:00+05:30',
}

export const MOCK_PRODUCTS = {
  items: [
    {
      id: 'prod-uuid-1',
      name: 'Orange Juice',
      description: 'Freshly squeezed Valencia oranges, cold-pressed daily',
      pricePerUnitPaise: 2500,
      unitLabel: '500ml bottle',
      imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
    },
    {
      id: 'prod-uuid-2',
      name: 'Watermelon Juice',
      description: 'Cold-pressed watermelon with a hint of mint',
      pricePerUnitPaise: 3000,
      unitLabel: '500ml bottle',
      imageUrl: 'https://images.unsplash.com/photo-1563746924237-f81d6a3a908c?w=400&q=80',
    },
    {
      id: 'prod-uuid-3',
      name: 'Mixed Greens',
      description: 'Spinach, cucumber, apple & ginger blend',
      pricePerUnitPaise: 3500,
      unitLabel: '350ml bottle',
      imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80',
    },
    {
      id: 'prod-uuid-4',
      name: 'Pineapple Juice',
      description: 'Tropical fresh-pressed pineapple',
      pricePerUnitPaise: 2800,
      unitLabel: '500ml bottle',
      imageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=400&q=80',
    },
  ],
}

export const MOCK_SUBSCRIPTIONS = {
  items: [
    {
      id: 'sub-uuid-1',
      productId: 'prod-uuid-1',
      productName: 'Orange Juice',
      quantity: 2,
      status: 'ACTIVE',
      effectiveStartDate: '2025-07-01',
      pendingChangeRequests: [
        {
          type: 'QUANTITY',
          newQuantity: 3,
          effectiveDate: '2026-06-30',
          status: 'APPROVED',
        },
      ],
      createdAt: '2025-06-30T09:00:00+05:30',
    },
    {
      id: 'sub-uuid-2',
      productId: 'prod-uuid-2',
      productName: 'Watermelon Juice',
      quantity: 1,
      status: 'PAUSED',
      effectiveStartDate: '2025-07-10',
      pendingChangeRequests: [],
      createdAt: '2025-07-09T10:00:00+05:30',
    },
    {
      id: 'sub-uuid-3',
      productId: 'prod-uuid-3',
      productName: 'Mixed Greens',
      quantity: 1,
      status: 'PENDING_START',
      effectiveStartDate: '2026-06-30',
      pendingChangeRequests: [],
      createdAt: '2026-06-28T09:00:00+05:30',
    },
  ],
}

export const MOCK_ORDERS = {
  items: [
    {
      id: 'order-uuid-1',
      subscriptionId: 'sub-uuid-1',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-29',
      status: 'SCHEDULED',
      isLocked: false,
    },
    {
      id: 'order-uuid-2',
      subscriptionId: 'sub-uuid-1',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-28',
      status: 'LOCKED',
      isLocked: true,
    },
    {
      id: 'order-uuid-3',
      subscriptionId: 'sub-uuid-1',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-27',
      status: 'DELIVERED',
      isLocked: true,
    },
    {
      id: 'order-uuid-4',
      subscriptionId: 'sub-uuid-1',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-26',
      status: 'DELIVERED',
      isLocked: true,
    },
    {
      id: 'order-uuid-5',
      subscriptionId: 'sub-uuid-2',
      productName: 'Watermelon Juice',
      quantity: 1,
      totalAmountPaise: 3000,
      deliveryDate: '2026-06-25',
      status: 'SKIPPED',
      isLocked: true,
    },
    {
      id: 'order-uuid-6',
      subscriptionId: 'sub-uuid-1',
      productName: 'Orange Juice',
      quantity: 2,
      totalAmountPaise: 5000,
      deliveryDate: '2026-06-24',
      status: 'DELIVERED',
      isLocked: true,
    },
  ],
}

export const MOCK_WALLET = {
  balancePaise: 15000,
  lowBalanceWarning: true,
  lowBalanceThresholdPaise: 20000,
}

export const MOCK_LEDGER = {
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
    {
      id: 'ledger-4',
      entryType: 'DEBIT',
      sourceType: 'DELIVERY_DEBIT',
      amountPaise: 5000,
      balanceAfterPaise: -25000,
      description: 'Delivery on 2026-06-24 — Orange Juice ×2',
      createdAt: '2026-06-24T08:45:00+05:30',
    },
    {
      id: 'ledger-5',
      entryType: 'REFUND',
      sourceType: 'REFUND',
      amountPaise: 3000,
      balanceAfterPaise: -20000,
      description: 'Refund for skipped delivery on 2026-06-23',
      createdAt: '2026-06-23T10:00:00+05:30',
    },
    {
      id: 'ledger-6',
      entryType: 'CREDIT',
      sourceType: 'ADMIN_CREDIT',
      amountPaise: 100000,
      balanceAfterPaise: -23000,
      description: 'Initial wallet load — cash collected',
      createdAt: '2025-07-01T09:00:00+05:30',
    },
  ],
}
