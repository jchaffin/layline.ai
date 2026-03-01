"use client"

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

// Use global Google Maps types from google-maps.d.ts

interface LocationData {
  city?: string;
  state?: string;
  zipCode?: string;
}

interface SimpleLocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  required?: boolean;
  showDetailedFields?: boolean;
  locationData?: LocationData;
  onLocationDataChange?: (data: LocationData) => void;
}

// Common US cities for autocomplete suggestions
const commonLocations = [
  "Remote",
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
  "Austin, TX",
  "Jacksonville, FL",
  "Fort Worth, TX",
  "Columbus, OH",
  "Charlotte, NC",
  "San Francisco, CA",
  "Indianapolis, IN",
  "Seattle, WA",
  "Denver, CO",
  "Washington, DC",
  "Boston, MA",
  "El Paso, TX",
  "Nashville, TN",
  "Detroit, MI",
  "Oklahoma City, OK",
  "Portland, OR",
  "Las Vegas, NV",
  "Memphis, TN",
  "Louisville, KY",
  "Baltimore, MD",
  "Milwaukee, WI",
  "Albuquerque, NM",
  "Tucson, AZ",
  "Fresno, CA",
  "Mesa, AZ",
  "Sacramento, CA",
  "Atlanta, GA",
  "Kansas City, MO",
  "Colorado Springs, CO",
  "Miami, FL",
  "Raleigh, NC",
  "Omaha, NE",
  "Long Beach, CA",
  "Virginia Beach, VA",
  "Oakland, CA",
  "Minneapolis, MN",
  "Tulsa, OK",
  "Arlington, TX",
  "Tampa, FL"
];

// US States abbreviations
const usStates = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
];

export function SimpleLocationInput({ 
  value, 
  onChange, 
  placeholder = "Enter location...", 
  label,
  id,
  required = false,
  showDetailedFields = false,
  locationData = {},
  onLocationDataChange
}: SimpleLocationInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stateSuggestions, setStateSuggestions] = useState<typeof usStates>([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  const [isLoadingGoogleMaps, setIsLoadingGoogleMaps] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);

  // Initialize Google Maps Places API
  useEffect(() => {
    const initializeGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        console.log('Google Maps API already loaded');
        return;
      }

      if (isLoadingGoogleMaps) return;
      setIsLoadingGoogleMaps(true);

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script already exists, waiting for load...');
        setIsLoadingGoogleMaps(false);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      console.log('Full API Key check:', { 
        found: !!apiKey, 
        length: apiKey?.length || 0,
        key: apiKey || 'undefined',
        allEnvVars: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
      });
      
      if (!apiKey) {
        console.warn('Google Maps API key not found, falling back to static suggestions');
        setIsLoadingGoogleMaps(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        console.log('Google Maps script loaded');
        if (window.google && window.google.maps && window.google.maps.places) {
          try {
            // Check for new AutocompleteSuggestion API first
            if (window.google.maps.places.AutocompleteSuggestion) {
              console.log('Google Maps AutocompleteSuggestion API available');
            } else if (window.google.maps.places.AutocompleteService) {
              autocompleteService.current = new window.google.maps.places.AutocompleteService();
              console.log('Google Maps AutocompleteService initialized successfully');
            }
          } catch (error) {
            console.warn('Failed to initialize Places API:', error);
          }
        }
        setIsLoadingGoogleMaps(false);
      };
      script.onerror = (error) => {
        console.warn('Google Maps script failed to load, using fallback autocomplete');
        setIsLoadingGoogleMaps(false);
      };
      document.head.appendChild(script);
    };

    initializeGoogleMaps();
  }, []);

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue);

    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // If user types "Remote" or similar, prioritize this option
    if (inputValue.toLowerCase().includes('remote')) {
      setSuggestions(["Remote"]);
      setShowSuggestions(true);
      return;
    }

    // Get Google Maps autocomplete suggestions first if available
    if (inputValue.length > 2) {
      try {
        // Use new AutocompleteSuggestion API if available
        if (window.google?.maps?.places?.AutocompleteSuggestion) {
          console.log('Using Google Maps AutocompleteSuggestion for:', inputValue);
          
          const request = {
            textQuery: inputValue,
            fields: ['id', 'displayName', 'formattedAddress'],
            includedType: 'locality',
            maxResultCount: 6,
            regionCode: 'US'
          };

          const response = await window.google.maps.places.AutocompleteSuggestion.searchByText(request);
          
          if (response.places && response.places.length > 0) {
            const googleSuggestions = response.places.map(place => place.formattedAddress).slice(0, 6);
            setSuggestions(googleSuggestions);
            setShowSuggestions(true);
            console.log('AutocompleteSuggestion response:', response.places.length);
          } else {
            console.log('AutocompleteSuggestion no results, using fallback');
            fallbackToCommonLocations(inputValue);
          }
        } 
        // Fallback to legacy AutocompleteService
        else if (autocompleteService.current) {
          console.log('Using Google Maps AutocompleteService for:', inputValue);
          autocompleteService.current.getPlacePredictions(
            {
              input: inputValue,
              types: ['(cities)'],
              componentRestrictions: { country: 'us' }
            },
            (predictions, status) => {
              console.log('Google Maps response:', status, predictions?.length || 0);
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                const googleSuggestions = predictions.map(prediction => prediction.description).slice(0, 6);
                setSuggestions(googleSuggestions);
                setShowSuggestions(true);
              } else {
                console.log('Google Maps failed, using fallback');
                fallbackToCommonLocations(inputValue);
              }
            }
          );
        } else {
          console.log('Using fallback locations for:', inputValue);
          fallbackToCommonLocations(inputValue);
        }
      } catch (error) {
        console.warn('Places API failed:', error);
        fallbackToCommonLocations(inputValue);
      }
    } else {
      console.log('Using fallback locations for short input:', inputValue);
      fallbackToCommonLocations(inputValue);
    }
  };

  const fallbackToCommonLocations = (inputValue: string) => {
    console.log('Using fallback autocomplete for:', inputValue);
    // Filter common locations based on input - more intelligent matching
    const query = inputValue.toLowerCase().trim();
    
    let filtered = commonLocations.filter(location => {
      const locationLower = location.toLowerCase();
      // Match beginning of city name or state
      return locationLower.startsWith(query) || 
             locationLower.includes(`, ${query}`) || // state abbreviation
             locationLower.includes(query);
    });

    // Sort by relevance - exact matches first, then starts with, then contains
    filtered = filtered.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1;
      if (!aLower.startsWith(query) && bLower.startsWith(query)) return 1;
      
      return a.localeCompare(b);
    }).slice(0, 8);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleStateInputChange = (inputValue: string) => {
    if (!onLocationDataChange) return;
    
    onLocationDataChange({ ...locationData, state: inputValue });

    if (!inputValue.trim()) {
      setStateSuggestions([]);
      setShowStateSuggestions(false);
      return;
    }

    // Filter states based on input (by code or name)
    const filtered = usStates.filter(state =>
      state.code.toLowerCase().includes(inputValue.toLowerCase()) ||
      state.name.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 8);

    setStateSuggestions(filtered);
    setShowStateSuggestions(filtered.length > 0);
  };

  const handleStateSelect = (state: typeof usStates[0]) => {
    if (!onLocationDataChange) return;
    
    onLocationDataChange({ ...locationData, state: state.code });
    setStateSuggestions([]);
    setShowStateSuggestions(false);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
      setShowStateSuggestions(false);
    }, 200);
  };

  if (showDetailedFields) {
    return (
      <div className="space-y-4">
        {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}
        
        {/* City Field */}
        <div className="relative">
          <Label htmlFor={`${id}-city`} className="text-sm text-gray-600">City</Label>
          <div className="relative mt-1">
            <Input
              id={`${id}-city`}
              value={locationData.city}
              onChange={(e) => onLocationDataChange?.({ ...locationData, city: e.target.value })}
              placeholder="Enter city"
              required={required}
              className="pl-10"
            />
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* State Field */}
        <div className="relative">
          <Label htmlFor={`${id}-state`} className="text-sm text-gray-600">State</Label>
          <div className="relative mt-1">
            <Input
              id={`${id}-state`}
              value={locationData.state}
              onChange={(e) => handleStateInputChange(e.target.value)}
              onBlur={handleBlur}
              onFocus={() => locationData.state?.trim() && stateSuggestions.length > 0 && setShowStateSuggestions(true)}
              placeholder="State (e.g., CA, NY)"
              required={required}
              maxLength={2}
              className="uppercase"
            />
            
            {/* State suggestions dropdown */}
            {showStateSuggestions && stateSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto location-suggestions">
                {stateSuggestions.map((state) => (
                  <button
                    key={state.code}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    onClick={() => handleStateSelect(state)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{state.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{state.code}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zip Code Field */}
        <div>
          <Label htmlFor={`${id}-zip`} className="text-sm text-gray-600">Zip Code</Label>
          <Input
            id={`${id}-zip`}
            value={locationData.zipCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              onLocationDataChange?.({ ...locationData, zipCode: value });
            }}
            placeholder="12345"
            maxLength={5}
            className="mt-1 font-mono"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => {
            if (value.trim() && suggestions.length > 0) {
              setShowSuggestions(true);
            } else if (value.trim()) {
              // Trigger suggestions if user has typed something
              handleInputChange(value);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          autoComplete="off"
        />
        <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        
        {/* Loading indicator */}
        {isLoadingGoogleMaps && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto location-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-gray-700 focus:outline-none border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors cursor-pointer"
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur event
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* No results message when user has typed but no suggestions found */}
      {showSuggestions && suggestions.length === 0 && value.trim().length > 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            No locations found. Try typing a city name.
          </div>
        </div>
      )}
    </div>
  );
}