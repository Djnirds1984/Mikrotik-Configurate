import { useState, useEffect } from 'react';
import { voucherService, routerService } from '../services/supabase';
import { PlusIcon, PrinterIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Vouchers({ tenant }) {
  const [vouchers, setVouchers] = useState([]);
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVouchers, setSelectedVouchers] = useState([]);

  useEffect(() => {
    if (tenant) {
      fetchData();
    }
  }, [tenant]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vouchersRes, routersRes] = await Promise.all([
        voucherService.getAllVouchers(tenant.id),
        routerService.getAllRouters(tenant.id)
      ]);
      
      if (!vouchersRes.error) setVouchers(vouchersRes.data);
      if (!routersRes.error) setRouters(routersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVouchers = async (count, routerId, profile) => {
    try {
      for (let i = 0; i < count; i++) {
        const username = `voucher_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const password = Math.random().toString(36).substr(2, 8);
        
        await voucherService.createVoucher({
          tenant_id: tenant.id,
          router_id: routerId,
          username,
          password,
          profile,
          status: 'active'
        });
      }
      fetchData();
    } catch (error) {
      console.error('Error generating vouchers:', error);
    }
  };

  const handlePrintVouchers = async () => {
    if (selectedVouchers.length === 0) return;
    
    try {
      const blob = await voucherService.generatePrintableVouchers(selectedVouchers);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vouchers.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error printing vouchers:', error);
    }
  };

  const handleDelete = async (voucherId) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      try {
        await voucherService.deleteVoucher(voucherId);
        fetchData();
      } catch (error) {
        console.error('Error deleting voucher:', error);
      }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voucher Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage hotspot vouchers
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrintVouchers}
            disabled={selectedVouchers.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <PrinterIcon className="-ml-1 mr-2 h-5 w-5" />
            Print Selected ({selectedVouchers.length})
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Generate Vouchers
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {vouchers.map((voucher) => (
            <li key={voucher.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedVouchers.includes(voucher.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVouchers([...selectedVouchers, voucher.id]);
                      } else {
                        setSelectedVouchers(selectedVouchers.filter(id => id !== voucher.id));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {voucher.username}
                      </h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        voucher.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {voucher.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>Password: {voucher.password}</p>
                      <p>Router: {voucher.routers?.name || 'Unknown'}</p>
                      <p>Profile: {voucher.profile}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(voucher.id)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </li>
          ))}
          {vouchers.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No vouchers created yet. Click "Generate Vouchers" to get started.
            </li>
          )}
        </ul>
      </div>

      {showModal && (
        <GenerateVoucherModal
          routers={routers}
          tenant={tenant}
          onClose={() => setShowModal(false)}
          onGenerate={handleGenerateVouchers}
          onSuccess={() => {
            setShowModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function GenerateVoucherModal({ routers, tenant, onClose, onGenerate, onSuccess }) {
  const [formData, setFormData] = useState({
    count: 5,
    router_id: '',
    profile: 'default'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onGenerate(formData.count, formData.router_id, formData.profile);
      onSuccess();
    } catch (error) {
      console.error('Error generating vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Generate Vouchers
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Vouchers</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={formData.count}
                onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Router</label>
              <select
                required
                value={formData.router_id}
                onChange={(e) => setFormData({...formData, router_id: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a router</option>
                {routers.map(router => (
                  <option key={router.id} value={router.id}>{router.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile</label>
              <input
                type="text"
                required
                value={formData.profile}
                onChange={(e) => setFormData({...formData, profile: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="default"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Vouchers'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}