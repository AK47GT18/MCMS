import { StatusBadge } from '../ui/StatusBadge.js';

export function FraudAlert({ id, vendor, amount, riskScore, date, status }) {
    // High risk > 80
    const isHighRisk = riskScore > 80;
    
    return `
        <div class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg mb-3 hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${isHighRisk ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M3.4 20.4a2 2 0 0 0 1.7 1h13.8a2 2 0 0 0 1.7-1l-6.9-12a2 2 0 0 0-3.4 0z"></path></svg>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-slate-900">${vendor}</h4>
                    <p class="text-xs text-slate-500">Invoice #${id} • ${date}</p>
                </div>
            </div>
            
            <div class="flex items-center gap-6">
                <div class="text-right">
                    <p class="text-sm font-bold text-slate-900">$${amount.toLocaleString()}</p>
                    <p class="text-xs ${isHighRisk ? 'text-red-500' : 'text-amber-500'} font-medium">Risk Score: ${riskScore}%</p>
                </div>
                ${StatusBadge({ status })}
                <button class="p-2 hover:bg-slate-200 rounded text-slate-400" onclick="window.drawer.open('Fraud Analysis', 'Loading analysis for #${id}...')">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </div>
    `;
}
