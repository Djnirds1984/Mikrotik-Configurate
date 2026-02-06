-- Script to create superadmin account
-- Run this in your Supabase SQL editor after creating the schema

-- First, create the auth user (this would typically be done via the signup process)
-- But for immediate setup, we'll create the user record directly

-- Insert the superadmin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aldrincabanez9@gmail.com',
  crypt('Akoangnagwagi84%', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"is_superadmin": true}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Akoangnagwagi84%', gen_salt('bf')),
  updated_at = NOW();

-- Create the corresponding user record
INSERT INTO public.users (
  id,
  email,
  role,
  is_superadmin,
  created_at,
  updated_at
) SELECT 
  id,
  email,
  'admin',
  true,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'aldrincabanez9@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  is_superadmin = true,
  role = 'admin',
  updated_at = NOW();

-- Create a default tenant for the superadmin
INSERT INTO public.tenants (
  id,
  name,
  admin_email,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'aldrincabanez9@gmail.com'),
  'Super Admin Organization',
  'aldrincabanez9@gmail.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update the user's tenant_id to point to their own tenant
UPDATE public.users 
SET tenant_id = (SELECT id FROM auth.users WHERE email = 'aldrincabanez9@gmail.com')
WHERE email = 'aldrincabanez9@gmail.com';