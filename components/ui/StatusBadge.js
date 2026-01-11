export function StatusBadge({ status }) {
    const styles = {
        'Active': 'bg-emerald-100 text-emerald-700',
        'Completed': 'bg-blue-100 text-blue-700',
        'Pending': 'bg-amber-100 text-amber-700',
        'Alert': 'bg-red-100 text-red-700',
        'Fraud': 'bg-red-100 text-red-700 font-bold',
        'Draft': 'bg-slate-100 text-slate-600',
    };

    const styleClass = styles[status] || 'bg-slate-100 text-slate-600';

    return `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styleClass}">
            ${status}
        </span>
    `;
}
