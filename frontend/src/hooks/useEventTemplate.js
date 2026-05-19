import { useCallback } from 'react';

// Simple wrapper hook for event template API interactions.
// In a real production environment, replace with proper error handling and auth.
export function useEventTemplate() {
  const fetchTemplate = useCallback(async (eventId) => {
    try {
      const res = await fetch(`/api/event-types/${eventId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch template: ${res.status}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(err);
      // Return a fallback placeholder to keep UI functional.
      return null;
    }
  }, []);

  const saveTemplate = useCallback(async (eventId, payload) => {
    try {
      const res = await fetch(`/api/event-types/${eventId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to save template: ${res.status}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const deleteTemplate = useCallback(async (eventId) => {
    try {
      const res = await fetch(`/api/event-types/${eventId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        throw new Error(`Failed to delete template: ${res.status}`);
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  return { fetchTemplate, saveTemplate, deleteTemplate };
}
