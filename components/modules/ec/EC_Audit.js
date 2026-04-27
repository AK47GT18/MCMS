import { Shared_Audit } from '../Shared_Audit.js';

export const EC_Audit = {
    ...Shared_Audit,
    getAuditView() {
        return Shared_Audit.getAuditView.call(this);
    }
};
