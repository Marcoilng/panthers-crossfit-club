# Panthers CrossFit Club - Mobile Application Development Plan

## Phase 1: Project Setup & Configuration
- [ ] Initialize Expo project with TypeScript
- [ ] Install dependencies: NativeWind, React Navigation, Supabase, QR Code libraries
- [ ] Configure NativeWind (Tailwind CSS for React Native)
- [ ] Set up project folder structure (src/screens, src/components, src/navigation, src/lib/supabase, src/hooks)

## Phase 2: Supabase Configuration & Database
- [ ] Create supabase.ts configuration file
- [ ] Design database schema (members, checkins, payments, profiles, membership_plans)
- [ ] Set up Row Level Security (RLS) policies

## Phase 3: Authentication System
- [ ] Create Login screen with role-based authentication
- [ ] Implement Supabase Auth integration
- [ ] Create Auth context/hook for state management
- [ ] Handle session persistence

## Phase 4: Navigation Structure
- [ ] Set up React Navigation (Stack & Tabs)
- [ ] Create AuthStack (Login, Register)
- [ ] Create AdminStack (Dashboard, Members, Scanner, etc.)
- [ ] Create MemberStack (Profile, QR Code, etc.)
- [ ] Create StaffStack

## Phase 5: Admin Features
- [ ] Admin Dashboard with statistics
- [ ] Member creation form with auto-generated ID and QR Code
- [ ] Member management (edit, delete, suspend)
- [ ] QR Code Scanner for access control
- [ ] Payment management
- [ ] Revenue statistics and charts
- [ ] Staff management
- [ ] Membership plans management
- [ ] Export features (CSV, PDF)

## Phase 6: Member Features
- [ ] Profile display with personal QR Code
- [ ] Membership status and countdown timer
- [ ] Membership history
- [ ] Request renewal functionality

## Phase 7: Staff Features
- [ ] QR Code Scanner
- [ ] Today's check-ins view
- [ ] Basic member lookup

## Phase 8: UI/UX & Theming
- [ ] Apply "Fitness Pro" theme (Black, Green #2ecc71, White)
- [ ] Implement Dark Mode by default
- [ ] Add Light Mode support
- [ ] Create reusable components

## Phase 9: Internationalization (i18n)
- [ ] Set up i18n structure for English and French
- [ ] Create translation files
- [ ] Language switcher in settings

## Phase 10: Additional Features
- [ ] Gym Information page
- - Automatic membership expiration reminders
- - Push notifications setup

## Database Schema

### Table: profiles
- id (uuid, FK to auth.users)
- email (text)
- full_name (text)
- phone (text)
- role (enum: admin, staff, member)
- avatar_url (text)
- created_at (timestamp)

### Table: members
- id (uuid, PK)
- member_id (text, unique - e.g., PANTHERS1025)
- full_name (text)
- phone (text)
- email (text)
- photo_url (text)
- membership_plan (text)
- start_date (date)
- end_date (date)
- status (enum: active, expiring_soon, expired, suspended)
- qr_code (text)
- notes (text)
- gym_id (uuid, FK)
- created_at (timestamp)
- updated_at (timestamp)

### Table: checkins
- id (uuid, PK)
- member_id (uuid, FK)
- member_name (text)
- check_in_date (date)
- check_in_time (time)
- created_at (timestamp)

### Table: payments
- id (uuid, PK)
- member_id (uuid, FK)
- amount (decimal)
- payment_date (date)
- payment_method (text)
- notes (text)
- created_at (timestamp)

### Table: membership_plans
- id (uuid, PK)
- name (text)
- duration_days (integer)
- price (decimal)
- with_coach (boolean)
- category (text)
- is_active (boolean)

## Membership Pricing
- 1 month without coach: $130
- 1 month with coach: $160
- 10 days without coach: $50
- 10 days with coach: $60
- 1 session: $15
- 3 months without coach: $370
- 3 months with coach: $460
- 6 months without coach: $740
- 6 months with coach: $920
- Annual without coach: $1400
- Annual with coach: $1760
- Boxing 1 month: $90
- Boxing 3 months: $250
- Boxing 6 months: $500
- Boxing 1 session: $10
- Zumba/Aerobic 1 session: $15
- Zumba/Aerobic 1 month: $100

