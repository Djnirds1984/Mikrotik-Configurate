import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  HomeIcon, 
  ServerIcon, 
  TicketIcon, 
  CogIcon, 
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Routers', href: '/routers', icon: ServerIcon },
  { name: 'Vouchers', href: '/vouchers', icon: TicketIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export default function Navbar({ tenant }) {
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MikroTik Manager</span>
              {tenant && (
                <span className="ml-4 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                  {tenant.name}
                </span>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}