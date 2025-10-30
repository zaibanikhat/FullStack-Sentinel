import React, { useEffect, useState, useMemo } from 'react';
import { fetchAlerts, fetchAllCustomers, fetchAllCases } from '../services/mockApi';
import { Alert, Customer, Case } from '../types';
import { BellAlertIcon, UserGroupIcon, InboxStackIcon, ChartPieIcon, PlusCircleIcon, DocumentPlusIcon, ClockIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import CreateCaseModal from '../components/CreateCaseModal';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('24h');

    useEffect(() => {
        // Don't refetch if the modal is just opening
        if (isCreateModalOpen) return;

        setLoading(true);
        Promise.all([
            fetchAlerts(),
            fetchAllCustomers(),
            fetchAllCases()
        ]).then(([alertData, customerData, caseData]) => {
            setAlerts(alertData);
            setCustomers(customerData);
            const sortedCases = caseData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setCases(sortedCases);
            setLoading(false);
        });
    }, [isCreateModalOpen]);

    const { filteredAlerts, filteredCases } = useMemo(() => {
        const now = new Date();
        let cutoffDate = new Date();

        if (activeFilter === '24h') {
            cutoffDate.setHours(now.getHours() - 24);
        } else if (activeFilter === '7d') {
            cutoffDate.setDate(now.getDate() - 7);
        } else if (activeFilter === '30d') {
            cutoffDate.setDate(now.getDate() - 30);
        }

        const newFilteredAlerts = alerts.filter(a => new Date(a.createdAt) >= cutoffDate);
        const newFilteredCases = cases.filter(c => new Date(c.createdAt) >= cutoffDate);
        
        return { filteredAlerts: newFilteredAlerts, filteredCases: newFilteredCases };
    }, [alerts, cases, activeFilter]);

    if (loading) {
        return <div className="text-center p-10">Loading dashboard...</div>;
    }

    const openAlertsInQueue = alerts.filter(a => a.status === 'new' || a.status === 'in_progress').length;
    const disputesOpenedInPeriod = filteredCases.length;
    const openCases = cases.filter(c => c.status === 'OPEN').length;
    
    const avgTriageLatency = '~45s'; // Mocked value

    const disputesTitle = `Disputes Opened (${activeFilter === '24h' ? 'Last 24h' : activeFilter === '7d' ? '7d' : '30d'})`;
    const chartTitle = `Alerts by Risk Level (${activeFilter === '24h' ? 'Last 24h' : activeFilter === '7d' ? '7d' : '30d'})`;

    const riskData = [
        { name: 'Low Risk (<60)', count: filteredAlerts.filter(a => a.riskScore <= 60).length, color: '#22c55e' },
        { name: 'Medium Risk (61-85)', count: filteredAlerts.filter(a => a.riskScore > 60 && a.riskScore <= 85).length, color: '#f59e0b' },
        { name: 'High Risk (>85)', count: filteredAlerts.filter(a => a.riskScore > 85).length, color: '#ef4444' }
    ];

    const FilterButton: React.FC<{label: string, value: string}> = ({ label, value }) => (
         <button
            onClick={() => setActiveFilter(value)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                activeFilter === value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold mb-6 text-white">Dashboard</h1>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Alerts in Queue */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center"><div className="p-3 rounded-full bg-blue-500/20 mr-4"><BellAlertIcon className="h-8 w-8 text-blue-400" /></div><div><h3 className="text-sm font-medium text-gray-400">Alerts in Queue</h3><p className="text-3xl font-semibold text-white">{openAlertsInQueue}</p></div></div>
                    {/* Disputes Opened */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center"><div className="p-3 rounded-full bg-purple-500/20 mr-4"><DocumentPlusIcon className="h-8 w-8 text-purple-400" /></div><div><h3 className="text-sm font-medium text-gray-400">{disputesTitle}</h3><p className="text-3xl font-semibold text-white">{disputesOpenedInPeriod}</p></div></div>
                    {/* Avg Triage Latency */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center"><div className="p-3 rounded-full bg-red-500/20 mr-4"><ClockIcon className="h-8 w-8 text-red-400" /></div><div><h3 className="text-sm font-medium text-gray-400">Avg. Triage Latency</h3><p className="text-3xl font-semibold text-white">{avgTriageLatency}</p></div></div>
                    {/* Open Cases */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center"><div className="p-3 rounded-full bg-yellow-500/20 mr-4"><InboxStackIcon className="h-8 w-8 text-yellow-400" /></div><div><h3 className="text-sm font-medium text-gray-400">Open Cases</h3><p className="text-3xl font-semibold text-white">{openCases}</p></div></div>
                </div>

                 {/* Quick Filters */}
                <div className="mb-8 flex items-center space-x-2">
                    <FilterButton label="Last 24h" value="24h" />
                    <FilterButton label="Last 7 Days" value="7d" />
                    <FilterButton label="Last 30 Days" value="30d" />
                </div>


                {/* Charts */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                        <ChartPieIcon className="h-6 w-6 mr-2 text-blue-400" />
                        {chartTitle}
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" stroke="#9ca3af" width={150} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                contentStyle={{ backgroundColor: '#2d2d2d', border: 'none' }}
                                labelStyle={{ color: '#ffffff' }}
                            />
                            <Legend />
                            <Bar dataKey="count" barSize={30}>
                                {riskData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Cases */}
                <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Recent Cases</h2>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center bg-blue-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-blue-700 transition text-sm"
                        >
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Create New Case
                        </button>
                    </div>
                    {cases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <tbody className="divide-y divide-gray-700">
                                    {cases.slice(0, 5).map((caseItem) => (
                                        <tr key={caseItem.id} className="hover:bg-gray-700/50">
                                            <td className="px-2 py-3 whitespace-nowrap">
                                                <p className="text-sm font-medium text-white">{caseItem.description}</p>
                                                <p className="text-xs font-mono text-gray-400">{caseItem.id}</p>
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    caseItem.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                                                }`}>
                                                    {caseItem.status}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-right">
                                                <Link to={`/case/${caseItem.id}`} className="text-blue-500 hover:text-blue-400 font-semibold text-sm">
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-4">No recent cases.</p>
                    )}
                </div>
            </div>
            <CreateCaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </>
    );
};

export default Dashboard;