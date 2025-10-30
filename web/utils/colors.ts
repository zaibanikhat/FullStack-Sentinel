import { RiskLevel } from '../types';

export const getRiskLevel = (score: number): RiskLevel => {
    if (score > 85) return 'high';
    if (score > 60) return 'medium';
    return 'low';
}

export const getRiskColorClasses = (riskLevel: RiskLevel) => {
  switch (riskLevel) {
    case 'high':
      return {
        text: 'text-red-400',
        pillBg: 'bg-red-500/20',
        pillText: 'text-red-300',
      };
    case 'medium':
      return {
        text: 'text-yellow-400',
        pillBg: 'bg-yellow-500/20',
        pillText: 'text-yellow-300',
      };
    case 'low':
    default:
      return {
        text: 'text-green-400',
        pillBg: 'bg-green-500/20',
        pillText: 'text-green-300',
      };
  }
};