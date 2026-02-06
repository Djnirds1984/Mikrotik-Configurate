import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mivtfrprigvznzdtjiqz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdnRmcnByaWd2em56ZHRqaXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTQ2MTcsImV4cCI6MjA4NTg5MDYxN30.jnzjHqcg5hS_Vzlntgpu3BWZJXULbZaz1CmgbFwTphI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // Route handling
    if (url.pathname.startsWith('/api/routers')) {
      return handleRouterApi(request, env, ctx);
    } else if (url.pathname.startsWith('/api/vouchers')) {
      return handleVoucherApi(request, env, ctx);
    } else if (url.pathname.startsWith('/api/mikrotik')) {
      return handleMikrotikApi(request, env, ctx);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleRouterApi(request, env, ctx) {
  const url = new URL(request.url);
  const routerId = url.pathname.split('/')[3];
  
  switch (request.method) {
    case 'GET':
      if (routerId && url.pathname.endsWith('/test')) {
        return testRouterConnection(routerId);
      } else if (routerId && url.pathname.endsWith('/config')) {
        return fetchRouterConfig(routerId);
      }
      break;
    case 'POST':
      if (url.pathname.endsWith('/bulk')) {
        return bulkRouterOperation(request);
      }
      break;
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleVoucherApi(request, env, ctx) {
  const url = new URL(request.url);
  
  switch (request.method) {
    case 'POST':
      if (url.pathname.endsWith('/print')) {
        return generateVoucherPDF(request);
      }
      break;
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleMikrotikApi(request, env, ctx) {
  const url = new URL(request.url);
  
  switch (request.method) {
    case 'POST':
      if (url.pathname.endsWith('/sync')) {
        return syncAllRouters();
      }
      break;
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function testRouterConnection(routerId) {
  try {
    // Get router details from Supabase
    const { data: router, error } = await supabase
      .from('routers')
      .select('*')
      .eq('id', routerId)
      .single();

    if (error) {
      return new Response(JSON.stringify({ success: false, error: 'Router not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Test MikroTik API connection
    const testResult = await mikrotikApiCall(router, '/rest/system/resource');
    
    if (testResult.success) {
      // Update router status
      await supabase
        .from('routers')
        .update({ status: 'online', last_seen: new Date().toISOString() })
        .eq('id', routerId);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Connection successful',
        data: testResult.data
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      // Update router status
      await supabase
        .from('routers')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('id', routerId);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: testResult.error 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function fetchRouterConfig(routerId) {
  try {
    const { data: router, error } = await supabase
      .from('routers')
      .select('*')
      .eq('id', routerId)
      .single();

    if (error) {
      return new Response(JSON.stringify({ success: false, error: 'Router not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch various configurations
    const configPromises = [
      mikrotikApiCall(router, '/rest/interface'),
      mikrotikApiCall(router, '/rest/ip/address'),
      mikrotikApiCall(router, '/rest/ip/firewall/filter'),
      mikrotikApiCall(router, '/rest/ip/hotspot/user/profile'),
      mikrotikApiCall(router, '/rest/system/resource')
    ];

    const results = await Promise.all(configPromises);
    
    const config = {
      interfaces: results[0].data || [],
      ipAddresses: results[1].data || [],
      firewallRules: results[2].data || [],
      hotspotProfiles: results[3].data || [],
      systemInfo: results[4].data || {}
    };

    // Store configuration in database
    await supabase
      .from('router_configs')
      .insert({
        router_id: routerId,
        config_data: config,
        fetched_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      config 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function bulkRouterOperation(request) {
  try {
    const { action, router_ids } = await request.json();
    
    const results = [];
    
    for (const routerId of router_ids) {
      let result;
      switch (action) {
        case 'sync':
          result = await fetchRouterConfig(routerId);
          break;
        case 'test':
          result = await testRouterConnection(routerId);
          break;
        default:
          result = { success: false, error: 'Unknown action' };
      }
      results.push({ router_id: routerId, result });
    }
    
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function generateVoucherPDF(request) {
  try {
    const { voucher_ids } = await request.json();
    
    // Fetch voucher details
    const { data: vouchers, error } = await supabase
      .from('vouchers')
      .select('*, routers(name)')
      .in('id', voucher_ids);

    if (error) {
      throw new Error(error.message);
    }

    // Generate PDF content (simplified version)
    const pdfContent = generateVoucherHTML(vouchers);
    
    return new Response(pdfContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="vouchers.html"',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

function generateVoucherHTML(vouchers) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .voucher { 
          border: 1px solid #ccc; 
          padding: 10px; 
          margin: 10px; 
          width: 200px; 
          display: inline-block;
          text-align: center;
        }
        .username { font-weight: bold; font-size: 14px; }
        .password { font-size: 12px; color: #666; }
        .router { font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      ${vouchers.map(voucher => `
        <div class="voucher">
          <div class="username">${voucher.username}</div>
          <div class="password">Password: ${voucher.password}</div>
          <div class="router">${voucher.routers?.name || 'Unknown Router'}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

async function syncAllRouters() {
  try {
    // Get all routers
    const { data: routers, error } = await supabase
      .from('routers')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    const results = [];
    for (const router of routers) {
      try {
        const configResult = await fetchRouterConfig(router.id);
        results.push({ router_id: router.id, success: true });
      } catch (error) {
        results.push({ router_id: router.id, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

// MikroTik API helper function
async function mikrotikApiCall(router, endpoint) {
  try {
    const auth = btoa(`${router.username}:${router.password}`);
    const response = await fetch(`http://${router.ip_address}:${router.api_port}${endpoint}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}