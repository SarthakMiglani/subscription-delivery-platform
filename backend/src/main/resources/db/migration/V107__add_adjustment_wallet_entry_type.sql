-- V107: Add ADJUSTMENT value to wallet_entry_type enum.
-- Required for admin manual adjustments (REFUND/ADJUSTMENT/DEBIT flows in AdminWalletController).
ALTER TYPE wallet_entry_type ADD VALUE IF NOT EXISTS 'ADJUSTMENT';
