# Panthers CrossFit Club - Mobile Application

A complete, scalable, and secure gym management mobile application built with React Native (Expo), TypeScript, and Supabase.

## Features

### Admin Features
- **Dashboard** - Statistics overview (total members, active members, expired, expiring soon, today's check-ins, revenue)
- **Member Management** - Create, view, edit, suspend members
- **QR Code Scanner** - Real-time member check-in with status verification (Active/Orange/Red)
- **Payment Management** - Record and track payments
- **Revenue Tracking** - Monthly and annual revenue statistics

### Member Features
- **Profile** - Personal information display
- **QR Code Access** - Personal QR code for gym entry
- **Membership Status** - Days remaining countdown
- **Gym Information** - Opening hours, contact details

### Technical Features
- **Authentication** - Role-based login (Admin, Staff, Member)
- **Multi-language** - English and French support
- **Dark Mode** - Professional fitness theme (Black, Green #2ecc71, White)
- **QR Code System** - Unique member IDs with QR generation

## Tech Stack

- **Frontend**: React Native (Expo SDK), TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Navigation**: React Navigation (Stack & Tabs)
- **Scanner**: expo-camera for QR scanning
- **QR Generation**: react-native-qrcode-svg

## Project Structure

```
panthers-crossfit/
├── backend/
│   └── supabase-setup.sql    # Database schema and setup
├── mobile/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── i18n/             # Internationalization (en, fr)
│   │   ├── lib/              # Supabase configuration
│   │   ├── navigation/        # App navigation
│   │   ├── screens/           # App screens
│   │   │   ├── admin/        # Admin screens
│   │   │   ├── auth/         # Authentication screens
│   │   │   └── member/       # Member screens
│   │   └── theme/            # Theme colors and styles
│   ├── App.tsx               # Main app entry
│   └── package.json           # Dependencies
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository
2. Navigate to mobile folder: `cd panthers-crossfit/mobile`
3. Install dependencies: `npm install`
4. Configure Supabase:
   - Create a new Supabase project
   - Run the SQL from `backend/supabase-setup.sql` in the Supabase SQL Editor
   - Update `src/lib/supabase.ts` with your Supabase URL and anon key

### Running the App

```bash
# Start Expo
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Demo Credentials

- **Admin Email**: admin@pantherscrossfitclub.com
- **Admin Password**: P@nTh3r$Cr0ssF!t#2026@UltraSecure

## Membership Plans

### CrossFit
| Plan | Duration | Price |
|------|----------|-------|
| Without Coach | 1 month | $130 |
| With Coach | 1 month | $160 |
| Without Coach | 10 days | $50 |
| With Coach | 10 days | $60 |
| Single Session | 1 day | $15 |
| Without Coach | 3 months | $370 |
| With Coach | 3 months | $460 |
| Without Coach | 6 months | $740 |
| With Coach | 6 months | $920 |
| Annual without Coach | 1 year | $1,400 |
| Annual with Coach | 1 year | $1,760 |

### Boxing
| Plan | Duration | Price |
|------|----------|-------|
| 1 Month | 30 days | $90 |
| 3 Months | 90 days | $250 |
| 6 Months | 180 days | $500 |
| Single Session | 1 day | $10 |

### Zumba & Aerobic
| Plan | Duration | Price |
|------|----------|-------|
| Single Session | 1 day | $15 |
| 1 Month | 30 days | $100 |

## Database Schema

### Tables
- **profiles** - User accounts (extends auth.users)
- **members** - Member information with QR codes
- **checkins** - Entry history logging
- **payments** - Payment records
- **membership_plans** - Available membership plans
- **gyms** - Multi-gym support

## Gym Information

**Panthers CrossFit Club**

Opening Hours:
- Monday – Friday: 06:00 – 22:00
- Saturday: 07:00 – 21:30
- Sunday: 07:00 – 12:00
- Public Holidays: 07:00 – 12:00

Contact:
- +243 962 909 624
- +243 859 439 292

## Security

- Passwords are never stored in plain text (handled by Supabase Auth)
- Row Level Security (RLS) policies protect data
- QR codes contain only member ID for security
- Role-based access control

## License

Copyright © 2026 Panthers CrossFit Club. All rights reserved.

