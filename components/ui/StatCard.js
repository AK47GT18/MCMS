export function StatCard({ title, value, subtext, trend, alertColor }) {
    // trend: 'up' | 'down' | 'neutral'
    // alertColor: 'red' | 'amber' | 'none'
    
    let iconHTML = '';
    let cardStyle = '';
    let titleStyle = '';
    let valueStyle = '';
    let iconColor = 'var(--slate-500)';
    
    // Icon Logic matching Legacy
    if (title.includes('Fraud')) {
        iconHTML = '<i class="fas fa-shield-halved"></i>';
        iconColor = 'var(--red)';
    } else if (title.includes('Pending')) {
        iconHTML = '<i class="fas fa-clock"></i>';
        iconColor = 'var(--orange)';
    } else if (title.includes('Contract')) {
        iconHTML = '<i class="fas fa-file-signature"></i>';
        iconColor = 'var(--blue)';
    } else if (title.includes('Budget')) {
        iconHTML = '<i class="fas fa-chart-bar"></i>';
        iconColor = 'var(--orange)';
    }

    // Updated card styling - match PM pattern (border-color + background)
    if (alertColor === 'red') {
        cardStyle = 'border-color: var(--red-light); background: #fff5f5;';
        titleStyle = 'color: var(--red);';
        valueStyle = 'color: var(--red);';
    } else if (alertColor === 'amber') {
        cardStyle = 'border-color: var(--orange-light); background: #fffbf7;';
        titleStyle = 'color: var(--orange);';
        valueStyle = 'color: var(--orange);';
    }

    return `
        <div class="stat-card" style="${cardStyle}">
            <div class="stat-header">
                <span class="stat-label" style="${titleStyle}">${title}</span>
                <span style="color: ${iconColor};">${iconHTML}</span>
            </div>
            <div class="stat-value" style="${valueStyle}">${value}</div>
            <div class="stat-sub">${subtext}</div>
        </div>
    `;
}
