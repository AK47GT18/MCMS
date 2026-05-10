import client from '../../../src/api/client.js';
import { StatCard } from '../../ui/StatCard.js';

export const EC_Records = {
    getRecordsView() {
        setTimeout(async () => {
            const { PM_Reports } = await import('../pm/PM_Reports.js');
            const container = document.getElementById('ec-reports-root');
            if (container) {
                container.innerHTML = PM_Reports.getReportsView();
                PM_Reports.init();
            }
        }, 0);

        return `<div id="ec-reports-root">
            <div class="rb-empty-state">
                <div class="rb-loader"></div>
                <p style="margin-top: 20px;">Initializing Logistics Records...</p>
            </div>
        </div>`;
    },
};
