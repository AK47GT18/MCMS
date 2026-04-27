import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';

export const EC_Records = {
    getRecordsView() {
        setTimeout(async () => {
            const { PM_Reports } = await import('../pm/PM_Reports.js');
            const container = document.getElementById('ec-reports-root');
            if (container) {
                container.innerHTML = PM_Reports.render();
                PM_Reports.init();
            }
        }, 0);

        return `<div id="ec-reports-root">
            <div style="padding: 40px; text-align: center; color: var(--slate-400);">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i>
                <p>Initializing Logistics Records...</p>
            </div>
        </div>`;
    },
};
