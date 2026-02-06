import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const authService = {
  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signUp: async (email, password, tenantData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          tenant_name: tenantData.name,
          tenant_admin: true
        }
      }
    });
    
    if (!error && data.user) {
      // Create tenant record
      await supabase.from('tenants').insert({
        id: data.user.id,
        name: tenantData.name,
        admin_email: email
      });
      
      // Create user record
      await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        tenant_id: data.user.id,
        role: 'admin'
      });
    }
    
    return { data, error };
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  }
};

export const routerService = {
  getAllRouters: async (tenantId) => {
    return await supabase
      .from('routers')
      .select('*')
      .eq('tenant_id', tenantId);
  },
  
  addRouter: async (routerData) => {
    return await supabase
      .from('routers')
      .insert([routerData]);
  },
  
  updateRouter: async (id, routerData) => {
    return await supabase
      .from('routers')
      .update(routerData)
      .eq('id', id);
  },
  
  deleteRouter: async (id) => {
    return await supabase
      .from('routers')
      .delete()
      .eq('id', id);
  },
  
  testConnection: async (routerId) => {
    // This will call the Cloudflare Worker endpoint
    const response = await fetch(`/api/routers/${routerId}/test`);
    return await response.json();
  },
  
  fetchConfiguration: async (routerId) => {
    const response = await fetch(`/api/routers/${routerId}/config`);
    return await response.json();
  }
};

export const voucherService = {
  getAllVouchers: async (tenantId) => {
    return await supabase
      .from('vouchers')
      .select('*, routers(name)')
      .eq('tenant_id', tenantId);
  },
  
  createVoucher: async (voucherData) => {
    return await supabase
      .from('vouchers')
      .insert([voucherData]);
  },
  
  updateVoucher: async (id, voucherData) => {
    return await supabase
      .from('vouchers')
      .update(voucherData)
      .eq('id', id);
  },
  
  deleteVoucher: async (id) => {
    return await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);
  },
  
  generatePrintableVouchers: async (voucherIds) => {
    const response = await fetch('/api/vouchers/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucher_ids: voucherIds })
    });
    return await response.blob();
  }
};

export const tenantService = {
  getAllTenants: async () => {
    return await supabase
      .from('tenants')
      .select('*');
  },
  
  createTenant: async (tenantData) => {
    return await supabase
      .from('tenants')
      .insert([tenantData]);
  },
  
  updateTenant: async (id, tenantData) => {
    return await supabase
      .from('tenants')
      .update(tenantData)
      .eq('id', id);
  },
  
  deleteTenant: async (id) => {
    return await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
  }
};