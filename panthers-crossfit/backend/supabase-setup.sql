-- Panthers CrossFit Club - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- 1. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'staff', 'member')) DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create members table
CREATE TABLE public.members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  membership_plan TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expiring_soon', 'expired', 'suspended')) DEFAULT 'active',
  qr_code TEXT UNIQUE NOT NULL,
  notes TEXT,
  gym_id UUID,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create checkins table
CREATE TABLE public.checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  member_name TEXT,
  check_in_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create payments table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create membership_plans table
CREATE TABLE public.membership_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  with_coach BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'crossfit',
  is_active BOOLEAN DEFAULT TRUE
);

-- 6. Create gyms table (for multi-gym support)
CREATE TABLE public.gyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default membership plans
INSERT INTO public.membership_plans (name, duration_days, price, with_coach, category) VALUES
  ('1 Month without Coach', 30, 130, false, 'crossfit'),
  ('1 Month with Coach', 30, 160, true, 'crossfit'),
  ('10 Days without Coach', 10, 50, false, 'crossfit'),
  ('10 Days with Coach', 10, 60, true, 'crossfit'),
  ('1 Session', 1, 15, false, 'crossfit'),
  ('3 Months without Coach', 90, 370, false, 'crossfit'),
  ('3 Months with Coach', 90, 460, true, 'crossfit'),
  ('6 Months without Coach', 180, 740, false, 'crossfit'),
  ('6 Months with Coach', 180, 920, true, 'crossfit'),
  ('Annual without Coach', 365, 1400, false, 'crossfit'),
  ('Annual with Coach', 365, 1760, true, 'crossfit'),
  ('Boxing 1 Month', 30, 90, false, 'boxing'),
  ('Boxing 3 Months', 90, 250, false, 'boxing'),
  ('Boxing 6 Months', 180, 500, false, 'boxing'),
  ('Zumba 1 Session', 1, 15, false, 'zumba'),
  ('Zumba 1 Month', 30, 100, false, 'zumba');

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for members
CREATE POLICY "Everyone can view members" ON public.members
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert members" ON public.members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update members" ON public.members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete members" ON public.members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for checkins
CREATE POLICY "Everyone can view checkins" ON public.checkins
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert checkins" ON public.checkins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for payments
CREATE POLICY "Everyone can view payments" ON public.payments
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for membership_plans
CREATE POLICY "Everyone can view plans" ON public.membership_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.membership_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create function to auto-update member status
CREATE OR REPLACE FUNCTION update_member_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.end_date <= CURRENT_DATE + 5 THEN
    NEW.status := 'expiring_soon';
  ELSE
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update member status
DROP TRIGGER IF EXISTS update_member_status_trigger ON public.members;
CREATE TRIGGER update_member_status_trigger
  BEFORE INSERT OR UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION update_member_status();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create index for faster queries
CREATE INDEX idx_members_member_id ON public.members(member_id);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_members_end_date ON public.members(end_date);
CREATE INDEX idx_checkins_member_id ON public.checkins(member_id);
CREATE INDEX idx_checkins_date ON public.checkins(check_in_date);
CREATE INDEX idx_payments_member_id ON public.payments(member_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);

