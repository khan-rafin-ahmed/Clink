/**
 * Google Maps API Loader
 * Dynamically loads the Google Maps JavaScript API with the API key from environment variables
 */

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Loads the Google Maps JavaScript API
 * @returns Promise that resolves when the API is loaded
 */
export function loadGoogleMapsAPI(): Promise<void> {
  // If already loaded, return resolved promise
  if (isLoaded) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.warn('Google Maps API key is not configured. Location features will not work.');
      reject(new Error('Google Maps API key is not configured'));
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = (error) => {
      isLoading = false;
      console.error('Failed to load Google Maps API:', error);
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add script to document head
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Checks if Google Maps API is loaded
 * @returns boolean indicating if the API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return !!(isLoaded && (window as any).google && (window as any).google.maps && (window as any).google.maps.places);
}

/**
 * Waits for Google Maps API to be available
 * @param timeout Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise that resolves when API is available
 */
export function waitForGoogleMaps(timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isGoogleMapsLoaded()) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for Google Maps API'));
      }
    }, 100);
  });
}
