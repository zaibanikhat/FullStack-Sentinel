import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Customer, Transaction, CustomerInsights } from '../types';
import { fetchCustomer, fetchTransactions, fetchCustomerInsights } from '../services/mockApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';


const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const handleLoadMore = useCallback(async () => {
    if (!id || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
        const data = await fetchTransactions(id, { limit: 10, cursor: nextCursor });
        setTransactions(prev => [...prev, ...data.transactions]);
        setNextCursor(data.nextCursor);
    } catch (error) {
        console.error("Failed to load more transactions", error);
    } finally {
        setIsLoadingMore(false);
    }
  }, [id, nextCursor, isLoadingMore]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setTransactions([]);
      setNextCursor(null);

      Promise.all([
        fetchCustomer(id),
        fetchTransactions(id, { limit: 10 }),
        fetchCustomerInsights(id)
      ]).then(([customerData, transactionsData, insightsData]) => {
        setCustomer(customerData);
        setTransactions(transactionsData.transactions);
        setNextCursor(transactionsData.nextCursor);
        setInsights(insightsData);
        setLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    if (isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          handleLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [isLoadingMore, nextCursor, handleLoadMore]);

  if (loading) {
    return <div className="text-center p-10">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="text-center p-10">Customer not found.</div>;
  }
  
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{customer.name}</h1>
          <p className="text-gray-400">{customer.email_masked}</p>
          <span className="mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">
            KYC Level: {customer.kyc_level.replace('_', ' ')}
          </span>
        </div>
        <Link to="/customers" className="text-blue-400 hover:underline">&larr; Back to Customers</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Category Spend</h2>
            {insights && (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.categories} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}/>
                    <Bar dataKey="pct" barSize={20}>
                        {insights.categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            )}
        </div>
         <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Top Merchants</h2>
            {insights && (
                 <ul className="space-y-3">
                     {insights.topMerchants.map(m => (
                         <li key={m.merchant} className="flex justify-between items-center text-sm">
                             <span className="text-gray-300">{m.merchant}</span>
                             <span className="font-mono bg-gray-700 px-2 py-1 rounded">{m.count} txns</span>
                         </li>
                     ))}
                 </ul>
            )}
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <LightBulbIcon className="h-5 w-5 mr-2 text-blue-400" />
                AI Insights: Monthly Spending Trend
            </h2>
            {insights && (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={insights.monthlyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" tickFormatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value / 100)} />
                        <Tooltip contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }} formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100)} />
                        <Legend />
                        <Line type="monotone" dataKey="sum" stroke="#3b82f6" strokeWidth={2} name="Total Spend" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-400" />
                AI Insights: Spending Anomalies
            </h2>
            {insights && (
                <ul className="space-y-4">
                    {insights.anomalies.map((anomaly, index) => (
                        <li key={index} className="flex items-start">
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-500/20">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                                </span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-200">{anomaly.note}</p>
                                <p className="text-xs text-gray-400">
                                    {new Date(anomaly.ts).toLocaleString()} (Z-Score: {anomaly.z})
                                </p>
                            </div>
                        </li>
                    ))}
                     {insights.anomalies.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No anomalies detected.</p>
                    )}
                </ul>
            )}
        </div>
    </div>


      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 text-white">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(tx.ts).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{tx.merchant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-white">
                    {(tx.amount_cents / 100).toLocaleString('en-IN', { style: 'currency', currency: tx.currency })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && !loading && (
             <div className="text-center py-10 text-gray-500">
                No transactions found for this customer.
            </div>
          )}
        </div>
      </div>
      <div ref={observerRef} style={{ height: '1px' }} />
      {isLoadingMore && (
        <div className="mt-6 text-center flex justify-center items-center">
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading more transactions...</span>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;