import { useState, useEffect } from 'react';
import { routerService, voucherService } from '../services/supabase';
import { 
  ServerIcon, 
  TicketIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

export default function Dashboard({ tenant }) {
  const [routers, setRouters] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState({
    totalRouters: 0,
    onlineRouters: 0,
    totalVouchers: 0,
    activeVouchers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) {
      fetchData();
    }
  }, [tenant]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routersRes, vouchersRes] = await Promise.all([
        routerService.getAllRouters(tenant.id),
        voucherService.getAllVouchers(tenant.id)
      ]);

      if (!routersRes.error) {
        setRouters(routersRes.data);
        const onlineCount = routersRes.data.filter(r => r.status === 'online').length;
        setStats(prev => ({
          ...prev,
          totalRouters: routersRes.data.length,
          onlineRouters: onlineCount
        }));
      }

      if (!vouchersRes.error) {
        setVouchers(vouchersRes.data);
        const activeCount = vouchersRes.data.filter(v => v.status === 'active').length;
        setStats(prev => ({
          ...prev,
          totalVouchers: vouchersRes.data.length,
          activeVouchers: activeCount
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your MikroTik management dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <ServerIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Routers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalRouters}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Online Routers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.onlineRouters}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Vouchers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalVouchers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Vouchers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.activeVouchers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Routers */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Routers</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {routers.slice(0, 5).map((router) => (
                <li key={router.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {router.status === 'online' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{router.name}</p>
                        <p className="text-sm text-gray-500">{router.ip_address}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{router.status}</div>
                  </div>
                </li>
              ))}
              {routers.length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No routers configured yet
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Recent Vouchers */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Vouchers</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {vouchers.slice(0, 5).map((voucher) => (
                <li key={voucher.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {voucher.username} - {voucher.profile}
                      </p>
                      <p className="text-sm text-gray-500">
                        Router: {voucher.routers?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{voucher.status}</div>
                  </div>
                </li>
              ))}
              {vouchers.length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No vouchers created yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}