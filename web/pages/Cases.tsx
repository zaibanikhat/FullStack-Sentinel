
import React, { useEffect, useState } from 'react';
import { Case } from '../types';
import { fetchAllCases } from '../services/mockApi';
import { Link } from 'react-router-dom';
import CreateCaseModal from '../components/CreateCaseModal';
import { PlusCircleIcon } from '@heroicons/react/24/solid';

const Cases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAllCases().then(data => {
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCases(sortedData);
      setLoading(false);
    });
  }, [isCreateModalOpen]); // Re-fetch cases when modal closes in case a new one was added

  if (loading) {
    return <div className="text-center p-10">Loading cases...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">All Cases</h1>
        <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Create New Case
        </button>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {cases.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Case ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">{caseItem.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{caseItem.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        caseItem.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(caseItem.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/case/${caseItem.id}`} className="text-blue-500 hover:text-blue-400 font-semibold py-1 px-3 rounded-md bg-blue-600/20 hover:bg-blue-600/30 transition">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-10">
              <p className="text-gray-400">No cases have been created yet. Use "Create Case" on the dashboard to open a new dispute.</p>
            </div>
          )}
        </div>
      </div>
      <CreateCaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

export default Cases;
