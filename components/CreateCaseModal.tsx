import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { createCaseAndAlertFromDescription } from '../services/mockApi';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ isOpen, onClose }) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleClose = () => {
    setDescription('');
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!description) {
      setError('Please provide a description of the customer complaint.');
      setIsSubmitting(false);
      return;
    }

    try {
      const newAlert = await createCaseAndAlertFromDescription(description);
      if (newAlert) {
        handleClose();
        navigate('/alerts', { state: { openAlertId: newAlert.id } });
      } else {
        setError('Could not create an alert. Please ensure the description includes a valid customer name and a recognized scenario (e.g., "Eve Davis was charged twice").');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4">
        <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create New Case</h3>
                <button type="button" onClick={handleClose} className="p-1 rounded-full hover:bg-gray-700">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Customer Complaint</label>
                    <textarea
                        id="description"
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Eve Davis was charged twice at QuickCab."
                    />
                    <p className="text-xs text-gray-500 mt-1">The system will create a case and a new alert to triage.</p>
                </div>
                {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md">{error}</p>}
            </div>
            <div className="px-6 py-4 bg-gray-900/50 flex justify-end space-x-3">
                <button type="button" onClick={handleClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition">Cancel</button>
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    )}
                    {isSubmitting ? 'Creating...' : 'Create & Triage'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCaseModal;
