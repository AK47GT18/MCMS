export function BudgetBar({ label, spent, budget }) {
    const percentage = Math.min(100, Math.round((spent / budget) * 100));
    let colorClass = 'bg-emerald-500';
    
    if (percentage > 90) colorClass = 'bg-red-500';
    else if (percentage > 75) colorClass = 'bg-amber-500';

    return `
        <div class="mb-4">
            <div class="flex justify-between items-end mb-1">
                <span class="text-sm font-medium text-slate-700">${label}</span>
                <span class="text-xs text-slate-500">
                    <span class="font-semibold text-slate-900">$${spent.toLocaleString()}</span> / $${budget.toLocaleString()} (${percentage}%)
                </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="${colorClass} h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}
