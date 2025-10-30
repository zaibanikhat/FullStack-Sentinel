import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Case } from '../types';
import { fetchCase, fetchKbArticle } from '../services/mockApi';
import { LightBulbIcon, DocumentTextIcon, CreditCardIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import KnowledgeBaseModal from '../components/KnowledgeBaseModal';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [activeKbArticle, setActiveKbArticle] = useState<{title: string; content: string;} | null>(null);

  useEffect(() => {
    if (id) {
      fetchCase(id).then(data => {
        setCaseItem(data);
        setLoading(false);
      });
    }
  }, [id]);
  
  const handleViewCitation = async (docId: string) => {
    try {
        const article = await fetchKbArticle(docId);
        setActiveKbArticle(article);
        setIsKbModalOpen(true);
    } catch (error) {
        console.error("Failed to fetch KB article", error);
        alert("Could not load knowledge base article.");
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading case details...</div>;
  }

  if (!caseItem) {
    return <div className="text-center p-10">Case not found.</div>;
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Case <span className="font-mono text-blue-400">{caseItem.id}</span></h1>
            <div className="mt-2 flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    caseItem.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                }`}>
                    {caseItem.status}
                </span>
                <span className="text-gray-400">
                    Created: {new Date(caseItem.createdAt).toLocaleString()}
                </span>
            </div>
          </div>
          <Link to="/cases" className="text-blue-400 hover:underline">&larr; Back to Cases</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                 {/* AI Analysis Section */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                        <LightBulbIcon className="h-6 w-6 mr-2 text-blue-400" />
                        AI Analysis
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-400">Proposed Dispute Reason</h3>
                            <p className="text-lg text-white font-semibold">{caseItem.proposedReason || 'N/A'}</p>
                        </div>
                         {caseItem.citation && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Relevant Policy</h3>
                                 <button 
                                    onClick={() => handleViewCitation(caseItem.citation!.docId)} 
                                    className="text-blue-400 hover:underline text-left flex items-center text-md"
                                >
                                    <DocumentTextIcon className="h-5 w-5 mr-2"/>
                                    {caseItem.citation.title}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Matched Transaction */}
                {caseItem.matchedTransaction && (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                            <CreditCardIcon className="h-6 w-6 mr-2 text-green-400" />
                            Matched Transaction
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Merchant</h3>
                                <p className="text-lg text-white">{caseItem.matchedTransaction.merchant}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Date</h3>
                                <p className="text-lg text-white">{new Date(caseItem.matchedTransaction.ts).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Amount</h3>
                                <p className="text-lg text-white font-mono">
                                    {(caseItem.matchedTransaction.amount_cents / 100).toLocaleString('en-IN', { style: 'currency', currency: caseItem.matchedTransaction.currency })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Case Details */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Case Details</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Customer</h3>
                        <Link to={`/customer/${caseItem.customerId}`} className="flex items-center text-lg text-blue-400 hover:underline font-semibold mt-1">
                            <UserCircleIcon className="h-6 w-6 mr-2 text-gray-400"/>
                            {caseItem.customerName}
                        </Link>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-400">Customer Complaint</h3>
                        <p className="text-md text-gray-200 italic bg-gray-700/50 p-3 rounded-md">"{caseItem.description}"</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
       <KnowledgeBaseModal 
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        title={activeKbArticle?.title || 'Loading...'}
        content={activeKbArticle?.content || ''}
    />
    </>
  );
};

export default CaseDetail;