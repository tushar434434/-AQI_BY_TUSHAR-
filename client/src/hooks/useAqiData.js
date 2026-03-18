import { useState, useEffect, useCallback } from 'react';
import { getAqiByCoords } from '../services/api';

export const useAqiData = (lat, lon) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (lat === null || lon === null) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAqiByCoords(lat, lon);
      if (response.list && response.list.length > 0) {
        setData(response.list[0]);
      } else {
        setError('No AQI data found for this location');
      }
    } catch (err) {
      setError(err.message || 'Error fetching AQI data');
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
