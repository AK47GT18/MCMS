/**
 * Contract Versions API Module
 * Track amendments and variations
 */

import client from './client.js';

const contractVersions = {
  /**
   * Get versions for a specific contract
   */
  async getByContract(contractId) {
    return await client.get(`/contracts/${contractId}/versions`);
  },

  /**
   * Create new version (amendment/variation)
   */
  async create(contractId, versionData) {
    return await client.post(`/contracts/${contractId}/versions`, versionData);
  },
};

export default contractVersions;
