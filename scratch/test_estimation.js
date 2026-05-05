const service = require('../src/services/roadEstimation.service');
const logger = require('../src/utils/logger');

async function test() {
  try {
    console.log('Testing calculateEstimate...');
    const input = {
      roadType: 'RT-3',
      lengthKm: 10,
      widthM: 6.5,
      terrain: 'Rolling',
      nearestTownKm: 20,
      accessories: ['markings', 'signage']
    };
    
    const result = await service.calculateEstimate(input);
    console.log('Success!');
    console.log('Estimated Total High:', result.estimatedTotalHigh);
    console.log('Accessories count:', result.accessories.length);
  } catch (err) {
    console.error('Test failed!');
    console.error(err);
    process.exit(1);
  }
}

test();
