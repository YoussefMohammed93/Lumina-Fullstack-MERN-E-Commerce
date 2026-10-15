# MERN E-Commerce Portfolio Project

## Project Planning and Technical Specification

**Status:** Planning draft\
**Project type:** Advanced full-stack e-commerce portfolio application\
**Target market:** International customers\
**Timeline:** 4--6 weeks\
**Codebase:** TypeScript monorepo\
**Checkout methods:** Online payment + cash on delivery\
**Store type:** General-purpose store

> This document consolidates the decisions and proposals discussed so
> far. Items explicitly marked "to decide" are not finalized yet.

------------------------------------------------------------------------

## 1. Project vision

Build a polished, production-style e-commerce platform that demonstrates
full-stack engineering skills for Full-Stack MERN Developer
applications. It should go beyond a basic CRUD tutorial and include a
responsive storefront, complete admin dashboard, secure checkout,
payment processing, order management, inventory controls, testing,
deployment, and documentation.

The goal is a strong portfolio project first, with an architecture that
could be extended toward a real business later.

### Project objectives

-   Deliver a complete customer shopping journey.
-   Build a full admin dashboard to manage the store.
-   Demonstrate sound REST API and MongoDB design.
-   Handle payment callbacks and order state transitions safely.
-   Include authentication, authorization, validation, security, and
    automated tests.
-   Deploy a working demo with seeded data and a professional README.

## 2. Confirmed decisions

  -----------------------------------------------------------------------
  Decision                            Choice
  ----------------------------------- -----------------------------------
  Store type                          General store with multiple product
                                      categories

  Primary goal                        Portfolio project

  Difficulty                          Advanced

  Target market                       International customers

  Checkout methods                    Online payment and cash on delivery
                                      (COD)

  Admin                               Full admin dashboard

  Timeline                            4--6 weeks

  Codebase                            Monorepo with separate client and
                                      server apps

  Language                            TypeScript on frontend and backend

  Extra features                      Wishlist; reviews and ratings;
                                      product search and advanced filters
  -----------------------------------------------------------------------

### Still to decide

-   Guest checkout vs account-required checkout. Both was recommended,
    but not confirmed.
-   Payment gateway based on merchant eligibility, supported country,
    currencies, and fees.
-   Initial checkout currency and whether multi-currency display is in
    scope.
-   Shipping-rate rules and which destination countries are enabled.
-   Whether guest carts are included in the MVP.

## 3. Feature scope

### Customer storefront

-   Responsive homepage with featured products, categories, and
    promotions.
-   Product listing and category pages.
-   Search, sorting, pagination, and advanced filters.
-   Product details with images, variants, price, availability, and
    reviews.
-   Cart and wishlist.
-   Checkout with shipping address, shipping method, coupon, and payment
    method.
-   Order confirmation, order history, and order tracking.
-   Customer profile and saved addresses.
-   Reviews and ratings.

### Admin dashboard

-   Dashboard overview with sales, revenue, and order KPIs.
-   Product, category, image, and inventory management.
-   Order search, filtering, fulfillment, and cancellation.
-   Customer management.
-   Review moderation.
-   Coupons and discount rules.
-   Basic sales reports and analytics.
-   Audited stock adjustments.

### Backend and integrations

-   Authentication, authorization, and role-based access.
-   REST API with request validation and consistent error responses.
-   MongoDB schemas and indexes.
-   Payment provider abstraction, sandbox integration, and verified
    webhooks.
-   Cloud image storage (proposed: Cloudinary).
-   Email notifications.
-   Structured logging, automated tests, API documentation, and
    deployment.

### Scope strategy

Prioritize a working, polished core before adding every possible
feature. If time becomes tight, simplify advanced analytics, promotions,
and international shipping refinements before compromising checkout
correctness, security, or order handling.

## 4. Recommended technology stack

  -----------------------------------------------------------------------
  Layer                               Recommendation
  ----------------------------------- -----------------------------------
  Frontend                            React + TypeScript + Vite

  Routing                             React Router

  Styling                             Tailwind CSS + shadcn/ui

  Client-owned state                  Redux Toolkit

  Server state and caching            TanStack Query

  Forms                               React Hook Form + Zod

  Backend                             Node.js + Express + TypeScript

  Database                            MongoDB + Mongoose

  API                                 REST, versioned under `/api/v1`

  API documentation                   Swagger / OpenAPI

  Testing                             Vitest, React Testing Library,
                                      Supertest

  CI                                  GitHub Actions

  Image storage                       Cloudinary or equivalent

  Payments                            Provider adapter; gateway to be
                                      selected after eligibility checks

  Deployment                          Vercel or equivalent for frontend;
                                      Node-compatible host for API;
                                      managed MongoDB

  Optional                            Docker for consistent local setup
  -----------------------------------------------------------------------

### Architecture notes

-   Redux Toolkit handles client-owned state such as cart interactions
    and UI preferences; TanStack Query handles API data and caching.
-   Use secure HttpOnly cookies for session/refresh credentials, with a
    well-designed session or token lifecycle and CSRF protection where
    applicable.
-   Keep payment-provider logic behind an adapter so order logic is not
    tied to a single gateway.
-   Store money in integer minor units and always record an ISO currency
    code.
-   Store image URLs and provider asset identifiers, not image binaries,
    in MongoDB.
-   Use a modular monolith: one backend application separated by
    business domain, not microservices.
-   Share API contracts and validation schemas through a shared package
    where appropriate. Never expose Mongoose models to the browser.

## 5. Monorepo structure

``` text
mern-commerce/
├── apps/
│   ├── client/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── products/
│   │   │   │   ├── cart/
│   │   │   │   ├── wishlist/
│   │   │   │   ├── checkout/
│   │   │   │   ├── orders/
│   │   │   │   └── admin/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── routes/
│   │   └── vite.config.ts
│   └── server/
│       └── src/
│           ├── config/
│           ├── middleware/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── products/
│           │   ├── categories/
│           │   ├── carts/
│           │   ├── wishlists/
│           │   ├── orders/
│           │   ├── payments/
│           │   ├── reviews/
│           │   ├── coupons/
│           │   └── inventory/
│           ├── integrations/
│           ├── jobs/
│           ├── app.ts
│           └── server.ts
├── packages/
│   └── shared/
│       └── src/
│           ├── schemas/
│           ├── types/
│           └── constants/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Suggested backend flow: routes → controllers → services →
repositories/models. Apply layers where they add clarity, without
unnecessary abstraction for every operation.

## 6. Payment architecture

Use one checkout flow with two payment methods, while keeping payment
processing separate from order management.

### Online payment

1.  The server validates the cart and shipping details.
2.  The server recalculates prices, discount, shipping, tax, and grand
    total.
3.  The server creates an order/payment attempt with a pending state and
    applies the chosen inventory strategy.
4.  The server creates a checkout session with the chosen payment
    provider.
5.  The customer completes payment with the provider.
6.  The provider sends a signed webhook.
7.  The server verifies the signature, deduplicates the event, checks
    amount and currency against the order, and updates payment/order
    state.
8.  The customer-facing success page displays the server-confirmed
    status; it is not itself proof of payment.

### Cash on delivery

-   The order is created under COD rules.
-   Payment status remains `pending` until collection is confirmed.
-   Delivery and payment are separate state machines.
-   Admins can record reconciliation only through authorized, audited
    operations.

### Payment safety requirements

-   Never store card numbers or CVVs.
-   Verify webhook signatures.
-   Deduplicate webhook event IDs and handle repeated/out-of-order
    events.
-   Use idempotency keys for checkout and payment attempts.
-   Permit payment retry without creating duplicate orders.
-   Track refunds separately, including amount, provider reference,
    status, and timestamps.
-   Do not trust frontend payment status or client-submitted totals.

### Gateway selection

Do not assume a provider is available for every merchant country. Verify
business-account eligibility, supported currencies, international
payment acceptance, webhook support, sandbox access, fees, and payout
requirements before choosing. Use sandbox/test credentials during
development.

## 7. Shipping architecture

For the first version, implement shipping rules internally rather than
integrating a courier API immediately.

-   Address fields: recipient, phone, country, region/state, city,
    postal code, address lines.
-   Shipping options: standard and express where configured.
-   Server calculates shipping from enabled destination and configurable
    rules.
-   Optional free-shipping threshold configured by admin.
-   Internal tracking number and shipment status.
-   Admin updates fulfillment and exception states.
-   Reject destinations not enabled in store settings.
-   Use one initial checkout currency unless multi-currency support is
    explicitly added.
-   Ensure the payment provider supports the selected checkout currency.

## 8. Order lifecycle and inventory

Order status and payment status must remain independent.

### Proposed order statuses

`pending` → `confirmed` → `processing` → `shipped` → `delivered`

Other possible states: `cancelled`, `returned`.

Allowed transitions must be enforced by the backend. COD orders can be
delivered while payment remains pending until collection is confirmed,
depending on the business workflow.

### Proposed payment statuses

`pending`, `paid`, `failed`, `partially_refunded`, `refunded`.

Payment-attempt records may additionally use `created`, `cancelled`, and
provider-specific intermediate states.

### Inventory consistency

-   Use atomic stock updates and prevent negative stock.
-   Use a defined stock reservation or decrement strategy during
    checkout.
-   Release eligible reservations on cancellation or expiry.
-   Record inventory movements for restock, sale, reservation, release,
    return, and adjustment.
-   Use MongoDB transactions for multi-document changes when needed, and
    deploy to a replica-set-capable MongoDB environment.
-   Test concurrent purchases of the last item.

## 9. MongoDB collections and proposed schemas

These are initial designs to refine before implementation.

### `users`

``` ts
{
  _id: ObjectId;
  name: string;
  email: string;             // normalized, unique
  passwordHash: string;      // never expose to client
  role: "customer" | "admin";
  addresses: Address[];
  isEmailVerified: boolean;
  status: "active" | "disabled";
  createdAt: Date;
  updatedAt: Date;
}
```

Use separate security records for sessions/refresh credentials and
expiring password-reset and email-verification tokens where appropriate.
Store only hashed token values.

### `categories`

``` ts
{
  _id: ObjectId;
  name: string;
  slug: string;              // unique
  description?: string;
  image?: string;
  parentId?: ObjectId;
  isActive: boolean;
  sortOrder: number;
}
```

### `products`

``` ts
{
  _id: ObjectId;
  name: string;
  slug: string;              // unique
  description: string;
  brand?: string;
  categoryIds: ObjectId[];
  images: {
    url: string;
    publicId: string;
    alt: string;
  }[];
  variants: {
    _id: ObjectId;
    sku: string;
    attributes: Record<string, string>;
    price: number;           // integer minor units
    compareAtPrice?: number;
    stock: number;
    isActive: boolean;
  }[];
  status: "draft" | "active" | "archived";
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Each purchasable variant has its own SKU, price, and stock. Products
without options can have a default variant.

### `carts`

``` ts
{
  _id: ObjectId;
  userId: ObjectId;          // unique per user
  items: {
    productId: ObjectId;
    variantId: ObjectId;
    quantity: number;
  }[];
  updatedAt: Date;
}
```

Do not treat cart prices as authoritative. Recalculate prices at
checkout. Guest-cart support remains a decision.

### `wishlists`

``` ts
{
  _id: ObjectId;
  userId: ObjectId;          // unique per user
  productIds: ObjectId[];
  updatedAt: Date;
}
```

### `orders`

``` ts
{
  _id: ObjectId;
  orderNumber: string;       // unique public identifier
  userId?: ObjectId;         // optional if guest checkout is supported

  items: {
    productId: ObjectId;
    variantId: ObjectId;
    sku: string;
    name: string;
    attributes: Record<string, string>;
    imageUrl: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];

  shippingAddress: {
    recipientName: string;
    phone: string;
    countryCode: string;
    region: string;
    city: string;
    postalCode?: string;
    addressLine1: string;
    addressLine2?: string;
  };

  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;

  paymentMethod: "online" | "cod";
  paymentStatus:
    | "pending" | "paid" | "failed"
    | "partially_refunded" | "refunded";

  orderStatus:
    | "pending" | "confirmed" | "processing"
    | "shipped" | "delivered"
    | "cancelled" | "returned";

  shippingMethod: string;
  trackingNumber?: string;
  couponCode?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

Order items and shipping address are snapshots, so later product or
address edits do not rewrite historical orders. If guest checkout is not
supported, make `userId` required.

### `payments`

``` ts
{
  _id: ObjectId;
  orderId: ObjectId;
  provider: string;
  providerPaymentId?: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status:
    | "created" | "pending" | "succeeded"
    | "failed" | "cancelled" | "refunded";
  failureCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Support multiple attempts per order. Store refund records separately or
as a structured collection with amount, provider reference, status, and
timestamps.

### `reviews`

``` ts
{
  _id: ObjectId;
  userId: ObjectId;
  productId: ObjectId;
  orderId?: ObjectId;
  rating: number;            // integer 1–5
  title?: string;
  comment: string;
  status: "pending" | "published" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
```

Choose and enforce a review uniqueness rule. Verified-purchase reviews
must be backed by a qualifying completed order. Update rating aggregates
consistently when reviews change state.

### `coupons`

``` ts
{
  _id: ObjectId;
  code: string;              // normalized, unique
  type: "percentage" | "fixed";
  value: number;
  currency?: string;
  minimumSubtotal?: number;
  maximumDiscount?: number;
  startsAt: Date;
  expiresAt: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}
```

Add per-customer usage limits if required. Coupon usage must be safe
under concurrent requests.

### `inventoryMovements`

``` ts
{
  _id: ObjectId;
  productId: ObjectId;
  variantId: ObjectId;
  type:
    | "restock" | "sale" | "reservation"
    | "release" | "return" | "adjustment";
  quantityDelta: number;
  orderId?: ObjectId;
  reason?: string;
  actorId?: ObjectId;
  createdAt: Date;
}
```

### `webhookEvents`

Store provider event identifiers and processing outcomes. Add a unique
index on provider + event ID so the same webhook cannot be applied
twice.

### Important indexes

  -------------------------------------------------------------------------
  Collection                          Proposed indexes
  ----------------------------------- -------------------------------------
  Users                               Unique normalized `email`

  Categories                          Unique `slug`

  Products                            Unique `slug`; unique SKU per
                                      variant; category/status indexes

  Carts                               Unique `userId`

  Wishlists                           Unique `userId`

  Orders                              Unique `orderNumber`;
                                      `{ userId, createdAt }`

  Payments                            `{ orderId, createdAt }`; unique
                                      provider references where appropriate

  Reviews                             `{ productId, status, createdAt }`;
                                      chosen review uniqueness constraint

  Coupons                             Unique normalized `code`

  Webhook events                      Unique provider event ID
  -------------------------------------------------------------------------

Confirm how variant SKUs will be indexed in Mongoose before
implementation; a unique index on an embedded array requires deliberate
schema/index design.

## 10. REST API contract

**Base URL:** `http://localhost:5000/api/v1`

### Standard response formats

Success:

``` json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your input.",
    "details": []
  }
}
```

For list responses, `meta` should contain pagination information. Use
consistent status codes: 200 for successful reads/updates, 201 for
creation, 204 for successful deletion where appropriate, 400 for
malformed input, 401 for unauthenticated requests, 403 for forbidden
actions, 404 for missing resources, 409 for conflicts, and optionally
422 for business-rule validation failures.

### Authentication and user routes

  Method   Endpoint                           Access
  -------- ---------------------------------- -----------------------
  POST     `/auth/register`                   Public
  POST     `/auth/login`                      Public
  POST     `/auth/logout`                     Authenticated
  POST     `/auth/refresh`                    Valid refresh session
  POST     `/auth/forgot-password`            Public
  POST     `/auth/reset-password`             Valid reset token
  GET      `/users/me`                        Authenticated
  PATCH    `/users/me`                        Authenticated
  GET      `/users/me/addresses`              Authenticated
  POST     `/users/me/addresses`              Authenticated
  PATCH    `/users/me/addresses/:addressId`   Authenticated
  DELETE   `/users/me/addresses/:addressId`   Authenticated

The server derives the current user from the authenticated session. A
client-supplied user ID is never proof of identity.

### Product and category routes

  Method   Endpoint                       Access
  -------- ------------------------------ --------
  GET      `/products`                    Public
  GET      `/products/:slug`              Public
  GET      `/categories`                  Public
  GET      `/categories/:slug/products`   Public
  POST     `/admin/products`              Admin
  PATCH    `/admin/products/:id`          Admin
  DELETE   `/admin/products/:id`          Admin
  POST     `/admin/categories`            Admin
  PATCH    `/admin/categories/:id`        Admin
  DELETE   `/admin/categories/:id`        Admin

Example query:

`GET /api/v1/products?q=headphones&category=electronics&minPrice=5000&maxPrice=20000&sort=price_asc&page=1&limit=12`

Potential filters: keyword, category, brand, price range, rating,
availability, variant attributes, sorting, and pagination. Validate all
query parameters and cap page size.

### Cart and wishlist routes

  Method   Endpoint                       Access
  -------- ------------------------------ ---------------
  GET      `/cart`                        Authenticated
  POST     `/cart/items`                  Authenticated
  PATCH    `/cart/items/:variantId`       Authenticated
  DELETE   `/cart/items/:variantId`       Authenticated
  DELETE   `/cart`                        Authenticated
  GET      `/wishlist`                    Authenticated
  POST     `/wishlist/items/:productId`   Authenticated
  DELETE   `/wishlist/items/:productId`   Authenticated

Add-to-cart request:

``` json
{
  "productId": "PRODUCT_OBJECT_ID",
  "variantId": "VARIANT_OBJECT_ID",
  "quantity": 2
}
```

The backend verifies product/variant existence, active status, stock,
quantity limits, and ownership. It does not trust prices from the
client.

### Checkout, orders, and payments

  -----------------------------------------------------------------------------------
  Method                  Endpoint                            Access
  ----------------------- ----------------------------------- -----------------------
  POST                    `/checkout/quote`                   Authenticated

  POST                    `/orders`                           Authenticated; guest
                                                              access depends on final
                                                              decision

  GET                     `/orders`                           Authenticated

  GET                     `/orders/:orderNumber`              Owner or admin; secure
                                                              guest access if
                                                              supported

  POST                    `/orders/:orderNumber/cancel`       Owner, subject to rules

  POST                    `/payments/:orderNumber/checkout`   Order owner

  POST                    `/payments/webhooks/:provider`      Provider signature
                                                              verification

  GET                     `/orders/:orderNumber/tracking`     Owner or admin; secure
                                                              guest access if
                                                              supported
  -----------------------------------------------------------------------------------

Example order request:

``` json
{
  "shippingAddressId": "ADDRESS_OBJECT_ID",
  "shippingMethod": "standard",
  "paymentMethod": "online",
  "couponCode": "WELCOME10"
}
```

The server obtains the cart and authoritative prices itself. It
recalculates coupon eligibility, shipping, taxes, and totals. Order
creation must be idempotent to avoid duplicate orders and stock
reservations.

### Reviews and coupon routes

  --------------------------------------------------------------------------------
  Method                  Endpoint                         Access
  ----------------------- -------------------------------- -----------------------
  GET                     `/products/:productId/reviews`   Public

  POST                    `/products/:productId/reviews`   Authenticated; purchase
                                                           rules apply

  PATCH                   `/reviews/:id`                   Review owner

  DELETE                  `/reviews/:id`                   Owner or admin, subject
                                                           to rules

  POST                    `/coupons/validate`              Authenticated

  POST                    `/admin/coupons`                 Admin

  PATCH                   `/admin/coupons/:id`             Admin

  DELETE                  `/admin/coupons/:id`             Admin
  --------------------------------------------------------------------------------

### Admin routes

  -----------------------------------------------------------------------------------------
  Method                  Endpoint                                  Purpose
  ----------------------- ----------------------------------------- -----------------------
  GET                     `/admin/dashboard/overview`               Sales and order KPIs

  GET                     `/admin/dashboard/sales`                  Sales grouped by date

  GET                     `/admin/orders`                           Search/filter orders

  PATCH                   `/admin/orders/:id/status`                Change fulfillment
                                                                    status

  PATCH                   `/admin/orders/:id/payment`               Authorized payment
                                                                    reconciliation

  GET                     `/admin/customers`                        Customer search/listing

  PATCH                   `/admin/customers/:id/status`             Disable/restore account

  GET                     `/admin/reviews`                          Moderation queue

  PATCH                   `/admin/reviews/:id/moderation`           Publish/reject review

  POST                    `/admin/products/:id/stock-adjustments`   Audited inventory
                                                                    adjustment
  -----------------------------------------------------------------------------------------

Admin routes need role checks, validation, audit logs for sensitive
operations, and rate limiting where appropriate.

## 11. Critical business and security rules

1.  Never trust client-submitted totals, roles, stock, payment status,
    or ownership.
2.  Enforce resource ownership and authorization on every protected
    endpoint.
3.  Recalculate prices and discounts on the server at checkout.
4.  Use atomic inventory operations and prevent negative stock.
5.  Define reservation, release, cancellation, and expiry rules.
6.  Verify webhook signatures and deduplicate event IDs.
7.  Check provider-confirmed payment amount and currency against the
    order.
8.  Keep payment status separate from fulfillment status.
9.  Make checkout and payment attempts idempotent.
10. Restrict cancellation and refund transitions through explicit
    business rules.
11. Protect authentication flows with secure cookies, appropriate CSRF
    controls, rate limits, and safe password/token handling.
12. Avoid exposing password hashes, secrets, provider tokens, or
    internal error traces.
13. Record inventory and sensitive admin actions for auditability.
14. Test concurrent purchases, duplicate webhooks, payment retries,
    invalid coupons, and unauthorized order access.

## 12. Four-to-six-week development roadmap

### Week 1 --- Foundation

-   Requirements and business rules.
-   Monorepo setup and TypeScript configuration.
-   Database connection and core schemas.
-   Authentication and authorization.
-   Product/category APIs and seeded demo data.

### Week 2 --- Storefront

-   Homepage and responsive layouts.
-   Product listing, search, sorting, and filters.
-   Product details and variants.
-   Cart and wishlist.

### Week 3 --- Checkout and orders

-   Addresses and shipping rules.
-   Checkout quote and order creation.
-   COD flow.
-   Online payment sandbox integration and webhook processing.
-   Inventory consistency and order history.

### Week 4 --- Admin dashboard

-   Product and inventory management.
-   Order processing and customer management.
-   Coupons and review moderation.
-   Dashboard overview and basic analytics.

### Weeks 5--6 --- Quality and launch

-   Unit, integration, and end-to-end tests.
-   Payment failure and concurrency scenarios.
-   Security review and performance improvements.
-   Deployment and environment configuration.
-   Demo data, API docs, screenshots, and professional README.

## 13. Testing and acceptance criteria

The project should not be considered complete until the following work:

-   A customer can browse, search, filter, and view products.
-   Cart and wishlist actions persist appropriately.
-   The backend rejects invalid quantities and stale/unavailable
    variants.
-   Checkout totals are calculated server-side.
-   COD orders begin unpaid and can be reconciled through authorized
    actions.
-   Online orders become paid only after verified provider confirmation.
-   Duplicate checkout requests and webhooks do not duplicate effects.
-   Concurrent checkout cannot oversell the last unit.
-   Customers cannot access another customer's orders.
-   Admin-only endpoints reject ordinary customers.
-   Coupon limits and expiry are enforced under concurrent use.
-   Reviews follow the chosen purchase and moderation rules.
-   Admin inventory changes are audited.
-   Core user journeys pass tests in the deployed environment.

## 14. Deployment and portfolio presentation

-   Deploy the frontend and API to suitable hosts.
-   Use managed MongoDB with the features needed for transactions.
-   Configure environment variables and provider webhook URLs securely.
-   Never commit `.env` files or API secrets.
-   Seed realistic demo products, categories, and orders.
-   Provide a README with features, architecture diagram, setup
    instructions, environment variable names (not values), API
    documentation, test commands, and demo credentials if appropriate.
-   Include screenshots or a short demo video, a live demo link, and a
    concise explanation of engineering decisions.
-   Clearly label sandbox payments in the demo.

## 15. Next decisions

Before writing final Mongoose models and shared TypeScript contracts,
decide:

1.  **Checkout access:** account required, or both registered and guest
    checkout? Recommendation: both.
2.  **Payment provider:** choose only after verifying merchant
    eligibility, currencies, sandbox, webhooks, and payout requirements.
3.  **Currency:** one checkout currency for MVP or multi-currency
    support.
4.  **Shipping rules:** which countries are enabled and how rates are
    calculated.
5.  **Guest cart:** include in MVP or defer.

Once these are confirmed, implement the shared request/response schemas,
Mongoose models, and API contracts, then build feature by feature.

------------------------------------------------------------------------

**Working project name:** MERN Commerce (temporary; choose a brand name
later).
