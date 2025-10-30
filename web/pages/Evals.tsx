import React, { useState } from 'react';
import { EvalReport, RiskLevel } from '../types';
import { runEvals } from '../services/mockApi';
import { BeakerIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { getRiskColorClasses } from '../utils/colors';

const Evals: React.FC = () => {
    const [report, setReport] = useState<EvalReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRunEvals = async () => {
        setIsLoading(true);
        setReport(null);
        const data = await runEvals();
        setReport(data);
        setIsLoading(false);
    };

    const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-white">Model Evaluations</h1>
                <button
                    onClick={handleRunEvals}
                    disabled={isLoading}
                    className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Running...
                        </>
                    ) : (
                        <>
                        <BeakerIcon className="h-5 w-5 mr-2" />
                        Run New Evaluation
                        </>
                    )}
                </button>
            </div>
            <div className="mb-6 bg-gray-800 border border-blue-500/30 text-blue-200 text-sm rounded-lg p-3 flex items-start">
                 <InformationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-blue-400"/>
                 <div>
                    This report measures model performance by running a simulated test against a "golden set" of 200 historical cases. It is separate from the live agent alert queue.
                 </div>
            </div>

            {isLoading && (
                 <div className="text-center p-10 bg-gray-800 rounded-lg">
                    <p className="text-lg text-gray-300">Running evaluation on golden set...</p>
                    <p className="text-sm text-gray-500">This may take a moment.</p>
                 </div>
            )}

            {!isLoading && !report && (
                 <div className="text-center p-10 bg-gray-800 rounded-lg">
                    <p className="text-lg text-gray-300">Click "Run New Evaluation" to see the latest model performance report.</p>
                 </div>
            )}

            {report && (
                <div className="space-y-8">
                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg"><h3 className="text-sm font-medium text-gray-400">Task Success Rate</h3><p className={`text-3xl font-semibold mt-2 ${report.summary.successRate > 90 ? 'text-green-400' : 'text-yellow-400'}`}>{report.summary.successRate.toFixed(1)}%</p></div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg"><h3 className="text-sm font-medium text-gray-400">Total Test Cases</h3><p className="text-3xl font-semibold text-white mt-2">{report.summary.totalCases}</p></div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg"><h3 className="text-sm font-medium text-gray-400">Pass</h3><p className="text-3xl font-semibold text-green-400 mt-2">{report.summary.passCount}</p></div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg"><h3 className="text-sm font-medium text-gray-400">Fail</h3><p className="text-3xl font-semibold text-red-400 mt-2">{report.summary.failCount}</p></div>
                    </div>
                    
                    {/* Confusion Matrix */}
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">Risk Confusion Matrix</h2>
                         <div className="flex items-center">
                            <div className="w-20 font-bold text-sm text-gray-400 -rotate-90">Actual</div>
                            <div className="flex-1">
                                <table className="min-w-full text-center">
                                    <thead>
                                        <tr>
                                            <th className="py-2"></th>
                                            <th colSpan={3} className="py-2 text-sm text-gray-400 font-bold">Predicted</th>
                                        </tr>
                                        <tr>
                                            <th className="px-2 py-2"></th>
                                            {riskLevels.map(level => {
                                                const colors = getRiskColorClasses(level);
                                                return <th key={level} className={`px-4 py-2 capitalize font-semibold ${colors.text} bg-gray-700/50 rounded-t-md`}>{level}</th>
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {riskLevels.map(actualLevel => (
                                            <tr key={actualLevel}>
                                                <td className="px-2 py-4 capitalize font-semibold text-gray-300">{actualLevel}</td>
                                                {riskLevels.map(predictedLevel => {
                                                    const value = report.confusionMatrix[actualLevel][predictedLevel];
                                                    const isDiagonal = actualLevel === predictedLevel;
                                                    return (
                                                        <td key={predictedLevel} className={`px-4 py-4 text-lg font-bold ${isDiagonal ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                            {value}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Top Failures */}
                    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <h2 className="text-xl font-semibold p-6 text-white">Top Failures</h2>
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                             <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Case</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Predicted Risk</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actual Risk</th>
                                </tr>
                             </thead>
                             <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {report.topFailures.map(failure => {
                                    const predictedColors = getRiskColorClasses(failure.predictedRisk);
                                    const actualColors = getRiskColorClasses(failure.actualRisk);
                                    return (
                                        <tr key={failure.caseId}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-white">{failure.description}</p>
                                                <p className="text-xs text-gray-500">{failure.caseId}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-sm font-semibold capitalize rounded-full ${predictedColors.pillBg} ${predictedColors.pillText}`}>
                                                    {failure.predictedRisk}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-sm font-semibold capitalize rounded-full ${actualColors.pillBg} ${actualColors.pillText}`}>
                                                    {failure.actualRisk}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                             </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Evals;