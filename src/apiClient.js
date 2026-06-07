const parseResponse = async (response) => {
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
};

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiClient = {
  async get(path) {
    const response = await fetch(path, {
      headers: getHeaders(),
    });
    return parseResponse(response);
  },

  async post(path, body) {
    const response = await fetch(path, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return parseResponse(response);
  },

  async patch(path, body) {
    const response = await fetch(path, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return parseResponse(response);
  },

  async delete(path) {
    const response = await fetch(path, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return parseResponse(response);
  },
};
