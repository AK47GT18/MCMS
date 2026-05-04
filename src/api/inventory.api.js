import client from './client.js';

export default {
    getBySector: (sectorId, options = {}) => client.get(`/inventory/sector/${sectorId}`, options),
    getByProject: (projectId, options = {}) => client.get(`/inventory/project/${projectId}`, options),
    getAll: (options = {}) => client.get('/inventory', options),
    distribute: (data, options = {}) => client.post('/inventory/distribute', data, options),
    consume: (data, options = {}) => client.post('/inventory/consume', data, options),
    getIncomingShipments: (options = {}) => client.get('/inventory/incoming-shipments', options),
    receiveShipment: (data, options = {}) => client.post('/inventory/receive-shipment', data, options)
};
