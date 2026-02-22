# Namecard Editor - Service Scenario Analysis & Improvement Report

**Date**: 2026-02-22
**Analysis Mode**: UltraThink (Sequential Thinking 8-step) + Security Expert Agent
**Scope**: Full service scenario analysis with security, UX, performance, architecture, and business feature assessment
**Overall Risk Level**: HIGH

---

## Executive Summary

Namecard Editor is a web-based business card design and hand-drawn illustration commissioning platform built with Next.js 16 + React 19 + Supabase. The analysis identified **15 security issues** (2 Critical, 4 High, 5 Medium, 4 Low), **6 UX improvements**, **5 performance optimizations**, **5 architecture improvements**, **4 business feature expansions**, and **3 infrastructure enhancements**.

### Security Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 5 |
| LOW | 4 |
| **Total** | **15** |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.1, React 19, TypeScript, Tailwind CSS 4, Zustand 5 |
| Backend | Next.js API Routes, Supabase (Auth/DB/Storage) |
| Deploy | Cloudflare Workers (opennextjs-cloudflare) |
| Libraries | react-colorful, html-to-image, uuid |

---

## Service Scenarios

### Scenario 1: User - Design & Submit Card

```
Landing Page (/)
  -> Sign Up / Login (Email + Google OAuth)
  -> Create Page (/create) - 5-Step Wizard
     Step 1: Display Name + Front Background Color
     Step 2: Profile Photo Upload (Drag & Drop)
     Step 3: Back Info (Full Name, Title, Hashtags, Social Links)
     Step 4: Front/Back Preview (Editable)
     Step 5: Final Confirmation + Memo -> Submit Request
  -> POST /api/requests -> Avatar Upload to Supabase Storage -> DB Record
  -> Success Screen (Request ID + Timestamp)
```

### Scenario 2: Admin - Review & Upload Illustration

```
Admin Login (ADMIN_EMAILS env var authorization)
  -> Admin Panel (/admin) - All Requests List
  -> Request Detail (/admin/[id])
     - Review user's card design
     - Upload hand-drawn illustration PNG
     - Status transition: submitted -> processing -> confirmed
  -> PATCH /api/requests/[id] -> Storage Upload + DB Status Update
```

### Scenario 3: User - Track Request

```
Dashboard (/dashboard)
  -> My Requests List (GET /api/requests/my)
  -> Request Detail (/dashboard/[id])
     - Original card design
     - Status badge (submitted/processing/confirmed)
     - Status change history
     - Completed illustration (when confirmed)
```

---

## 1. Security Issues (15 findings)

> Detailed security audit conducted by expert-security agent with code-level analysis.
> Overall Risk Level: **HIGH**

### Critical (2)

#### C-01. Supabase RLS Policies Effectively Disabled (OWASP A01, CWE-862)

- **File**: `supabase/migrations/001_create_schema.sql` (lines 29-33)
- **Issue**: RLS is enabled but policy `USING (true)` allows ALL operations for ANY role (including anon). Since `NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed to clients, attackers can directly query/modify ALL card_requests data.
- **Impact**: **Complete data exposure** - all user data accessible to anyone with anon key
- **Current Code** (Vulnerable):
  ```sql
  CREATE POLICY "Allow all for service role" ON card_requests FOR ALL USING (true);
  ```
- **Recommended Fix**:
  ```sql
  DROP POLICY "Allow all for service role" ON card_requests;
  CREATE POLICY "Service role only" ON card_requests
    FOR ALL USING (auth.role() = 'service_role');
  -- Same for card_request_status_history
  ```
- **Deadline**: Within 24 hours

#### C-02. Storage Bucket Upload Policies Unrestricted (OWASP A01, CWE-284)

- **File**: `supabase/migrations/002_create_storage.sql` (lines 6-12)
- **Issue**: INSERT/UPDATE policies only check `bucket_id`, not authentication. Anyone with public anon key can upload arbitrary files, overwrite existing files, or abuse storage.
- **Impact**: Unauthorized uploads, storage abuse, malicious content hosting, file overwrite
- **Recommended Fix**: Restrict all upload/update policies to `auth.role() = 'service_role'`
- **Deadline**: Within 24 hours

### High (4)

#### H-01. No API Rate Limiting (OWASP A04, CWE-770)

- **Files**: All API routes under `src/app/api/`
- **Issue**: Zero rate limiting. POST `/api/requests` with 10MB payloads can exhaust resources rapidly.
- **Fix**: Cloudflare Rate Limiting or `@upstash/ratelimit` middleware
- **Deadline**: Within 1 week

#### H-02. No Server-Side Image Content Validation (OWASP A04, CWE-434)

- **Files**: `src/app/api/requests/route.ts` (28-37), `src/lib/storage.ts` (234-260)
- **Issue**: API accepts base64 data, validates only size, stores as `image/png` regardless of actual content. Attackers can upload malicious HTML/SVG/executables.
- **Fix**: Validate magic bytes (PNG: `89 50 4E 47`, JPEG: `FF D8 FF`, WebP: `52 49 46 46...57 45 42 50`)
- **Deadline**: Within 1 week

#### H-03. Weak Password Policy (OWASP A07, CWE-521)

- **File**: `src/app/signup/page.tsx` (lines 36, 184, 209)
- **Issue**: Minimum 6 characters vs NIST recommendation of 12+
- **Fix**: Increase to 8+ (ideally 12+), update Supabase Dashboard setting
- **Deadline**: Within 1 week

#### H-04. Open Redirect Vulnerability (OWASP A01, CWE-601)

- **Files**: `src/app/callback/route.ts` (13, 41), `src/app/login/page.tsx` (29, 39, 57)
- **Issue**: `next` parameter used without validation. `next=//evil.com` can redirect to `evil.com`.
- **Fix**: `const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';`
- **Deadline**: Within 48 hours

### Medium (5)

#### M-01. Missing Security Headers (OWASP A05, CWE-693)

- No CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy configured
- **Fix**: Add headers in `next.config.ts` `headers()` function

#### M-02. No Server-Side Input Length Validation (OWASP A03, CWE-20)

- POST `/api/requests` only checks `displayName` required. No length validation on other fields.
- **Fix**: Adopt Zod schema validation for all API inputs

#### M-03. Route Parameter UUID Not Validated (OWASP A03, CWE-20)

- `[id]` parameter not validated as UUID before database query
- **Fix**: UUID regex validation before query

#### M-04. No CSRF Protection (OWASP A01, CWE-352)

- No CSRF tokens on POST/PATCH endpoints. SameSite=Lax provides partial protection only.
- **Fix**: Origin/Referer header validation in middleware

#### M-05. Email Used as User Identifier (OWASP A04, CWE-706)

- `created_by` stores email instead of immutable `user.id` UUID
- Email changes orphan requests; email reuse could grant unauthorized access
- **Fix**: Migrate to `user.id` (UUID) for `created_by`

### Low (4)

- **L-01**: Public Storage buckets (images accessible if URL is known)
- **L-02**: No security event logging (OWASP A09, CWE-778)
- **L-03**: Client-side `getSession()` in AuthProvider (server correctly uses `getUser()`)
- **L-04**: `user.email!` non-null assertion in `src/app/api/requests/[id]/route.ts:25` - social login may lack email

### Positive Security Findings

Correctly implemented:
- Server-side auth with `requireAuth()`/`requireAdmin()` on all API routes
- `getUser()` for token revalidation in middleware and API routes
- Ownership verification on request detail endpoint
- Valid status transition enforcement
- React auto-escaping (no `dangerouslySetInnerHTML`)
- 10MB image size limit, generic error messages
- Dual admin verification (middleware + API route)

---

## 2. UX / User Journey Improvements

### 2.1 Status Change Notification System [High]

- **Current**: Users must manually check dashboard for status updates
- **Improvement**: Email notifications on status change (submitted -> processing -> confirmed)
- **Tech**: Supabase Edge Functions + Resend/SendGrid email service
- **User Impact**: Significantly better user experience, reduced anxiety about request status

### 2.2 Request Edit/Cancel [High]

- **Current**: Once submitted, no modification or cancellation possible
- **Improvement**: Allow editing/canceling while status is "submitted" (before admin picks it up)
- **Tech**: New PATCH endpoint for user edits, DELETE or cancel action for submitted requests
- **User Impact**: Reduces friction, prevents unnecessary admin work on unwanted requests

### 2.3 Extended Status Workflow [High]

- **Current**: Only 3 states: submitted -> processing -> confirmed
- **Improvement**: Add `revision_requested` (admin asks for changes), `rejected`, `delivered` (physical card shipped)
- **Tech**: Update VALID_TRANSITIONS, add UI for revision feedback
- **User Impact**: Better communication between user and admin, clearer progress tracking

### 2.4 Draft Auto-Save to Cloud [Medium]

- **Current**: Data only in localStorage (Zustand). Browser data clearance = work lost
- **Improvement**: Auto-save drafts to Supabase for authenticated users with "unsaved changes" indicator
- **Tech**: Debounced save to new `card_drafts` table
- **User Impact**: No more lost work, cross-device access

### 2.5 User-Admin Communication [Medium]

- **Current**: No messaging between user and admin about requests
- **Improvement**: Comment/message thread per request
- **Tech**: New `request_comments` table, real-time subscription
- **User Impact**: Better collaboration, fewer revision cycles

### 2.6 Portfolio Gallery [Low]

- **Current**: No samples of completed work on landing page
- **Improvement**: Gallery of completed (anonymized/approved) illustrations
- **Tech**: Public gallery page with opt-in from users
- **User Impact**: Builds trust, inspires new users

---

## 3. Performance Optimizations

### 3.1 Base64 -> Direct Upload [High]

- **Current**: Avatar images sent as base64 in JSON body (33% size overhead, memory pressure)
- **Improvement**: Direct-to-storage upload with Supabase presigned URLs
- **Tech**: Client generates presigned URL, uploads directly to Storage, sends only URL reference
- **Impact**: 33% reduction in upload payload, faster uploads, lower server memory

### 3.2 Image Optimization Pipeline [High]

- **Current**: Images stored as-is without compression or format conversion
- **Improvement**: Server-side resize + WebP conversion using `sharp`
- **Tech**: Process on upload: resize to max dimensions, convert to WebP, generate thumbnails
- **Impact**: 60-80% reduction in storage and bandwidth

### 3.3 Admin List Pagination [Medium]

- **Current**: GET /api/requests returns ALL records without pagination
- **Improvement**: Cursor-based pagination with status/date filters
- **Tech**: Add `cursor` and `limit` query params, filtered queries
- **Impact**: Consistent response times regardless of data growth

### 3.4 Korean Font Loading Optimization [Medium]

- **Current**: Full Korean fonts loaded from CDN without optimization
- **Improvement**: Font preloading + `font-display: swap` + subset fonts
- **Tech**: Next.js font optimization with `next/font/google` or self-hosted subsets
- **Impact**: Faster initial page load, no FOUT/FOIT

### 3.5 CDN Caching Strategy [Low]

- **Current**: Storage URLs accessed directly from Supabase without caching headers
- **Improvement**: Leverage Cloudflare CDN with proper cache headers for static assets
- **Tech**: Cache-Control headers on Supabase Storage responses, Cloudflare page rules
- **Impact**: Faster image loading for repeated views

---

## 4. Architecture / Code Quality

### 4.1 Zod Schema Validation [High]

- **Current**: Manual validation in API routes, inconsistent, missing edge cases
- **Improvement**: Zod schemas for all request/response types with runtime validation
- **Tech**: Define schemas in `src/lib/schemas.ts`, apply in all API routes
- **Impact**: Consistent validation, auto-generated TypeScript types, better error messages

### 4.2 Next.js Middleware Auth Integration [Medium]

- **Current**: Each API route manually calls `requireAuth()`/`requireAdmin()`
- **Improvement**: Route-level auth protection in Next.js middleware
- **Tech**: Extend existing middleware to handle API route authorization
- **Impact**: Centralized auth logic, reduced boilerplate, harder to forget auth checks

### 4.3 Database-Based RBAC [Medium]

- **Current**: Admin role determined by ADMIN_EMAILS environment variable
- **Improvement**: Database-level role management with `user_roles` table
- **Tech**: New `user_roles` table, role-based access in middleware and API routes
- **Impact**: Scalable role management, audit trail, no env var dependency

### 4.4 Error Boundary Components [Medium]

- **Current**: No React Error Boundaries in component tree
- **Improvement**: ErrorBoundary at layout level with fallback UI
- **Tech**: React ErrorBoundary component wrapping main layout
- **Impact**: Graceful error handling, better user experience during failures

### 4.5 Error Monitoring (Sentry) [Low]

- **Current**: No error tracking or structured logging
- **Improvement**: Sentry integration for error tracking + structured logging
- **Tech**: @sentry/nextjs SDK, custom error handler
- **Impact**: Proactive issue detection, faster debugging

---

## 5. Business Feature Expansion

### 5.1 Card Sharing & QR Code [Medium]

- **Improvement**: Shareable card page with QR code generation
- **Tech**: Public card page at `/card/[id]`, QR code with `qrcode.react`
- **Business Value**: Viral sharing, increased exposure

### 5.2 Admin Queue Management [Medium]

- **Improvement**: Priority system, admin assignment, estimated delivery time
- **Tech**: Priority field, assigned_to column, estimated_at timestamp
- **Business Value**: Better admin workflow, predictable delivery

### 5.3 Analytics Dashboard [Low]

- **Improvement**: Basic analytics (requests/day, avg turnaround time, conversion rate)
- **Tech**: Aggregation queries, simple chart component
- **Business Value**: Data-driven decisions, performance tracking

### 5.4 Card Version History [Low]

- **Improvement**: Design change history for multiple submissions
- **Tech**: `card_versions` table with snapshot data
- **Business Value**: Design evolution tracking, easy rollback

---

## 6. Infrastructure & Operations

### 6.1 Database Backup Strategy [Medium]

- **Current**: No automated backup strategy
- **Improvement**: Supabase PITR (Point-in-Time Recovery) for paid plans
- **Impact**: Data safety, disaster recovery capability

### 6.2 Security Event Logging [Medium]

- **Current**: No security event logging
- **Improvement**: Log failed login attempts, admin actions, authorization failures
- **Tech**: `security_events` table or external logging service
- **Impact**: Security auditing, incident detection

### 6.3 Uptime Monitoring [Low]

- **Current**: No uptime or health monitoring
- **Improvement**: Cloudflare Health Check or external monitoring service
- **Impact**: Proactive downtime detection, SLA tracking

---

## Priority Roadmap

### Phase 1: Security Hardening (Urgent - 1-2 weeks)

- [ ] Fix RLS policies (Critical)
- [ ] Fix Storage bucket policies (Critical)
- [ ] Add API rate limiting (High)
- [ ] Server-side image validation (High)
- [ ] Strengthen password policy (High)
- [ ] Add security headers (Medium)
- [ ] Fix callbackUrl open redirect (Medium)

### Phase 2: Core UX Improvements (Short-term - 2-4 weeks)

- [ ] Base64 -> Direct Upload conversion
- [ ] Email notification system
- [ ] Request edit/cancel functionality
- [ ] Extended status workflow
- [ ] Zod schema validation
- [ ] Error Boundary components

### Phase 3: Architecture Strengthening (Mid-term - 1-2 months)

- [ ] Database-based RBAC system
- [ ] Image optimization pipeline (sharp)
- [ ] Admin list pagination + filters
- [ ] Sentry error monitoring
- [ ] Middleware auth integration
- [ ] Korean font optimization

### Phase 4: Feature Expansion (Long-term - 2-3 months)

- [ ] Card sharing + QR code
- [ ] User-admin messaging
- [ ] Admin analytics dashboard
- [ ] Portfolio gallery
- [ ] Draft auto-save to cloud
- [ ] Card version history

---

## Database Schema (Current)

```
card_requests
├── id (UUID, PK)
├── card_front (JSONB: {displayName, backgroundColor})
├── card_back (JSONB: {fullName, title, hashtags[], socialLinks[], backgroundColor})
├── original_avatar_url (TEXT)
├── illustration_url (TEXT, nullable)
├── status (TEXT: submitted|processing|confirmed)
├── submitted_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
├── note (TEXT, nullable)
└── created_by (TEXT, user email)

card_request_status_history
├── id (BIGSERIAL, PK)
├── request_id (UUID, FK -> card_requests.id)
├── status (TEXT)
└── created_at (TIMESTAMPTZ)

Storage Buckets (Public)
├── avatars/{request_id}/avatar.png
└── illustrations/{request_id}/illustration.png
```

## API Endpoints (Current)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /api/auth/me | - | Current user + admin status |
| GET | /callback | - | OAuth2 callback handler |
| POST | /api/requests | User | Create new request |
| GET | /api/requests | Admin | List all requests |
| GET | /api/requests/my | User | User's own requests |
| GET | /api/requests/[id] | User | Request details (with ownership check) |
| PATCH | /api/requests/[id] | Admin | Update status + upload illustration |

---

*Report generated by MoAI UltraThink Analysis + Security Expert Agent*
*Analysis dimensions: 6 (Security, UX, Performance, Architecture, Business, Infrastructure)*
*Sequential Thinking steps: 8 + Security Agent deep scan (43 tool uses)*
*Security issues: 15 total (2 Critical, 4 High, 5 Medium, 4 Low)*
*Improvement recommendations: 23 total across UX, Performance, Architecture, Business, Infrastructure*
