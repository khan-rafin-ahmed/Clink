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
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
  }

  interface MarkerOptions {
    position: LatLng | LatLngLiteral;
    map?: Map;
    animation?: Animation;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: MapTypeStyler[];
  }

  interface MapTypeStyler {
    [key: string]: any;
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