# Lumina

Lumina is a full-stack e-commerce storefront built with a React + Vite frontend and an Express + MongoDB backend. The project includes a storefront, shopping cart, product browsing, checkout flow, admin dashboard, customer authentication, and content sections such as journal stories and store settings.

## Features

- Modern storefront experience with dynamic product and category browsing
- Shopping cart and checkout flow
- Stripe payment integration and webhook handling
- Admin dashboard for catalog, orders, reviews, notifications, and settings
- Google authentication support
- Customer order tracking and account settings
- Journal/newsletter functionality
- Cloudinary media upload support
- Responsive design built with React, TypeScript, and Tailwind CSS

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI / custom UI primitives

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Stripe API
- Google OAuth / Google auth library
- TypeScript

## Repository Structure

```text
mern-ecommerce/
├── apps/
│   ├── client/          # React storefront frontend
│   └── server/          # Express API backend
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

## Prerequisites

Before running the project locally, make sure you have installed:

- Node.js 18+
- pnpm
- MongoDB instance or MongoDB Atlas connection string
- Stripe account and API keys
- Google OAuth client credentials
- Cloudinary account for media uploads

## Installation

From the project root:

```bash
pnpm install
```

## Environment Variables

### Backend (`apps/server`)

Create a `.env` file inside `apps/server`:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/lumina

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (`apps/client`)

Create a `.env` file inside `apps/client`:

```env
VITE_API_URL=http://localhost:5000
```

## Running the Project

Start the backend:

```bash
pnpm --dir apps/server dev
```

Start the frontend:

```bash
pnpm --dir apps/client dev
```

Then open:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Production Build

Build the backend:

```bash
pnpm --dir apps/server build
```

Build the frontend:

```bash
pnpm --dir apps/client build
```

## Notes

- The backend exposes API routes under `/api/v1`.
- The frontend uses the Vite proxy in development, while `VITE_API_URL` can point to a deployed backend in production.
- Stripe webhook endpoints must be configured in your Stripe dashboard to match the backend webhook route.

## License

This project is currently provided as a personal or development project without a formal OSS license declaration.
