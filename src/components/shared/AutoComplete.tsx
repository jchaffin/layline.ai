'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { Building2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { commonUSCities, filterCities } from '@/lib/googleMapsUtils';

declare global {
  interface Window {
    initGoogleMaps: () => void;
  }
}

// Google Places
interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter location",
  className,
  id,
  onFocus,
  onKeyDown,
  disabled = false,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const tryInit = () => {
      if (serviceRef.current) return;
      if (window.google?.maps?.places?.AutocompleteService) {
        serviceRef.current = new window.google.maps.places.AutocompleteService();
      }
    };

    tryInit();
    if (!serviceRef.current) {
      const poll = setInterval(() => {
        tryInit();
        if (serviceRef.current) clearInterval(poll);
      }, 200);
      return () => clearInterval(poll);
    }
  }, []);

  const fetchSuggestions = (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (serviceRef.current) {
      serviceRef.current.getPlacePredictions(
        {
          input: query,
          types: ['(cities)'],
          componentRestrictions: { country: 'us' },
        },
        (predictions, status) => {
          if (status === 'OK' && predictions && predictions.length > 0) {
            setSuggestions(
              predictions.map((p) => ({
                place_id: p.place_id,
                description: p.description,
                structured_formatting: p.structured_formatting
                  ? { main_text: p.structured_formatting.main_text, secondary_text: p.structured_formatting.secondary_text }
                  : undefined,
              })),
            );
            setShowSuggestions(true);
            setSelectedIndex(-1);
          } else {
            fallbackSuggestions(query);
          }
        },
      );
    } else {
      fallbackSuggestions(query);
    }
  };

  const fallbackSuggestions = (query: string) => {
    const cities = filterCities(query);
    if (cities.length > 0) {
      setSuggestions(
        cities.map((c) => ({
          place_id: c,
          description: c,
          structured_formatting: {
            main_text: c.split(',')[0],
            secondary_text: c.split(',').slice(1).join(',').trim(),
          },
        })),
      );
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    fetchSuggestions(v);
  };

  const handleSelect = (suggestion: GooglePlacePrediction) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    onSelect?.(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      onKeyDown?.(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[selectedIndex]);
        } else {
          onKeyDown?.(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        onKeyDown?.(e);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          onFocus?.(e);
          if (value && value.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("w-full", className)}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={cn(
                "px-4 py-2 cursor-pointer text-sm",
                "hover:bg-blue-50 dark:hover:bg-blue-900 border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                selectedIndex === index && "bg-blue-100 dark:bg-blue-800",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(suggestion)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </span>
                  {suggestion.structured_formatting?.secondary_text && (
                    <span className="text-gray-500 text-xs ml-1">
                      {suggestion.structured_formatting.secondary_text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// GOOGLE MAPS AUTOCOMPLETE
interface GoogleMapsAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (place: any) => void;
    placeholder?: string;
    className?: string;
    id?: string;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

// Simple autocomplete using predefined city list
export function GoogleMapsAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter location",
  className,
  id,
  onFocus,
  onKeyDown,
  disabled = false,
  }: GoogleMapsAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Show suggestions based on input
    if (newValue.length >= 2) {
    const filtered = filterCities(newValue);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };


  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      onKeyDown?.(e);
      return
    }
    switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        break;
    case 'ArrowUp':
     e.preventDefault();
     setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
     break;
    case 'Enter':
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[selectedIndex]);
      }
      break;
    case 'Escape':
      setShowSuggestions(false);
      setSelectedIndex(-1);
      break;
    default:
      onKeyDown?.(e);
    }
  };

  const handleBlur = () => {
      // Delay hiding suggestions to allow clicking
      setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      }, 150);
  };

  return (
      <div className="relative">
      <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn("enhanced-form-field", className)}
          id={id}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
          autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
              <div
              key={suggestion}
              className={cn(
                  "px-3 py-2 cursor-pointer text-sm hover:bg-gray-50",
                  index === selectedIndex && "bg-blue-50 text-blue-700"
              )}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onClick={() => handleSuggestionClick(suggestion)}
              >
              {suggestion}
              </div>
          ))}
          </div>
      )}
      </div>
  );
}

// Simple location parsing from common format "City, State"
export function parseLocationString(location: string): {
  city: string;
  state: string;
  formatted: string;
} {
  const parts = location.split(',').map(p => p.trim());

  return {
    city: parts[0] || '',
    state: parts[1] || '',
    formatted: location
  };
}

// COLLEGE SCORECARD
interface Institution {
  id: string;
  name: string;
  city: string;
  state: string;
  location: string;
  ownership: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface CollegeScorecardAutocompleteProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onLocationChange?: (location: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export function CollegeScorecardAutocomplete({
  id,
  placeholder = "Start typing institution name...",
  value,
  onChange,
  onLocationChange,
  onFocus,
  onKeyDown,
  className,
}: CollegeScorecardAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounced search
  useEffect(() => {
    if (value.length < 2) {
      setInstitutions([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/education/college-scorecard?query=${encodeURIComponent(value)}`);
        const data = await response.json();
        
        if (data.institutions) {
          setInstitutions(data.institutions);
          setIsOpen(data.institutions.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching institutions:', error);
        setInstitutions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    if (!isOpen || institutions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < institutions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : institutions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < institutions.length) {
          const selected = institutions[selectedIndex];
          handleInstitutionSelect(selected);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const parseInstitutionName = (name: string) => {
    // Handle cases like "University of California-Los Angeles"
    // Split on dash and extract main institution and location
    const dashIndex = name.lastIndexOf('-');
    if (dashIndex > 0) {
      const mainInstitution = name.substring(0, dashIndex).trim();
      const location = name.substring(dashIndex + 1).trim();
      return { institution: mainInstitution, location };
    }
    
    // Handle cases like "University of California, Los Angeles"
    const commaIndex = name.lastIndexOf(',');
    if (commaIndex > 0) {
      const mainInstitution = name.substring(0, commaIndex).trim();
      const location = name.substring(commaIndex + 1).trim();
      return { institution: mainInstitution, location };
    }
    
    // Default: use full name as institution
    return { institution: name, location: '' };
  };

  const handleInstitutionSelect = (institution: Institution) => {
    const parsed = parseInstitutionName(institution.name);
    
    // Set the institution name
    onChange(parsed.institution);
    
    // If we have a location and the callback exists, set it
    if (parsed.location && onLocationChange) {
      onLocationChange(`${parsed.location}, ${institution.state || ''}`);
    } else if (institution.location && onLocationChange) {
      // Fallback to the institution's city/state if no parsed location
      onLocationChange(institution.location);
    }
    
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          if (onFocus) onFocus(e);
          if (institutions.length > 0) setIsOpen(true);
        }}
        className={className}
        autoComplete="off"
      />

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Searching institutions...
            </div>
          ) : institutions.length > 0 ? (
            <ul ref={listRef} className="py-1">
              {institutions.map((institution, index) => (
                <li
                  key={institution.id || `institution-${index}`}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900 border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleInstitutionSelect(institution)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {institution.name}
                        </span>
                      </div>
                      {institution.location && (
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {institution.location}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-xs flex-shrink-0"
                    >
                      {institution.ownership}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
              No institutions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

