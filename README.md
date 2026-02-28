# secondsy

Secondsy is a full-stack marketplace app with real-time messaging.

## Tech stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: NestJS 11, TypeScript, Prisma
- Database: MongoDB (via Prisma)
- Auth: Supabase Auth
- Realtime chat: Socket.IO
- Image uploads: Cloudinary

## Repository structure

- `ui/` Next.js frontend
- `backend/` NestJS API + WebSocket server

## Prerequisites

- Node.js 18+
- npm 9+
- A running MongoDB database
- Supabase project (Auth)
- Cloudinary account (for chat image upload)

## 1) Install dependencies

```bash
cd ui && npm install
cd ../backend && npm install
```

## 2) Configure environment variables

### Frontend (`ui/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Backend (`backend/.env`)

```env
PORT=3001
DATABASE_URL=your_mongodb_connection_string

# CORS (comma-separated, wildcard supported)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://secondsy.netlify.app

# Supabase (required)
SUPABASE_URL=your_supabase_project_url

# Token verification strategy (choose one)
# Option A: Verify JWT locally
SUPABASE_JWT_SECRET=your_jwt_secret
# or
SUPABASE_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Option B: Verify via Supabase Auth API
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3) Generate Prisma client

```bash
cd backend
npx prisma generate
```

## 4) Run locally

Start backend:

```bash
cd backend
npm run start:dev
```

Start frontend (new terminal):

```bash
cd ui
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Scripts

### Frontend (`ui`)

- `npm run dev` start local dev server
- `npm run build` build production bundle
- `npm run start` run production build
- `npm run lint` run lint checks

### Backend (`backend`)

- `npm run start:dev` start API in watch mode
- `npm run build` build app (includes `prisma generate`)
- `npm run start:prod` run built app
- `npm run lint` run lint checks
- `npm run test` run unit tests
- `npm run test:e2e` run end-to-end tests

## Backend modules

- Users
- Products
- Categories
- Messages (HTTP + WebSocket)
- Saved Products

## Notes

- Backend defaults to port `3001`.
- Frontend API calls use `NEXT_PUBLIC_BASE_URL`.
- Prisma datasource is MongoDB (`backend/prisma/schema.prisma`).
