import client from './client.js';

export default {
    getBySector: (sectorId) => client.get(`/inventory/sector/${sectorId}`),
    distribute: (data) => client.post('/inventory/distribute', data),
    consume: (data) => client.post('/inventory/consume', data)
};
