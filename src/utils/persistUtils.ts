import { persistor } from '../store';

/**
 * Utility functions for Redux Persist debugging and management
 */

/**
 * Clear all persisted data
 */
export const clearPersistedData = () => {
  return persistor.purge();
};

/**
 * Flush pending writes to storage
 */
export const flushPersistedData = () => {
  return persistor.flush();
};

/**
 * Get current persistence state
 */
export const getPersistState = () => {
  return persistor.getState();
};

/**
 * Pause persistence
 */
export const pausePersistence = () => {
  persistor.pause();
};

/**
 * Resume persistence
 */
export const resumePersistence = () => {
  persistor.persist();
};

/**
 * Debug: Log current persisted state
 */
export const debugPersistedState = () => {
  const state = persistor.getState();
  console.log('Redux Persist State:', {
    bootstrapped: state.bootstrapped,
    keys: Object.keys(state),
  });
  
  // Try to get the actual persisted data from localStorage
  try {
    const persistedData = localStorage.getItem('persist:root');
    if (persistedData) {
      console.log('Persisted Data (raw):', persistedData);
      console.log('Persisted Data (parsed):', JSON.parse(persistedData));
    }
  } catch (error) {
    console.error('Error reading persisted data:', error);
  }
};