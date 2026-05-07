/**
 * MCMS API Client - Vehicle Rental & Equipment Contracts
 */

window.vehicleRentalsApi = {
  /**
   * List all vehicle contracts with filters
   */
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/v1/vehicle-rentals?${query}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return await res.json();
  },

  /**
   * Create a new vehicle contract
   */
  async create(data) {
    const res = await fetch('/api/v1/vehicle-rentals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Approve a vehicle contract
   */
  async approve(id, data = {}) {
    const res = await fetch(`/api/v1/vehicle-rentals/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Reject a vehicle contract
   */
  async reject(id, data = {}) {
    const res = await fetch(`/api/v1/vehicle-rentals/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Renew a rental contract
   */
  async renew(id, data) {
    const res = await fetch(`/api/v1/vehicle-rentals/${id}/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Shift a vehicle to another project
   */
  async shift(id, data) {
    const res = await fetch(`/api/v1/vehicle-rentals/${id}/shift`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Mark a vehicle as returned
   */
  async markReturned(id, returnDate) {
    const res = await fetch(`/api/v1/vehicle-rentals/${id}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ returnDate })
    });
    return await res.json();
  },

  /**
   * Get equipment price configurations
   */
  async getPriceConfigs() {
    const res = await fetch('/api/v1/vehicle-rentals/config', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return await res.json();
  },

  /**
   * Update equipment price configuration
   */
  async updatePriceConfig(data) {
    const res = await fetch('/api/v1/vehicle-rentals/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  /**
   * Get equipment gap analysis for a project
   */
  async getGapAnalysis(projectId) {
    const res = await fetch(`/api/v1/road-estimation/${projectId}/equipment-gap`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return await res.json();
  }
};
