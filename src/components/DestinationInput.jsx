import { Autocomplete } from "@react-google-maps/api";
import { useRef, useState, useEffect } from "react";

export default function DestinationInput({ 
  value, 
  onChange, 
  useGooglePlaces = false,
  onPlaceSelect, // New prop for full place data
  apiKey, // Pass API key as prop
  className = "" // Additional className
}) {
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || "");
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Sync input value with parent value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handlePlaceChanged = () => {
    try {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        setInputValue(place.formatted_address);
        onChange?.(place.formatted_address);
        onPlaceSelect?.(place); // Pass full place data to parent
        
        // Add this console log
        console.log("Destination place selected:", {
          name: place.name,
          address: place.formatted_address,
          location: place.geometry?.location
        });
      }
    } catch (error) {
      console.error("Error handling place selection:", error);
      setApiError("Failed to get place details");
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!useGooglePlaces) {
      onChange?.(e.target.value);
    }
  };

  if (useGooglePlaces) {
    return (
      <div className={`mb-6 ${className}`}>
        <label className="block mb-2 font-medium">Where would you like to go?</label>
        <div className="flex items-center border border-gray-600 dark:border-gray-300 rounded-lg p-3 bg-[#1c1c1e] dark:bg-white relative">
          <span className="mr-2 text-gray-400">📍</span>
          
          {!apiLoaded && !apiError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <span className="text-sm">Loading places...</span>
            </div>
          )}
          
          {apiError ? (
            <input
              type="text"
              className="flex-1 bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-white dark:text-black"
              placeholder="Enter Destination (Places API unavailable)"
              value={inputValue}
              onChange={handleInputChange}
            />
          ) : (
            <Autocomplete 
              onLoad={(ref) => {
                autocompleteRef.current = ref;
                setApiLoaded(true);
              }}
              onPlaceChanged={handlePlaceChanged}
              fields={['address_components', 'formatted_address', 'geometry', 'name', 'place_id']}
              options={{
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'us' } // Optional country restriction
              }}
            >
              <input
                type="text"
                className="flex-1 bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-white dark:text-black"
                placeholder="Enter Destination"
                value={inputValue}
                onChange={handleInputChange}
                disabled={!apiLoaded}
              />
            </Autocomplete>
          )}
        </div>
        
        {apiError && (
          <p className="mt-1 text-sm text-red-500">
            Google Places API error: {apiError}. Falling back to regular input.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <label className="block mb-2 font-medium">Where would you like to go?</label>
      <div className="flex items-center border border-gray-600 dark:border-gray-300 rounded-lg p-3 bg-[#1c1c1e] dark:bg-white">
        <span className="mr-2 text-gray-400">📍</span>
        <input
          type="text"
          className="flex-1 bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-white dark:text-black"
          placeholder="Enter Destination"
          value={inputValue}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}