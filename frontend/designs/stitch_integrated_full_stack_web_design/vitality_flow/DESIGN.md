---
name: Vitality Flow
colors:
  surface: '#f8faf8'
  surface-dim: '#d8dad9'
  surface-bright: '#f8faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f2'
  surface-container: '#eceeec'
  surface-container-high: '#e6e9e7'
  surface-container-highest: '#e1e3e1'
  on-surface: '#191c1b'
  on-surface-variant: '#41493e'
  inverse-surface: '#2e3130'
  inverse-on-surface: '#eff1ef'
  outline: '#717a6d'
  outline-variant: '#c0c9bb'
  surface-tint: '#2a6b2c'
  primary: '#00450d'
  on-primary: '#ffffff'
  primary-container: '#1b5e20'
  on-primary-container: '#90d689'
  inverse-primary: '#91d78a'
  secondary: '#8b5000'
  on-secondary: '#ffffff'
  secondary-container: '#ff9800'
  on-secondary-container: '#653900'
  tertiary: '#264300'
  on-tertiary: '#ffffff'
  tertiary-container: '#365c00'
  on-tertiary-container: '#9dd65b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#acf4a4'
  primary-fixed-dim: '#91d78a'
  on-primary-fixed: '#002203'
  on-primary-fixed-variant: '#0c5216'
  secondary-fixed: '#ffdcbe'
  secondary-fixed-dim: '#ffb870'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#693c00'
  tertiary-fixed: '#b9f474'
  tertiary-fixed-dim: '#9ed75b'
  on-tertiary-fixed: '#0f2000'
  on-tertiary-fixed-variant: '#2e4f00'
  background: '#f8faf8'
  on-background: '#191c1b'
  surface-variant: '#e1e3e1'
  status-active: '#2E7D32'
  status-warning: '#ED6C02'
  status-error: '#D32F2F'
  status-locked: '#455A64'
  status-future: '#0288D1'
  wallet-credit: '#2E7D32'
  wallet-debit: '#D32F2F'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 16px
  container-padding-desktop: 32px
  gutter: 16px
  section-gap: 40px
  card-inner-padding: 24px
---

## Brand & Style

The brand personality is **vibrant, disciplined, and transparent**. It bridges the gap between a high-energy wellness brand and a high-precision fintech platform. The design must evoke an emotional response of freshness and vitality while maintaining the "logistics rigor" required for a prepaid, wallet-based delivery service.

This design system utilizes a **Corporate / Modern** style infused with **Minimalist** clarity. It prioritizes information hierarchy and functional transparency, ensuring that users feel in control of their finances and their health.

- **Trust through Transparency:** Wallet balances and transaction ledgers are treated with the same visual gravity as a banking app.
- **Vibrancy through Photography:** High-fidelity, organic product imagery serves as the primary visual driver, contrasted against a clean, structured UI.
- **Operational Clarity:** The system uses distinct visual states to communicate the "10 PM Cutoff" rule, ensuring users never wonder when a change takes effect.

## Colors

The palette is anchored by **Organic Greens** (Primary) to signify health and **Citrus Orange** (Secondary) to inject energy and highlight calls to action. **Clean Whites** and a very soft, green-tinted neutral provide a clinical, professional backdrop.

- **Primary (Organic Green):** Used for main navigation, brand headers, and primary actions.
- **Secondary (Citrus Orange):** Reserved for "Quick Credit," subscription alerts, and conversion-focused buttons.
- **Semantic Logic:** 
  - **Success/Active:** Deep green for delivered orders and active subscriptions.
  - **Warning:** Orange-amber for low balance (< ₹200) and paused states.
  - **Error/Danger:** Crimson for cancelled orders and insufficient funds.
  - **Locked:** A cool slate gray used specifically for the 10 PM IST freeze state.
- **Financial Coloring:** All ledger entries must be color-coded; green for credits, red for debits.

## Typography

The typography strategy balances friendly consumer appeal with technical precision.

- **Headlines (Plus Jakarta Sans):** Chosen for its soft, rounded terminals that feel approachable and modern. Used for page titles and prominent "Today's Delivery" cards.
- **Body (Hanken Grotesk):** A sharp, contemporary grotesque that ensures high legibility for delivery notes and item descriptions.
- **Data (JetBrains Mono):** Utilized exclusively for technical identifiers (UUIDs, transaction hashes) and wallet balance displays to reinforce the system's "financial rigor."

**Hierarchy Rules:**
- Wallet balances should always be displayed in `mono-data` or a bolded weight of `headline-lg` for clarity.
- Time-based cutoffs (e.g., "Changes effective from...") should use `label-caps` to distinguish from general body text.

## Layout & Spacing

This design system uses a **Fixed Grid** for the desktop Admin Dashboard and a **Fluid, Single-Column** layout for the Customer PWA.

- **The Temporal Rhythm:** Layouts are organized around the 24-hour cycle. The most important information (Wallet Balance + Next Delivery) must sit above the fold on mobile.
- **Customer App:** Uses generous 24px internal padding for cards to allow for a "breathable" feel. High-priority "Low Balance" banners use sticky positioning at the top of the viewport.
- **Admin Dashboard:** Utilizes a high-density 12-column grid. Data tables use compact 8px vertical padding for row density, ensuring auditors can scan ledger history effectively.
- **Breakpoints:**
  - **Mobile (<600px):** Single column, 16px margins.
  - **Tablet (600px - 1024px):** 8-column fluid grid.
  - **Desktop (>1024px):** 12-column fixed grid (1200px max-width).

## Elevation & Depth

Visual hierarchy is conveyed through **Tonal Layers** and **Ambient Shadows** to create a structured, tactile environment.

- **Surface Strategy:** The background uses the `neutral-color-hex` (#F8FAF8). Primary interaction containers (Cards) are pure white (#FFFFFF) with a soft, diffused shadow (0px 4px 20px rgba(0, 40, 0, 0.05)).
- **The "Lock" State:** When an order enters the `LOCKED` state after 10 PM, the card's elevation is removed. It transitions from a raised white surface to a flat, light-gray surface, visually signaling it is no longer interactive.
- **High-Priority Banners:** Low-balance warnings and "Insufficient Funds" blocks use a "thick" 4px left-border of the semantic color rather than shadows, ensuring they stand out as system-level alerts without cluttering the Z-axis.

## Shapes

The shape language is **Rounded**, reflecting the organic nature of the product (juice) while maintaining enough structure to feel professional.

- **Base Radius (0.5rem):** Applied to buttons, input fields, and standard list items.
- **Large Radius (1rem):** Applied to primary cards and "Wallet" display containers to make them feel prominent and friendly.
- **Pill Shapes:** Used exclusively for status badges (e.g., `ACTIVE`, `DELIVERED`) to distinguish them from interactive buttons.
- **Borders:** 1px solid borders are used for secondary containers, utilizing a low-contrast version of the primary green to maintain a "fresh" feel.

## Components

### Buttons
- **Primary:** Solid `primary_color_hex` with white text. High emphasis.
- **Secondary (Quick Credit):** Solid `secondary_color_hex` (Citrus Orange). This is the "high-utility" button for wallet top-ups.
- **Tertiary:** Ghost style with a 1px `primary-color` border. Used for "Pause" or "Edit" actions.

### Cards
- **The "Today" Card:** High-fidelity. Must include the product image, delivery status badge, and the "10 PM Cutoff" countdown if active.
- **Wallet Card:** Uses a dedicated background (soft green) to separate financial data from operational data.

### Lists & Tables
- **Ledger:** Alternating row colors are avoided. Instead, use thin `1px` dividers and color-coded amount labels (Green/Red).
- **Audit Logs:** Use `mono-data` typography for system notes.

### Inputs & Selects
- Inputs feature a 2px bottom border that highlights in `primary-color` on focus.
- **Date Picker:** Must clearly highlight "Next Available Delivery Date" based on the 10 PM IST logic (T+1 vs T+2).

### Status Badges
- Small, uppercase labels in `label-caps` font. 
- Backgrounds use a 10% opacity version of the semantic status color with a 100% opacity text for high legibility and a soft look.