export function StatCard({ title, value, subtext, trend, alertColor }) {
    // trend: 'up' | 'down' | 'neutral'
    // alertColor: 'red' | 'green' | 'blue' | 'none'
    
    let iconHTML = '';
    let trendClass = 'text-slate-500';
    let iconClass = 'text-slate-400';
    let borderStyle = '';
    
    // Icon Logic matching Legacy
    if (title.includes('Fraud')) {
        iconHTML = '<i class="fas fa-shield-halved"></i>';
        iconClass = 'text-red-500';
    } else if (title.includes('Pending')) {
        iconHTML = '<i class="fas fa-clock"></i>';
        iconClass = 'text-amber-500';
    } else if (title.includes('Contract')) {
        iconHTML = '<i class="fas fa-file-signature"></i>';
        iconClass = 'text-blue-500';
    } else if (title.includes('Budget')) {
        iconHTML = '<i class="fas fa-chart-bar"></i>';
    }

    if (alertColor === 'red') borderStyle = 'border-left: 4px solid var(--red);';
    if (alertColor === 'amber') borderStyle = 'border-left: 4px solid #F59E0B;';

    // Exact Legacy HTML Structure for StatCard
    return `
        <div class="stat-card" style="${borderStyle}">
            <div class="stat-header">
                <span class="stat-label" style="${alertColor ? `color: var(--${alertColor === 'amber' ? 'orange' : alertColor});` : ''}">${title}</span>
                <span style="${iconClass}">${iconHTML}</span>
            </div>
            <div class="stat-value" style="${alertColor ? `color: var(--${alertColor === 'amber' ? 'orange' : alertColor});` : ''}">${value}</div>
            <div class="stat-sub">${subtext}</div>
        </div>
    `;
}
