
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheckIcon, ChartBarIcon, BellAlertIcon, ClipboardDocumentCheckIcon, UserGroupIcon, InboxStackIcon } from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <aside className="w-16 md:w-64 bg-gray-800 flex flex-col">
      <div className="flex items-center justify-center md:justify-start p-4 md:p-5 border-b border-gray-700">
        <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
        <h1 className="hidden md:block ml-3 text-xl font-bold text-white">Sentinel</h1>
      </div>
      <nav className="flex-1 p-2 md:p-3">
        <NavLink to="/dashboard" className={navLinkClasses}>
          <ChartBarIcon className="h-6 w-6" />
          <span className="hidden md:inline ml-4">Dashboard</span>
        </NavLink>
        <NavLink to="/alerts" className={navLinkClasses}>
          <BellAlertIcon className="h-6 w-6" />
          <span className="hidden md:inline ml-4">Alerts</span>
        </NavLink>
        <NavLink to="/cases" className={navLinkClasses}>
          <InboxStackIcon className="h-6 w-6" />
          <span className="hidden md:inline ml-4">Cases</span>
        </NavLink>
        <NavLink to="/customers" className={navLinkClasses}>
          <UserGroupIcon className="h-6 w-6" />
          <span className="hidden md:inline ml-4">Customers</span>
        </NavLink>
        <NavLink to="/evals" className={navLinkClasses}>
          <ClipboardDocumentCheckIcon className="h-6 w-6" />
          <span className="hidden md:inline ml-4">Evals</span>
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
            <img className="h-10 w-10 rounded-full" src="https://picsum.photos/100" alt="User" />
            <div className="hidden md:block ml-3">
                <p className="text-sm font-medium text-white">Support Agent</p>
                <p className="text-xs text-gray-400">agent@sentinel.co</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;