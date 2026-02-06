#!/bin/bash

# MikroTik Cloud Manager Database Setup Script
# This script helps you set up your Supabase database

echo "🚀 Setting up MikroTik Cloud Manager Database"
echo "=============================================="

echo "Please follow these steps:"
echo ""
echo "1. Go to your Supabase dashboard: https://mivtfrprigvznzdtjiqz.supabase.co"
echo "2. Navigate to SQL Editor"
echo "3. Run the following files in order:"
echo "   - supabase/schema.sql (creates tables and RLS policies)"
echo "   - supabase/superadmin-setup.sql (creates superadmin account)"
echo ""
echo "After running these scripts, your database will be ready!"
echo ""
echo "Then you can start the application with: npm run dev"