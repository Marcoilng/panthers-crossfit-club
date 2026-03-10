import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Replace with your actual Supabase credentials
// You can get these from your Supabase dashboard: https://app.supabase.com

// For development/demo purposes, using placeholder values
// In production, use environment variables or secure storage
const supabaseUrl = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // e.g., 'eyJhbGciOiJIUzI1NiIs...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for TypeScript
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'staff' | 'member';
  avatar_url: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  email: string;
  photo_url: string | null;
  membership_plan: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'suspended';
  qr_code: string;
  notes: string | null;
  gym_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  member_id: string;
  member_name: string;
  check_in_date: string;
  check_in_time: string;
  created_at: string;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  with_coach: boolean;
  category: string;
  is_active: boolean;
}

// Helper functions
export const generateMemberId = (): string => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PANTHERS${timestamp}${random}`;
};

export const generateRandomPassword = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getMemberStatus = (endDate: string): 'active' | 'expiring_soon' | 'expired' => {
  const daysRemaining = calculateDaysRemaining(endDate);
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 5) return 'expiring_soon';
  return 'active';
};

export const calculateEndDate = (startDate: string, durationDays: number): string => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + durationDays);
  return end.toISOString().split('T')[0];
};

