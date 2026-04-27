import client from './client.js';

const pm = {
  getMaterialPrices: () => client.get('/pm/material-prices'),
  upsertMaterialPrice: (data) => client.post('/pm/material-prices', data),
  deleteMaterialPrice: (id) => client.delete(`/pm/material-prices/${id}`)
};

export default pm;
