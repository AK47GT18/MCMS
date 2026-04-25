import client from './client.js';

export default {
    getConflicts: () => client.get('/assets-scheduler/conflicts'),
    getRecommendations: (projectId) => client.get(`/assets-scheduler/recommendations/${projectId}`)
};
