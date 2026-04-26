import client from '../../../src/api/client.js';
import { Shared_Audit } from '../Shared_Audit.js';

export const EC_Audit = {
    ...Shared_Audit,
    
    getAuditView() {
        return Shared_Audit.getAuditView.call(this);
    },

    async _loadAuditLogs() {
        try {
            const res = await client.get('/audit-logs?limit=100');
            let logs = [];
            if (Array.isArray(res)) logs = res;
            else if (res.data && Array.isArray(res.data)) logs = res.data;
            else if (res.data?.items && Array.isArray(res.data.items)) logs = res.data.items;
            else if (res.items && Array.isArray(res.items)) logs = res.items;

            this.auditLogs = logs;
            this._refreshCurrentView();
        } catch (err) {
            console.error('[EC] Audit load failed:', err);
        }
    }
};
