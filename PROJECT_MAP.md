# Legal Sandbox Georgia - Complete Project Map

## 🏗️ Project Overview

**Legal Sandbox Georgia** is a comprehensive legal services platform built with Next.js 15, featuring multi-language support (Georgian, English, Russian), role-based access control, and a complete CMS for managing legal professionals, companies, and content.

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety

### Database & ORM
- **Prisma 6.16.2** - Database ORM
- **SQLite** (development) / **PostgreSQL** (production)
- **@prisma/client** - Database client

### Authentication & Authorization
- **NextAuth.js 4.24.11** - Authentication framework
- **@auth/prisma-adapter** - Prisma adapter for NextAuth
- **bcryptjs** - Password hashing
- **Google OAuth** - Social login provider

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI components
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-label`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-tabs`
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **clsx** & **tailwind-merge** - Conditional styling

### Rich Text & Content
- **TipTap** - Rich text editor
  - `@tiptap/react`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-*` (color, image, link, table, etc.)
- **DOMPurify** - HTML sanitization
- **sanitize-html** - Content sanitization

### Internationalization
- **next-intl 4.3.9** - Internationalization
- **3 Languages**: Georgian (ka), English (en), Russian (ru)

### Data Processing & Utilities
- **SWR** - Data fetching and caching
- **TanStack React Query** - Server state management
- **Zod** - Schema validation
- **slugify** - URL slug generation
- **fuse.js** - Fuzzy search
- **xlsx** - Excel file processing
- **mammoth** - Word document processing
- **fast-xml-parser** - XML parsing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Playwright** - E2E testing
- **Vitest** - Unit testing
- **tsx** - TypeScript execution

## 🗄️ Database Schema

### Core Models
```prisma
enum Role {
  SUPER_ADMIN
  COMPANY
  LAWYER
  SPECIALIST
  AUTHOR
  SUBSCRIBER
}

enum Locale {
  ka
  en
  ru
}
```

### Key Entities
- **User** - Authentication and role management
- **Account/Session** - NextAuth integration
- **Request** - Role upgrade requests
- **PracticeArea** - Legal practice categories
- **Service** - Specific legal services
- **Company** - Law firms and legal companies
- **SpecialistProfile** - Individual lawyers/specialists
- **Post** - News and blog content
- **LegalPage** - Terms, Privacy, etc.
- **Media** - File uploads
- **SliderSlide** - Homepage slider
- **AudioFile** - Audio content

### Translation Models
- **PracticeAreaTranslation**
- **ServiceTranslation**
- **SpecialistProfileTranslation**
- **LegalPageTranslation**

## 🌐 API Endpoints

### Authentication APIs
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/change-password
POST /api/auth/verify-email
GET  /api/auth/check-role
POST /api/auth/update-profile
```

### Core Content APIs
```
GET  /api/posts
POST /api/posts
GET  /api/posts/[id]
PATCH /api/posts/[id]
DELETE /api/posts/[id]

GET  /api/companies
POST /api/companies
GET  /api/companies/[id]
PATCH /api/companies/[id]
DELETE /api/companies/[id]
```

### Specialist/Lawyer APIs
```
GET  /api/specialists
POST /api/specialists/create
GET  /api/specialists/[id]
PATCH /api/specialists/[id]
GET  /api/specialists/[id]/status
```

### Request Management APIs
```
GET  /api/requests
POST /api/requests
GET  /api/requests/[id]
PATCH /api/requests/[id]

POST /api/role-upgrade
GET  /api/role-upgrade
```

### Admin APIs
```
GET  /api/admin/services
GET  /api/admin/companies
POST /api/admin/companies/delete
GET  /api/admin/legal-pages
POST /api/admin/legal-pages
PATCH /api/admin/legal-pages/[id]
DELETE /api/admin/legal-pages/[id]
```

### File Upload APIs
```
POST /api/upload
POST /api/images/upload
GET  /api/images/[id]
POST /api/admin/audio/upload
```

### Specialist Profile APIs
```
GET  /api/specialist/profile
PATCH /api/specialist/profile
POST /api/specialist/profile-change-request
GET  /api/specialist/translations
POST /api/specialist/translations
```

## 🛣️ Application Routes

### Public Routes
```
/ (homepage)
/[locale] (localized homepage)
/[locale]/practice (practice areas)
/[locale]/services (services)
/[locale]/specialists (specialists directory)
/[locale]/companies (companies directory)
/[locale]/companies/[slug] (company profile)
/[locale]/specialists/[slug] (specialist profile)
/[locale]/news (news/blog)
/[locale]/contact (contact page)
/[locale]/terms (terms of service)
/[locale]/privacy (privacy policy)
/[locale]/gavel (easter egg game)
```

### Authentication Routes
```
/auth/signin (login page)
/auth/register (registration page)
```

### Role-Based Dashboard Routes

#### Super Admin Dashboard
```
/[locale]/admin (dashboard)
/[locale]/admin/practices (practice management)
/[locale]/admin/services (service management)
/[locale]/admin/lawyers (specialist management)
/[locale]/admin/companies (company management)
/[locale]/admin/requests (request management)
/[locale]/admin/posts (content management)
/[locale]/admin/slider (slider management)
/[locale]/admin/legal-pages (legal pages management)
/[locale]/admin/database (database management - super admin only)
```

#### Company Dashboard
```
/[locale]/company (dashboard)
/[locale]/company/profile (company profile)
/[locale]/company/lawyers (manage specialists)
/[locale]/company/requests (specialist requests)
/[locale]/company/bios (bio approvals)
/[locale]/company/posts (content management)
```

#### Specialist Dashboard
```
/[locale]/specialist (dashboard)
/[locale]/specialist/profile (profile management)
/[locale]/specialist/posts (content management)
```

## 🔐 Role-Based Access Control

### User Roles
1. **SUBSCRIBER** - Basic user, can request role upgrades
2. **SPECIALIST** - Individual lawyers, can edit profiles and create content
3. **COMPANY** - Law firms, can manage specialists and company content
4. **SUPER_ADMIN** - Full system access, manages all content and users
5. **AUTHOR** - Content creation role
6. **LAWYER** - Legacy role (being phased out)

### Permission Matrix
- **SUBSCRIBER**: View content, request role upgrades
- **SPECIALIST**: Edit own profile, create posts, request profile changes
- **COMPANY**: Manage company profile, approve specialist requests, manage company specialists
- **SUPER_ADMIN**: Full access to all features and data

## 🌍 Internationalization

### Supported Locales
- **Georgian (ka)** - Default locale
- **English (en)**
- **Russian (ru)**

### Translation Structure
```
src/i18n/messages/
├── ka.json (Georgian)
├── en.json (English)
└── ru.json (Russian)
```

### Multi-language Features
- Dynamic route localization (`/[locale]/...`)
- Database translations for all content types
- Language switcher in header
- Locale-aware slug generation

## 📁 Project Structure

```
legalge/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Localized routes
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── auth/              # Authentication components
│   │   ├── ui/                # Reusable UI components
│   │   └── ...                # Feature components
│   ├── i18n/                  # Internationalization
│   │   ├── locales.ts         # Locale definitions
│   │   └── messages/          # Translation files
│   ├── lib/                   # Utility functions
│   │   ├── prisma.ts          # Database client
│   │   ├── auth-utils.ts      # Authentication utilities
│   │   └── utils.ts           # General utilities
│   └── scripts/               # Database scripts
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── uploads/                   # User-uploaded files
└── data/                      # Data files
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"  # SQLite for dev
# DATABASE_URL="postgresql://..."    # PostgreSQL for production

# Authentication
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-secret-key"
SUPER_ADMIN_EMAIL="infolegalge@gmail.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3002"
NEXT_PUBLIC_WP_BASE_URL="https://infolegalge-fcztd.wpcomstaging.com"
```

## 🚀 Deployment Requirements

### Production Environment
- **Node.js 18+**
- **PostgreSQL database** (Supabase/Neon/RDS)
- **File storage** for uploads
- **SSL certificate**
- **Domain configuration**

### Build Commands
```bash
npm run build          # Build for production
npm run start          # Start production server
npm run prisma:migrate:deploy  # Deploy database migrations
```

### Database Migration
```bash
# Development
npm run prisma:push

# Production
npm run prisma:migrate:deploy
```

## 📊 Key Features

### Content Management
- **Multi-language CMS** with tabbed editing
- **Rich text editor** with TipTap
- **Image upload** with optimization
- **Audio file upload** support
- **SEO optimization** with meta tags

### User Management
- **Role-based dashboards**
- **Profile management** with multi-language support
- **Request approval workflow**
- **Session management** with NextAuth

### Search & Discovery
- **Fuzzy search** with Fuse.js
- **Filter by location, practice area, company**
- **SEO-friendly URLs** with automatic slug generation

### File Management
- **Image optimization** and WebP conversion
- **Audio file upload** and management
- **File validation** and size limits
- **Secure file serving**

## 🔒 Security Features

- **Password hashing** with bcryptjs
- **Session management** with NextAuth
- **Role-based access control**
- **Input sanitization** with DOMPurify
- **SQL injection protection** with Prisma
- **CSRF protection** built into NextAuth

## 📈 Performance Optimizations

- **Server-side rendering** with Next.js
- **Image optimization** with Next.js Image
- **Code splitting** with dynamic imports
- **Caching** with SWR
- **Database query optimization** with Prisma

## 🧪 Testing & Quality

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Playwright** for E2E testing
- **Vitest** for unit testing

## 📱 Responsive Design

- **Mobile-first** approach with Tailwind CSS
- **Responsive navigation** with mobile menu
- **Touch-friendly** interface
- **Progressive enhancement**

## 🔄 Development Workflow

### Local Development
```bash
npm run dev           # Start development server (port 3001)
npm run prisma:studio # Open Prisma Studio (port 5556)
npm run typecheck     # Type checking
npm run lint          # Code linting
```

### Database Management
```bash
npm run prisma:generate    # Generate Prisma client
npm run prisma:push        # Push schema changes
npm run migrate           # Run migrations
```

This project is ready for deployment to DigitalOcean or any cloud provider with Node.js support and PostgreSQL database.
