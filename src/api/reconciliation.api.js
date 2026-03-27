import client from './client.js';

export default {
    getReport: (projectId) => client.get(`/reconciliation/${projectId}`)
};
