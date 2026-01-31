/**
 * API Client Integration Tests - Base Client
 * Tests for the core HTTP client functionality
 */

import { client } from '../src/api/client.js';
import { NetworkError, AuthenticationError, ValidationError } from '../src/api/errors.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client - Base Client', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  test('Makes successful GET requests', async () => {
    const mockResponse = { data: { id: 1, name: 'Test' }, success: true };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await client.get('/users/1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockResponse);
  });

  test('Makes successful POST requests with JSON body', async () => {
    const mockResponse = { data: { id: 2, name: 'John' }, success: true };
    const payload = { name: 'John', email: 'john@test.com' };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await client.post('/users', payload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('Attaches Authorization header when token present', async () => {
    localStorage.setItem('mcms_auth_token', 'test-token-123');

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    });

    await client.get('/users/me');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123',
        }),
      })
    );
  });

  test('Handles network errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(client.get('/users')).rejects.toThrow(NetworkError);
  });

  test('Transforms HTTP errors to custom error classes', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Invalid token' }),
    });

    await expect(client.get('/protected')).rejects.toThrow(AuthenticationError);
  });

  test('Retries failed requests with exponential backoff', async () => {
    // First two attempts fail, third succeeds
    fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

    const result = await client.get('/users');

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ success: true });
  });

  test('Respects request timeout', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 35000))
    );

    await expect(
      client.get('/slow-endpoint', { timeout: 1000 })
    ).rejects.toThrow('timeout');
  }, 10000);

  test('Normalizes response data structure', async () => {
    const mockData = { id: 1, name: 'Test' };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const result = await client.get('/users/1');
    expect(result).toEqual(mockData);
  });
});
