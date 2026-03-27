import client from './client.js';

export default {
    getByProject: (projectId) => client.get(`/replenishment/project/${projectId}`),
    createRequest: (data) => client.post('/replenishment/request', data),
    financeAction: (id, data) => client.post(`/replenishment/${id}/finance-action`, data),
    pmAction: (id, data) => client.post(`/replenishment/${id}/pm-action`, data),
    completeRequest: (id) => client.post(`/replenishment/${id}/complete`, {})
};
