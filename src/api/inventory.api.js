import client from './client.js';

export default {
    getBySector: (sectorId) => client.get(`/inventory/sector/${sectorId}`),
    getByProject: (projectId) => client.get(`/inventory/project/${projectId}`),
    distribute: (data) => client.post('/inventory/distribute', data),
    consume: (data) => client.post('/inventory/consume', data),
    getIncomingShipments: () => client.get('/inventory/incoming-shipments'),
    receiveShipment: (data) => client.post('/inventory/receive-shipment', data)
};
