import React, { useEffect, useState, useMemo } from 'react';
import { Customer, CustomerInsights } from '../types';
import { fetchAllCustomers, fetchAllInsights } from '../services/mockApi';
import { Link } from 'react-router-dom';
import { UserCircleIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const CUSTOMERS_PER_PAGE = 10;

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [insights, setInsights] = useState<{ [key: string]: CustomerInsights }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAllCustomers(),
      fetchAllInsights()
    ]).then(([customerData, insightsData]) => {
      setCustomers(customerData);
      setInsights(insightsData);
      setLoading(false);
    });
  }, []);
  
  // Reset page to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE);
  const startIndex = (currentPage - 1) * CUSTOMERS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + CUSTOMERS_PER_PAGE);
  
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  }

  if (loading) {
    return <div className="text-center p-10">Loading customers...</div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Customers</h1>
      
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by name..."
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">KYC Level</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Top Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Anomalies</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Member Since</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {paginatedCustomers.map((customer) => {
                const customerInsights = insights[customer.id];
                const topCategory = customerInsights?.categories?.[0]?.name || 'N/A';
                const anomalyCount = customerInsights?.anomalies?.length || 0;

                return (
                  <tr key={customer.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                          <UserCircleIcon className="h-8 w-8 text-gray-500 mr-3"/>
                          <div>
                            <p className="text-sm font-medium text-white">{customer.name}</p>
                            <p className="text-xs text-gray-400">{customer.email_masked}</p>
                          </div>
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.kyc_level === 'tier_3' ? 'bg-green-500/20 text-green-300' :
                          customer.kyc_level === 'tier_2' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                          {customer.kyc_level.replace('_', ' ')}
                      </span>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{topCategory}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {anomalyCount > 0 ? (
                            <span className="inline-flex items-center font-semibold px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-1"/>
                                {anomalyCount}
                            </span>
                        ) : (
                            <span className="text-gray-500">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/customer/${customer.id}`} className="text-blue-500 hover:text-blue-400 font-semibold py-1 px-3 rounded-md bg-blue-600/20 hover:bg-blue-600/30 transition">
                        View Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
         {/* Pagination Controls */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-700">
            <span className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(startIndex + CUSTOMERS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} results
            </span>
            <div className="flex space-x-2">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-semibold rounded-md transition bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-4 py-2 text-sm font-semibold rounded-md transition bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default Customers;