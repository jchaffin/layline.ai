interface GoogleMapsGeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    place_id: string;
  }>;
  status: string;
}

interface LocationData {
  formatted_address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  place_id: string;
}

export async function geocodeLocation(address: string): Promise<LocationData | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found');
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GoogleMapsGeocodingResponse = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn(`Geocoding failed for address: ${address}. Status: ${data.status}`);
      return null;
    }

    const result = data.results[0];
    const { geometry, formatted_address, address_components, place_id } = result;

    // Extract city and state from address components
    let city = '';
    let state = '';
    let country = '';

    for (const component of address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (component.types.includes('country')) {
        country = component.long_name;
      }
    }

    return {
      formatted_address,
      latitude: geometry.location.lat,
      longitude: geometry.location.lng,
      city,
      state,
      country,
      place_id
    };
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
}

export async function enhanceInstitutionLocation(institutionName: string, currentLocation?: string): Promise<LocationData | null> {
  // Create a more specific search query for educational institutions
  const searchQuery = currentLocation 
    ? `${institutionName}, ${currentLocation}`
    : `${institutionName} university college`;
    
  return await geocodeLocation(searchQuery);
}

export async function validateAndStandardizeAddress(address: string): Promise<LocationData | null> {
  return await geocodeLocation(address);
}