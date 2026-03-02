// Google Maps utility functions and type definitions

export interface PlaceResult {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location?: {
      lat(): number;
      lng(): number;
    };
  };
  name?: string;
}

export interface LocationData {
  city: string;
  state: string;
  country: string;
  formatted: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Utility to extract structured location data from Google Places result
export function parseLocationFromPlace(place: PlaceResult): LocationData {
  const components = place.address_components || [];
  
  let city = '';
  let state = '';
  let country = '';

  components.forEach(component => {
    const types = component.types;
    
    if (types.includes('locality')) {
      city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name;
    } else if (types.includes('country')) {
      country = component.short_name;
    }
    // Handle cases where city is not in locality (some international addresses)
    else if (!city && types.includes('sublocality')) {
      city = component.long_name;
    }
  });

  const formatted = place.formatted_address || `${city}, ${state}`.replace(/^,\s*|\s*,$/, '');
  
  const coordinates = place.geometry?.location ? {
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng()
  } : undefined;

  return {
    city,
    state,
    country,
    formatted,
    coordinates
  };
}

// Common US cities for fallback autocomplete
export const commonUSCities = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Jose, CA',
  'Austin, TX',
  'Jacksonville, FL',
  'San Francisco, CA',
  'Columbus, OH',
  'Charlotte, NC',
  'Fort Worth, TX',
  'Indianapolis, IN',
  'Seattle, WA',
  'Denver, CO',
  'Boston, MA',
  'El Paso, TX',
  'Nashville, TN',
  'Detroit, MI',
  'Oklahoma City, OK',
  'Portland, OR',
  'Las Vegas, NV',
  'Memphis, TN',
  'Louisville, KY',
  'Baltimore, MD',
  'Milwaukee, WI',
  'Atlanta, GA',
  'Miami, FL',
  'Remote'
];

// Filter cities based on input
export function filterCities(input: string): string[] {
  if (input.length < 2) return [];
  
  const lowercaseInput = input.toLowerCase();
  return commonUSCities.filter(city => 
    city.toLowerCase().includes(lowercaseInput)
  ).slice(0, 10); // Limit to 10 suggestions
}