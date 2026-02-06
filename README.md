# MikroTik Cloud Manager

A cloud-based management platform for MikroTik routers with multi-tenant support, centralized voucher management, and automatic configuration fetching.

## Features

- **Multi-Tenant Architecture**: Isolated environments for different organizations
- **Router Management**: Centralized management of multiple MikroTik routers
- **Voucher System**: Create and manage hotspot vouchers across all routers
- **Configuration Sync**: Automatic fetching of router configurations
- **Real-time Monitoring**: Status monitoring and alerts
- **Bulk Operations**: Perform actions across multiple routers simultaneously

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Deployment**: Cloudflare Pages + Workers

## Prerequisites

1. Node.js 18+
2. Supabase account
3. Cloudflare account
4. MikroTik routers with API enabled

## Setup Instructions

### 1. Supabase Setup

1. Your Supabase project is already configured at: https://mivtfrprigvznzdtjiqz.supabase.co
2. Run the schema from `supabase/schema.sql` in your Supabase SQL editor
3. Run the superadmin setup script from `supabase/superadmin-setup.sql` to create the admin account
4. Your credentials are already configured in the project

### 2. Superadmin Account

The superadmin account has been pre-configured with:
- **Email**: aldrincabanez9@gmail.com
- **Password**: Akoangnagwagi84%

This account has special privileges:
- Access to all tenants
- Ability to create/delete tenants
- System-wide administrative access
- Special "Super Admin" badge in the UI

### 2. Frontend Setup

```bash
cd client
npm install
```

Create `.env.local` file in the client directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Backend Setup

```bash
cd worker
npm install
```

Update `wrangler.toml` with your Supabase credentials:
```toml
[vars]
SUPABASE_URL = "your_supabase_url"
SUPABASE_SERVICE_KEY = "your_supabase_service_key"
```

### 4. Development

Run both frontend and backend in development mode:
```bash
# From root directory
npm run dev
```

Or run separately:
```bash
# Frontend
cd client && npm run dev

# Backend (in another terminal)
cd worker && npm run dev
```

### 5. Deployment

#### Frontend (Cloudflare Pages)
1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build directory: `client/dist`
4. Add environment variables in Cloudflare Pages dashboard

#### Backend (Cloudflare Workers)
```bash
cd worker
npm run deploy
```

## Usage

1. **Sign Up/Login**: Create an account or log in
2. **Add Routers**: Configure your MikroTik routers in the Routers section
3. **Test Connections**: Verify router connectivity
4. **Generate Vouchers**: Create hotspot vouchers for your customers
5. **Monitor**: View router status and voucher usage

## MikroTik Configuration

Enable API on your MikroTik routers:
1. Go to IP > Services
2. Enable api service (port 8728 by default)
3. Set up proper firewall rules to allow API access

## Security

- All data is isolated by tenant using Row Level Security
- Router credentials are encrypted at rest
- API communications use HTTPS
- Regular security audits recommended

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues section.