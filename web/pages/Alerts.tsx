import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Alert, AlertStatus, TriageRun, RiskLevel } from '../types';
import { fetchAlerts } from '../services/mockApi';
import TriageDrawer from '../components/TriageDrawer';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getRiskColorClasses, getRiskLevel } from '../utils/colors';
import { MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

const ALERTS_PER_PAGE = 10;
type SortKey = 'id' | 'customerName' | 'riskScore' | 'status' | 'createdAt';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'createdAt', direction: 'descending' });
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts().then(data => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);
  
  useEffect(() => {
    if (loading) return;

    const { openAlertId } = location.state || {};
    if (openAlertId) {
        const alertToOpen = alerts.find(a => a.id === openAlertId);
        if (alertToOpen) {
            setSelectedAlert(alertToOpen);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }
  }, [location.state, alerts, navigate, loading]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, riskFilter, searchTerm, sortConfig]);

  const sortedAndFilteredAlerts = useMemo(() => {
    let filtered = alerts.filter(alert => {
      const statusMatch = statusFilter === 'all' || alert.status === statusFilter;
      const riskLevel = getRiskLevel(alert.riskScore);
      const riskMatch = riskFilter === 'all' || riskLevel === riskFilter;
      const searchMatch = 
        alert.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.id.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && riskMatch && searchMatch;
    });

    const statusOrder = { 'new': 0, 'in_progress': 1, 'resolved': 2 };
    
    filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortConfig.key === 'status') {
            aValue = statusOrder[a.status];
            bValue = statusOrder[b.status];
        } else if (sortConfig.key === 'createdAt') {
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        } else {
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }
        
        if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        // As a secondary sort, always use date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;

  }, [alerts, statusFilter, riskFilter, searchTerm, sortConfig]);


  const handleOpenTriage = useCallback((alert: Alert) => {
    setSelectedAlert(alert);
  }, []);
  
  const handleCloseTriage = useCallback((actionTaken?: boolean, finalTriageRun?: TriageRun | null) => {
    if (actionTaken && selectedAlert && finalTriageRun) {
      setAlerts(prevAlerts => 
        prevAlerts.map(a =>
          a.id === selectedAlert.id ? { ...a, status: 'resolved', triageRun: finalTriageRun } : a
        )
      );
    }
    setSelectedAlert(null);
  }, [selectedAlert]);

  const requestSort = useCallback((key: SortKey) => {
    let direction: 'ascending' | 'descending';

    if (sortConfig.key === key) {
        // Toggle direction if same key
        direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    } else {
        // Set default direction for new key
        direction = key === 'createdAt' || key === 'riskScore' ? 'descending' : 'ascending';
    }
    
    setSortConfig({ key, direction });
  }, [sortConfig]);

  if (loading) {
    return <div className="text-center p-10">Loading alerts...</div>;
  }
  
  const totalPages = Math.ceil(sortedAndFilteredAlerts.length / ALERTS_PER_PAGE);
  const paginatedAlerts = sortedAndFilteredAlerts.slice((currentPage - 1) * ALERTS_PER_PAGE, currentPage * ALERTS_PER_PAGE);

  const StatusFilterButton: React.FC<{ label: string; value: AlertStatus | 'all'}> = ({ label, value }) => (
    <button
        onClick={() => setStatusFilter(value)}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${
            statusFilter === value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
    >
        {label}
    </button>
  );
  
  const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode }> = ({ sortKey, children }) => {
    const isActive = sortConfig.key === sortKey;
    const sortDirection = isActive ? sortConfig.direction : 'none';
    return (
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" aria-sort={sortDirection}>
            <button onClick={() => requestSort(sortKey)} className="flex items-center space-x-1 hover:text-white">
                <span>{children}</span>
                {isActive && (sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />)}
            </button>
        </th>
    );
  };
  
   const SortDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const sortOptions: { key: SortKey; label: string }[] = [
      { key: 'createdAt', label: 'Most Recent' },
      { key: 'riskScore', label: 'Risk Score' },
      { key: 'status', label: 'Status' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'id', label: 'Alert ID' },
    ];

    const currentLabel = sortOptions.find((opt) => opt.key === sortConfig.key)?.label || 'Sort By';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span>Sort by: {currentLabel}</span>
          <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute z-10 mt-2 w-48 bg-gray-700 rounded-md shadow-lg border border-gray-600 right-0">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  requestSort(option.key);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex justify-between items-center"
              >
                {option.label}
                {sortConfig.key === option.key && (
                    sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Alerts Queue</h1>
      
      <div className="mb-6 bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 bg-gray-700/50 p-1 rounded-lg self-start">
            <StatusFilterButton label="All" value="all" />
            <StatusFilterButton label="New" value="new" />
            <StatusFilterButton label="In Progress" value="in_progress" />
            <StatusFilterButton label="Resolved" value="resolved" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search by customer or ID..."
                aria-label="Search alerts"
              />
            </div>
            <select
                id="riskFilter"
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value as RiskLevel | 'all')}
                className="w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                aria-label="Filter by risk level"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
            </select>
            <SortDropdown />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <SortableHeader sortKey="id">Alert ID</SortableHeader>
                <SortableHeader sortKey="customerName">Customer</SortableHeader>
                <SortableHeader sortKey="riskScore">Risk Score</SortableHeader>
                <SortableHeader sortKey="status">Status</SortableHeader>
                <SortableHeader sortKey="createdAt">Created At</SortableHeader>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {paginatedAlerts.length > 0 ? (
                paginatedAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-700/50 transition-colors focus-within:bg-gray-700/50" tabIndex={0}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                        {alert.id.split('_')[1]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/customer/${alert.customerId}`} className="text-sm font-medium text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                          {alert.customerName}
                        </Link>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getRiskColorClasses(getRiskLevel(alert.riskScore)).text}`}>
                        {alert.riskScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                            alert.status === 'new' ? 'bg-blue-500/20 text-blue-300' : 
                            alert.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                        }`}>
                            {alert.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(alert.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenTriage(alert)} className="text-blue-500 hover:text-blue-400 font-semibold py-1 px-3 rounded-md bg-blue-600/20 hover:bg-blue-600/30 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                          Open Triage
                        </button>
                      </td>
                    </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No alerts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-700">
                <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-semibold rounded-md transition bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-semibold rounded-md transition bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}
      </div>
      {selectedAlert && <TriageDrawer alert={selectedAlert} onClose={handleCloseTriage} />}
    </>
  );
};

export default Alerts;