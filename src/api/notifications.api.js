/**
 * Notifications API Module
 */
import client from './client.js';

const notificationsApi = {
  getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return client.get(`/notifications${qs ? '?' + qs : ''}`);
  },

  getUnreadCount() {
    return client.get('/notifications/count');
  },

  markRead(id) {
    return client.put(`/notifications/${id}/read`);
  },

  markAllRead() {
    return client.put('/notifications/read-all');
  },

  create(data) {
    return client.post('/notifications', data);
  }
};

export default notificationsApi;
