# Stripe Integration & Next Steps

This document is the single source of truth for the Minenager Stripe Checkout and Subscription integration.

---

## Part 1 — Overview of Implemented Architecture

1. **Embedded Checkout (Dahlia SDK)**:
   - Client renders the official Stripe Dahlia embedded form directly in the Account modal (`modal_account.html`).
   - SDK is loaded from `https://js.stripe.com/dahlia/stripe.js` with beta flag `custom_checkout_payment_form_1`.
2. **Server-Side Checkout Session Creation**:
   - Backend endpoint: `POST /api/v1/billing/create-checkout-session`.
   - Initialized with Stripe API version `2026-03-25.dahlia; custom_checkout_payment_form_preview=v1`.
   - Configured with `mode="subscription"`, `ui_mode="form"`, and `payment_method_collection="always"`.
3. **Webhook Fulfillment**:
   - Backend endpoint: `POST /api/v1/billing/webhook`.
   - Listens for `checkout.session.completed`, automatically updates `users.tier = 'pro'`, and registers or updates the `subscriptions` table.

---

## Configured Parameters

These parameters were configured according to the Checkout Studio Field Intents and are set:

**Files containing these parameters:**
- [app/routers/billing.py](app/routers/billing.py)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `"form"` (for Stripe SDK >= 21.0.0 / Dahlia preview) |
| `mode` | `"subscription"` (recurring $2.50 / month) |
| `billing_address_collection` | `"auto"` |
| `phone_number_collection` | `{"enabled": false}` |
| `automatic_tax` | `{"enabled": false}` |
| `payment_method_collection` | `"always"` |
| `submit_type` | `"auto"` |
| `integration_identifier` | `"custom_embedded_web_0001"` |

---

## Values Configured & Active

The following live test credentials and identifiers provided by the user are now active:

| Field | Configured Value | Status |
|-------|------------------|--------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Loaded via `.env` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Loaded via `.env` |
| `STRIPE_PRICE_ID` | `price_1UMwklRg74MeE2fvhbObV3Lm` ($2.50/mo) | Loaded via `.env` / config default |
| `STRIPE_WEBHOOK_SECRET` | Optional in dev / Required in prod (`whsec_...`) | Configured via `.env` |

---

## Setup and Verification

### 1. Test Cards
To test the checkout form without charging real money, use standard Stripe test cards:
- **Card Number**: `4242 4242 4242 4242`
- **MM/YY**: Any future date (e.g. `12/28`)
- **CVC**: Any 3 digits (e.g. `123`)
- **ZIP/Postal Code**: Any valid ZIP (e.g. `90210`)

### 2. Live Webhook Setup for Production
When deploying to your production VPS:
1. Go to your [Stripe Dashboard Webhooks](https://dashboard.stripe.com/test/workbench/webhooks) (or Live webhooks when live).
2. Click **Add endpoint**.
3. Set the Endpoint URL to:
   ```text
   https://api.minenager.net/api/v1/billing/webhook
   ```
4. Select the event:
   - `checkout.session.completed`
5. Reveal the **Signing secret** (`whsec_...`) and set it as an environment variable in your production VPS `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Resources
- Stripe Checkout Docs: [https://docs.stripe.com/checkout](https://docs.stripe.com/checkout)
- Stripe Webhook Workbench: [https://dashboard.stripe.com/workbench/webhooks](https://dashboard.stripe.com/workbench/webhooks)
- Stripe Developer Support: [https://support.stripe.com](https://support.stripe.com)
