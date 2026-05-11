const http = require('http');
const budgetChangesController = require('../src/controllers/budgetChanges.controller');

const req = {
  url: '/api/v1/budget-changes',
  method: 'GET',
  headers: {
    authorization: 'Bearer ' + require('../src/utils/jwt').generateToken({id: 1, role: 'Finance_Director'})
  }
};

const res = new http.ServerResponse(req);
res.assignSocket(new (require('net').Socket)());
res.end = function(data) {
  console.log('RESPONSE END CALLED:');
  console.log(data);
};
res.writeHead = function(statusCode, headers) {
  console.log('RESPONSE WRITE HEAD:', statusCode, headers);
};

(async () => {
  try {
    await budgetChangesController.getAll(req, res);
    console.log('Finished');
  } catch(e) {
    console.error('CAUGHT ERROR:');
    console.error(e);
  }
})();
