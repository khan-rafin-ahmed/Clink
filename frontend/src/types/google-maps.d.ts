declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setPosition(latLng: LatLng | LatLngLiteral): void;
    getPosition(): LatLng;
    setMap(map: Map | null): void;
    addListener(event: string, callback: () => void): void;
  }

  class Geocoder {
    constructor();
    geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }

  interface MarkerOptions {
    position: LatLng | LatLngLiteral;
    map?: Map;
    animation?: Animation;
    draggable?: boolean;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: MapTypeStyler[];
  }

  interface MapTypeStyler {
    [key: string]: any;
  }

  interface GeocoderRequest {
    address?: string;
    location?: LatLng | LatLngLiteral;
    placeId?: string;
  }

  interface GeocoderResult {
    address_components?: AddressComponent[];
    formatted_address?: string;
    geometry?: {
      location?: LatLng;
      location_type?: string;
      viewport?: {
        northeast: LatLng;
        southwest: LatLng;
      };
    };
    place_id?: string;
    types?: string[];
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  enum GeocoderStatus {
    OK = 'OK',
    ZERO_RESULTS = 'ZERO_RESULTS',
    OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
    REQUEST_DENIED = 'REQUEST_DENIED',
    INVALID_REQUEST = 'INVALID_REQUEST',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
  }

  enum Animation {
    BOUNCE = 1,
    DROP = 2
  }

  namespace places {
    class Autocomplete {
      constructor(
        inputField: HTMLInputElement,
        opts?: {
          types?: string[];
          fields?: string[];
        }
      );
      addListener(event: string, callback: () => void): void;
      getPlace(): PlaceResult;
    }

    class PlaceAutocompleteElement {
      constructor(options: {
        input: HTMLInputElement;
        options?: {
          types?: string[];
          componentRestrictions?: {
            country: string;
          };
        };
      });
      addListener(event: string, callback: () => void): void;
      getPlace(): PlaceResult;
    }

    interface PlaceResult {
      geometry?: {
        location?: LatLng;
      };
      place_id?: string;
      formatted_address?: string;
      name?: string;
    }
  }

  namespace event {
    function clearInstanceListeners(instance: any): void;
  }
} 