# KNR Enterprises — Admin Dashboard Setup & Operations Guide

## Overview

The KNR Enterprises wholesale portal is equipped with an enterprise-grade Admin Dashboard built with React 19, TypeScript, Tailwind CSS v4, and Supabase. The dashboard allows administrators to independently manage the product catalog, categories, inventory, customer RFQ enquiries, website content, institutional services, testimonials, FAQs, and global site settings without touching code.

---

## 🏗️ Architecture & Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    KNR Public Website                       │
│  (Catalog, RFQ Cart, Proforma Invoice, Bilingual EN/TE)     │
└───────────────┬─────────────────────────────▲───────────────┘
                │                             │ Reads Active
                │ Submits RFQs                │ Data
                ▼                             │
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                        │
│  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │   PostgreSQL 15+      │  │      Supabase Auth         │  │
│  │   (12 Schema Tables)  │  │   (Email / Password JWT)   │  │
│  └───────────▲───────────┘  └─────────────▲──────────────┘  │
│              │                            │                 │
│              │ Row Level Security (RLS)   │ JWT Verified    │
│              │ via is_admin() function    │ Role: admin     │
└──────────────┼────────────────────────────┼─────────────────┘
               │                            │
┌──────────────┴────────────────────────────┴─────────────────┐
│              KNR Enterprises Admin Dashboard                │
│            Route: /admin  •  Login: /admin/login            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Dashboard Overview     7. Testimonials Management   │ │
│  │ 2. Product Management     8. FAQs Management           │ │
│  │ 3. Category Management    9. Institutional Services    │ │
│  │ 4. Inventory Tracking    10. Website Control Settings  │ │
│  │ 5. RFQ Enquiry Desk      11. Admin Profile & Diags     │ │
│  │ 6. Website Content CMS   12. Secure Logout             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Critical Security Protections
1. **Database Row Level Security (RLS):** All write operations (`INSERT`, `UPDATE`, `DELETE`) on all tables require an authenticated Supabase user whose ID exists in the `admin_profiles` table with `role = 'admin'` and `is_active = true`.
2. **Zero Role-Spoofing:** Client-side storage (`localStorage`) is never used to determine authorization. Every database transaction is authorized at the PostgreSQL engine level via the `is_admin()` Security Definer function.
3. **No Service-Role Key in Frontend:** The frontend bundle only contains the public Supabase Anon key (`VITE_SUPABASE_ANON_KEY`). Service-role keys are never included in the client bundle.
4. **Public Read Isolation:** Public unauthenticated visitors can only read active products (`is_active = true`), active categories, published testimonials, FAQs, services, and general settings. Draft or deactivated items are protected.
5. **No Public Registration:** Self-registration is strictly disabled. New administrators must be bootstrapped via the SQL setup script or created directly by existing administrators.

---

## 🚀 Supabase Setup Instructions

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **"New Project"**.
3. Choose your organization, name the project (e.g., `knr-enterprises-prod`), set a strong database password, and select the region closest to your users (e.g., `ap-south-1` Mumbai).
4. Wait for the project initialization to complete (~1-2 minutes).

---

### Step 2: Run Database Migrations
In the Supabase Project Dashboard, navigate to the **SQL Editor** (left sidebar):

1. **Create Tables & Security Policies:**
   - Open [supabase/migrations/20261119000000_knr_enterprises_schema.sql](file:///d:/KNR/supabase/migrations/20261119000000_knr_enterprises_schema.sql) in your editor.
   - Copy the entire SQL content.
   - Paste it into the Supabase SQL Editor and click **Run**.
   - *This creates all 12 tables, indexes, automatic `updated_at` triggers, RLS policies, and storage bucket configuration.*

2. **Seed Initial Production Data:**
   - Open [supabase/migrations/20261119000001_seed_initial_data.sql](file:///d:/KNR/supabase/migrations/20261119000001_seed_initial_data.sql) in your editor.
   - Copy the entire SQL content.
   - Paste it into the Supabase SQL Editor and click **Run**.
   - *This seeds all 6 catalog categories, 12 wholesale products (Bleaching Powder, Malathion, Fogging machines, SBM bins, LED streetlights, etc.), initial inventory logs, FAQs, services, testimonials, and default website configuration.*

---

### Step 3: Create Storage Buckets
The SQL migration attempts to create the buckets automatically. To verify or manually create them:
1. Navigate to **Storage** in the Supabase Dashboard.
2. Ensure two buckets exist:
   - `knr-products` (Public: **Yes**) — For product images and photo gallery.
   - `knr-media` (Public: **Yes**) — For category banners, logo, and general website assets.
3. If they are not visible:
   - Click **"New bucket"**.
   - Name: `knr-products`, toggle **Public bucket** to **ON**, and save.
   - Repeat for `knr-media`.

---

### Step 4: Bootstrap the Initial Administrator User
The primary administrator account is already provisioned in Supabase Auth:
- **Email:** `anishreddy057@gmail.com`
- **Password:** `@AnishReddy0990`
- **Status:** Email Confirmed (`true`)
- **User UID:** `6dc1bd4f-ca4d-4652-8884-6c6fbbb339d2`

This account is automatically promoted to `admin` role with full privileges when you execute [supabase/SETUP_DATABASE.sql](file:///d:/KNR/supabase/SETUP_DATABASE.sql) in the Supabase SQL Editor.

---

### Step 5: Configure Frontend Environment Variables
1. In your project root, create a file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Retrieve your project API credentials from Supabase:
   - Go to **Project Settings** > **API**.
   - Copy the **Project URL** (`https://<project-ref>.supabase.co`).
   - Copy the **anon public** API key.
3. Open `.env` and fill in the values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```
4. Restart your Vite development server:
   ```bash
   npm run dev
   ```

---

## 💻 Accessing the Admin Dashboard

- **Direct URL:** `http://localhost:3000/admin` (or `#admin`)
- **Login URL:** `http://localhost:3000/admin/login` (or `#admin/login`)
- **Public Portal Link:** A discrete **"Admin Portal"** link is placed in the public website header and footer.

### Local Development Mode
If `.env` is not yet configured, the dashboard automatically runs in a secure **Mock / Local Fallback Mode** populated with all 12 wholesale products and categories. This allows you to inspect the UI, test layouts, and review features locally without database credentials. A diagnostic pill in the admin header alerts you whether Supabase is live or in dev mode.

---

## 📋 Admin Features & Operational Capabilities

| Section | Capabilities |
| :--- | :--- |
| **1. Dashboard Overview** | Real-time KPI statistics (Total Products, Active Products, Out-of-Stock, Categories, Total RFQs, Pending Enquiries), monthly enquiry chart, low-stock warnings, recently submitted customer RFQs, and quick navigation actions. |
| **2. Product Management** | Data table with search, category filtering, stock & status filtering, sorting, and pagination. Full product CRUD with bilingual fields (English & Telugu), SKU, HSN codes, GST rates, MOQ rules, image uploader with Supabase Storage integration, gallery photos, dynamic specifications/features, bestseller/featured toggles, duplicate product, and safe deletion. |
| **3. Category Management** | Add/edit product categories with English and Telugu names, category image upload, sort order, and safe deletion checks (prevents deleting categories that still have assigned products). |
| **4. Inventory Tracking** | Real-time stock audit overview. Quick +/- delta adjustments with reason logging (Procurement, Gram Panchayat Dispatch, Correction), minimum stock threshold alerts, and persistent historical audit trail in `inventory_logs`. |
| **5. RFQ Enquiry Desk** | Request for Quotation management. View all incoming customer requests from the website and cart. Filter by status (`New`, `Contacted`, `Quotation Sent`, `Approved`, `Rejected`, `Completed`). View line items and customer Panchayats. One-click WhatsApp message generator, email dispatch, internal admin notes, and formatted browser printout. |
| **6. Website Content CMS** | Live control of Homepage Hero headline, sub-headline, banner image, trust statistics, and toggle visibility for homepage sections (Hero, Featured Products, Services, Stats, Why Choose Us, Testimonials, FAQ). Manage company history, mission, and vision in the About Us tab. |
| **7. Testimonials Management**| Manage customer feedback and Panchayat testimonials. Add/edit reviewer name, village/department designation, review text, star ratings (1-5), and activate/deactivate toggles. |
| **8. FAQs Management** | Add, edit, and reorder bilingual FAQs. Filter by category tags (Products, Ordering & Delivery, Billing & GST, Bulk Tenders). |
| **9. Institutional Services** | Manage depot services and logistics capabilities (Emergency Panchayat Dispatch, CIB-Certified Formulations, Bulk Tender Fulfillment). Add/edit SLAs, icons, and dynamic capability bullet points. |
| **10. Website Control Settings**| Configure depot phone numbers, WhatsApp hotline, official email, GSTIN (`36CUHPK5939D1ZG`), physical depot address, social links, announcement top-bar message, and emergency Maintenance Mode toggle. |
| **11. Admin Profile & Diags** | View active session details, verify admin permissions, execute one-click Supabase database and storage connection diagnostics, and update account password. |

---

## 🛡️ Production Deployment Checklist

1. [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in production environment settings (Vercel, Netlify, Cloudflare Pages, or host).
2. [ ] Confirm that `20261119000000_knr_enterprises_schema.sql` and `20261119000001_seed_initial_data.sql` ran cleanly in Supabase SQL Editor.
3. [ ] Confirm that `knr-products` and `knr-media` storage buckets are marked public.
4. [ ] Create production admin user in Supabase Auth and execute `create_admin_user.sql` to promote the user.
5. [ ] Execute `npm run build` to verify zero build errors.
6. [ ] Test `/admin/login` on production URL using the provisioned credentials.

