import { useState, useCallback } from 'react';
import { api } from '../services/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message || 'Ошибка');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, request, setError };
}

export { api };
