# PromptFactory

> **AI Photo Transformation Prompts Platform** — Browse, discover, and generate stunning before→after photo transformations powered by curated AI prompts.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Admin Portal](#admin-portal)
- [Deployment](#deployment)

---

## Overview

PromptFactory is a full-stack web application that lets users explore and apply curated AI prompts for photo transformations. Users can browse styles by category, search across the full library, view before→after examples, and generate transformed images by uploading their own reference photo.

A separate admin portal allows administrators and managers to manage the prompt library, users, subscriptions, LLM keys, and platform usage analytics.

---

## Features

### Customer-Facing
| Feature | Description |
|---|---|
| **Home Page** | Hero section with live stats, trending prompt grid, featured prompt, category highlights |
| **Explore** | Full paginated grid of all styles — filter by category, search by keyword, sort by ID or popularity |
| **Categories** | Sidebar-driven category browser — select any category to see all its styles |
| **Style Detail** | Before/after reference images, full prompt text with copy, image generation panel |
| **Image Generation** | Upload a reference photo and generate a transformed image using the selected prompt |
| **Authentication** | Google OAuth + email/password sign-in via Supabase Auth |
| **Premium Tier** | Free (single-stage generation, 3/day limit) vs Premium (3-stage pipeline, unlimited) |
| **Dark / Light Mode** | Persistent theme toggle across the entire app |

### Admin Portal (`/admin`)
| Feature | Description |
|---|---|
| **Dashboard** | Live stats: total users, premium users, requests, active webhooks |
| **Prompt Management** | Full CRUD for the `PromptCollection` — sortable table with image previews |
| **Image Review** | Review before/after image pairs, check completeness |
| **User Management** | Search, filter, edit, upgrade/downgrade, reset daily usage |
| **Subscriptions** | Manage free vs premium plans, bulk upgrade |
| **Usage Analytics** | Generation counts, request history, per-user breakdown |
| **LLM Keys** | Manage API keys for AI service providers |
| **Admin Users** | Create/manage admin and manager accounts with role-based access |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| React Router | v6 | Client-side routing |
| Axios | 1.6 | HTTP client |
| React Hot Toast | 2.4 | Toast notifications |
| CSS Modules | — | Scoped component styling |
| Google Fonts | — | DM Serif Display + Inter |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.18 | HTTP server & routing |
| Supabase JS | 2.x | Database client (PostgreSQL) |
| `pg` | 8.11 | Direct PostgreSQL for migrations |
| JSON Web Tokens | 9.x | Auth tokens (user + admin portal) |
| bcryptjs | 2.4 | Password hashing (admin users) |
| Multer | 1.4 | File upload handling |
| express-validator | 7.x | Request validation |

### Infrastructure
| Service | Purpose |
|---|---|
| **Supabase** | PostgreSQL database + Auth (Google OAuth) |
| **Cloudinary** | Image storage (`FromURL` / `ToURL` for prompts) |

---

## Project Structure

```
promptfactory/
├── backend/
│   ├── controllers/
│   │   ├── adminAuthController.js    # Admin portal login / me
│   │   ├── adminController.js        # Dashboard stats, users, usage
│   │   ├── adminUsersController.js   # Admin user CRUD
│   │   ├── authController.js         # Customer auth
│   │   ├── promptController.js       # Prompt browse, search, generate
│   │   ├── userController.js         # Customer profile
│   │   └── webhookController.js      # Webhook events
│   ├── middlewares/
│   │   └── adminAuth.js              # JWT guard + role check for admin portal
│   ├── routes/
│   │   ├── admin.js                  # /api/admin/* (protected)
│   │   ├── adminAuth.js              # /api/admin/auth/login, /me
│   │   ├── auth.js                   # /api/auth/*
│   │   ├── prompt.js                 # /api/prompt/*
│   │   ├── requests.js               # /api/requests/*
│   │   ├── user.js                   # /api/user/*
│   │   └── webhook.js                # /api/webhook/*
│   ├── .env                          # Environment variables (not committed)
│   ├── server.js                     # Express entry point
│   └── package.json
│
├── database/
│   ├── migrate.js                    # Creates users, requests, llm_keys, webhooks tables
│   ├── migrate_admin_users.js        # Creates admin_users table + seeds default accounts
│   ├── schema.sql                    # Full schema reference
│   └── seed.js                       # Sample data seeder
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js              # Customer-facing axios instance
│   │   │   └── adminApi.js           # Admin portal axios instance (separate token)
│   │   ├── components/
│   │   │   ├── Navbar.jsx / .module.css
│   │   │   ├── Footer.jsx / .module.css
│   │   │   └── PromptCard.jsx / .module.css
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx           # Customer auth context
│   │   │   └── useAdminAuth.jsx      # Admin portal auth context
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Landing page with hero + trending
│   │   │   ├── Explore.jsx           # Full browsable style library
│   │   │   ├── Categories.jsx        # Category sidebar + style grid
│   │   │   ├── PromptDetail.jsx      # Style detail + image generator
│   │   │   ├── Auth.jsx              # Sign in / sign up
│   │   │   ├── Contact.jsx
│   │   │   ├── Legal.jsx
│   │   │   ├── VideoComingSoon.jsx
│   │   │   └── admin/
│   │   │       ├── index.jsx         # Admin shell (sidebar + route switching)
│   │   │       ├── Login.jsx         # Admin login page
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Prompts.jsx
│   │   │       ├── Images.jsx
│   │   │       ├── Users.jsx
│   │   │       ├── Subscriptions.jsx
│   │   │       ├── Usage.jsx
│   │   │       ├── LLMKeys.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       └── Admin.module.css
│   │   ├── styles/
│   │   │   └── pages.module.css      # Consolidated styles for all customer pages
│   │   ├── App.jsx                   # Root: providers, routes, theme
│   │   └── index.css                 # Global CSS variables (dark/light themes)
│   └── package.json
│
├── RENV FILE.txt                     # Reference environment config (team use)
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudinary](https://cloudinary.com) account (for image URLs)

### 1. Clone the repository

```bash
git clone https://github.com/baskaranchidambaram07-coder/promptfactory.git
cd promptfactory
git checkout dev
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Fill in values — see Environment Variables section below
```

### 4. Run database migrations

```bash
# From the project root
node database/migrate.js            # Creates users, requests, llm_keys, webhooks
node database/migrate_admin_users.js # Creates admin_users table + default accounts
```

### 5. Start the development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open **http://localhost:3000** for the customer app and **http://localhost:3000/admin** for the admin portal.

---

## Environment Variables

Create `backend/.env` with the following:

```env
# Server
PORT=5000
NODE_ENV=development

# Auth
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_KEY=<your_supabase_service_key>

# Direct DB connection (used by migration scripts)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<host>:6543/postgres

# Storage
STORAGE_TYPE=local
UPLOAD_DIR=uploads

# Webhook
WEBHOOK_SECRET=your_webhook_secret_key

# AI Service
AI_SERVICE_URL=http://localhost:5000/api/ai/simulate
```

---

## Database Setup

### Tables

| Table | Description |
|---|---|
| `PromptCollection` | Core prompt library — `PromptId`, `promptdescription`, `Categories`, `tags`, `FromURL`, `ToURL`, `usedcount` |
| `users` | Customer accounts synced from Supabase Auth |
| `requests` | Image generation request log |
| `llm_keys` | LLM provider API key management |
| `webhooks` | Registered webhook endpoints |
| `admin_users` | Admin portal accounts with role (`admin` / `manager`) |

### Running Migrations

```bash
node database/migrate.js             # Core tables
node database/migrate_admin_users.js # Admin users table
```

### Default Admin Credentials

After running `migrate_admin_users.js` the following seed accounts are created:

| Email | Password | Role |
|---|---|---|
| `superadmin@promptfactory.io` | `Admin@123` | admin |
| `manager@promptfactory.io` | `Manager@123` | manager |

> **Change these passwords immediately in production.**

---

## API Reference

### Public Prompt Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/prompt/` | All prompts (supports `?category=`) |
| `GET` | `/api/prompt/categories` | Top categories with usage totals |
| `GET` | `/api/prompt/trending?limit=N` | Most recently popular prompts |
| `GET` | `/api/prompt/top?limit=N` | Top prompts by use count |
| `GET` | `/api/prompt/search?q=` | Full-text search across description/tags/category |
| `GET` | `/api/prompt/:id` | Single prompt detail |
| `POST` | `/api/prompt/:id/click` | Record a prompt view/click |
| `POST` | `/api/prompt/generate` | Generate image (requires auth + file upload) |

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email/password |
| `GET` | `/api/auth/me` | Get current user (requires token) |

### Admin Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Admin portal login |
| `GET` | `/api/admin/auth/me` | Get current admin user |

### Admin Endpoints (all require `admin_portal` JWT)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET/POST` | `/api/admin/collection` | List / create prompts |
| `PUT/DELETE` | `/api/admin/collection/:id` | Update / delete prompt |
| `GET/PUT` | `/api/admin/users` | List / edit customers |
| `GET/PATCH` | `/api/admin/subscriptions` | List / toggle premium plans |
| `GET/POST` | `/api/admin/llm-keys` | List / upsert LLM API keys |
| `GET` | `/api/admin/usage` | Usage analytics summary |
| `GET/POST/PUT/DELETE` | `/api/admin/admin-users` | Admin user management (admin role only) |

---

## Admin Portal

Access at **http://localhost:3000/admin**

### Roles

| Role | Permissions |
|---|---|
| **admin** | Full access including Admin Users tab — can create/edit/delete admin accounts |
| **manager** | All tabs except Admin Users |

### Auth Flow

The admin portal uses a **completely separate** authentication system from the customer app:

- Token stored as `pf_admin_token` in localStorage
- Axios instance (`adminApi.js`) automatically attaches the token to every request
- JWT payload includes `type: 'admin_portal'` to distinguish from customer tokens
- `AdminRoute` and `AdminLoginRoute` guards in `App.jsx` protect all `/admin/*` routes

---

## Deployment

### Backend

```bash
cd backend
NODE_ENV=production npm start
```

Ensure all `backend/.env` values are set with production credentials.

### Frontend

```bash
cd frontend
npm run build
# Serve the dist/ folder via Nginx, Vercel, Netlify, etc.
```

Set the API base URL via `VITE_API_URL` in a `frontend/.env` file if your backend is on a different domain.

### Recommended Stack

| Layer | Service |
|---|---|
| Frontend | Vercel / Netlify |
| Backend | Railway / Render / EC2 |
| Database | Supabase (managed PostgreSQL) |
| Images | Cloudinary |

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production releases |
| `uat` | User acceptance testing |
| `dev` | Active development (current) |
| `feature` | Feature branches |

---

## License

Private — all rights reserved © 2026 PromptFactory Inc.
