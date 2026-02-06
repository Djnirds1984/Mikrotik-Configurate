import { useState, useEffect } from 'react';
import { routerService } from '../services/supabase';
import { PlusIcon, PencilIcon, TrashIcon, WifiIcon } from '@heroicons/react/24/outline';

export default function Routers({ tenant }) {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);

  useEffect(() => {
    if (tenant) {
      fetchRouters();
    }
  }, [tenant]);

  const fetchRouters = async () => {
    setLoading(true);
    try {
      const { data, error } = await routerService.getAllRouters(tenant.id);
      if (!error) {
        setRouters(data);
      }
    } catch (error) {
      console.error('Error fetching routers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (routerId) => {
    try {
      const result = await routerService.testConnection(routerId);
      alert(result.success ? 'Connection successful!' : `Connection failed: ${result.error}`);
    } catch (error) {
      alert(`Connection test failed: ${error.message}`);
    }
  };

  const handleDelete = async (routerId) => {
    if (window.confirm('Are you sure you want to delete this router?')) {
      try {
        const { error } = await routerService.deleteRouter(routerId);
        if (!error) {
          fetchRouters();
        }
      } catch (error) {
        console.error('Error deleting router:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Router Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your MikroTik routers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Router
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {routers.map((router) => (
            <li key={router.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <WifiIcon className="h-8 w-8 text-gray-400" />
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{router.name}</h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          router.status === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {router.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <p>{router.ip_address}:{router.api_port}</p>
                        <p>Username: {router.username}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTestConnection(router.id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Test Connection
                    </button>
                    <button
                      onClick={() => {
                        setEditingRouter(router);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(router.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {routers.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No routers configured yet. Click "Add Router" to get started.
            </li>
          )}
        </ul>
      </div>

      {showModal && (
        <RouterModal
          tenant={tenant}
          router={editingRouter}
          onClose={() => {
            setShowModal(false);
            setEditingRouter(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingRouter(null);
            fetchRouters();
          }}
        />
      )}
    </div>
  );
}

function RouterModal({ tenant, router, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    api_port: '8728',
    username: '',
    password: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router) {
      setFormData({
        name: router.name,
        ip_address: router.ip_address,
        api_port: router.api_port.toString(),
        username: router.username,
        password: '',
        description: router.description || ''
      });
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const routerData = {
        ...formData,
        tenant_id: tenant.id,
        api_port: parseInt(formData.api_port)
      };

      if (router) {
        await routerService.updateRouter(router.id, routerData);
      } else {
        await routerService.addRouter(routerData);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving router:', error);
      alert('Error saving router: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {router ? 'Edit Router' : 'Add New Router'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Router Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">IP Address</label>
              <input
                type="text"
                required
                value={formData.ip_address}
                onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="192.168.1.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">API Port</label>
              <input
                type="number"
                required
                value={formData.api_port}
                onChange={(e) => setFormData({...formData, api_port: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required={!router}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                {loading ? 'Saving...' : (router ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}