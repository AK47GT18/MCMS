/**
 * MCMS Frontend API - Timeline Extension Requests
 */
import client from './client.js';

const timelineExtensions = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return client.get(`/timeline-extensions${qs ? '?' + qs : ''}`);
  },
  create: (data) => client.post('/timeline-extensions', data),
  approve: (id, data) => client.post(`/timeline-extensions/${id}/approve`, data),
  reject: (id, data) => client.post(`/timeline-extensions/${id}/reject`, data),
};

export default timelineExtensions;
