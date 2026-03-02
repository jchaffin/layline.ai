declare global {
  interface Window {
    google: typeof google;
  }

  namespace google {
    namespace maps {
      namespace places {
        enum PlacesServiceStatus {
          OK = 'OK',
          ZERO_RESULTS = 'ZERO_RESULTS',
          OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
          REQUEST_DENIED = 'REQUEST_DENIED',
          INVALID_REQUEST = 'INVALID_REQUEST',
          NOT_FOUND = 'NOT_FOUND',
          UNKNOWN_ERROR = 'UNKNOWN_ERROR'
        }

        interface AutocompletePrediction {
          description: string;
          place_id: string;
          structured_formatting: {
            main_text: string;
            secondary_text: string;
          };
          terms: Array<{
            offset: number;
            value: string;
          }>;
          types: string[];
        }

        interface AutocompletionRequest {
          input: string;
          types?: string[];
          componentRestrictions?: {
            country: string | string[];
          };
          bounds?: google.maps.LatLngBounds;
          radius?: number;
          location?: google.maps.LatLng;
          offset?: number;
          origin?: google.maps.LatLng;
          strictBounds?: boolean;
          sessionToken?: google.maps.places.AutocompleteSessionToken;
        }

        interface AutocompleteSessionToken {}

        class AutocompleteService {
          constructor();
          getPlacePredictions(
            request: AutocompletionRequest,
            callback: (
              predictions: AutocompletePrediction[] | null,
              status: PlacesServiceStatus
            ) => void
          ): void;
        }

        class AutocompleteSuggestion {
          static searchByText(
            request: SearchByTextRequest
          ): Promise<SearchByTextResponse>;
        }

        interface SearchByTextRequest {
          textQuery: string;
          fields?: string[];
          includedType?: string;
          maxResultCount?: number;
          regionCode?: string;
          locationBias?: {
            circle?: {
              center: { lat: number; lng: number };
              radius: number;
            };
            rectangle?: {
              low: { lat: number; lng: number };
              high: { lat: number; lng: number };
            };
          };
        }

        interface SearchByTextResponse {
          places: PlaceResult[];
        }

        interface PlaceResult {
          id: string;
          displayName: {
            text: string;
            languageCode: string;
          };
          formattedAddress: string;
          location: {
            latitude: number;
            longitude: number;
          };
          types: string[];
        }
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      class LatLngBounds {
        constructor(sw?: LatLng, ne?: LatLng);
        extend(point: LatLng): LatLngBounds;
        contains(latLng: LatLng): boolean;
      }
    }
  }
}

export {};
