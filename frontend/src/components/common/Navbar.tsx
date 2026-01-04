import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 z-20">
      <div className="flex items-center justify-between">
        {/* Left Side - Menu Button + Welcome Text */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu - Only visible on mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          {/* Welcome Text */}
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              Welcome back, {user?.first_name}!
            </h2>
            <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">Manage your call analysis</p>
          </div>
        </div>

        {/* Right Side - User Info + Logout */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* User Info - Hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-3 px-3 lg:px-4 py-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
