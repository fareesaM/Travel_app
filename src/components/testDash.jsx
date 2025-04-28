
import { useEffect, useState } from "react";

export default function Dashboard({destinationData, googleApiKey, days, companions, startDate, endDate}) {
const TRAVELPAYOUTS_API_TOKEN = "e4b79bb2e9710e40ae0875168f921324"; 

  const [tripData, setTripData] = useState({
    location: "",
    coordinates: null,
    dates: "",
    days: 0,
    companions: 0,
    flight: {
      date: "",
      route: "",
      airports: "",
      details: null
    },
    accommodations: [],
    activities: [],
    nearbyPlaces: [],
    flights: []

  });
  const [selectedDay, setSelectedDay] = useState(1);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [placeType, setPlaceType] = useState("lodging");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [originAirport, setOriginAirport] = useState("DEL"); 


  
  useEffect(() => {
    if (destinationData && destinationData.geometry) {
      const newLocation = destinationData.name || destinationData.formatted_address || "Unknown Location";
      const lat = destinationData.geometry.location.lat();
      const lng = destinationData.geometry.location.lng();
      const coords = `${lat.toFixed(4)},${lng.toFixed(4)}`;

      // Try to extract destination airport code from location name
      const destAirport = extractAirportCode(newLocation) || "NRT"; 

      setTripData(prev => ({
        ...prev,
        location: newLocation,
        coordinates: coords,
        days: days || 0,
        companions: companions || 0,
        dates: startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : "",
        activities: generateSampleActivities(newLocation),
        flight: {
          ...prev.flight,
          date: startDate ? formatDate(startDate, true) : "",
          route: `${originAirport} ➔ ${destAirport}`,
          airports: `Delhi, India ➔ ${destinationData.formatted_address || "Destination"}`
        }
      }));

      setBackgroundImage(getLocationBackground(newLocation));
      fetchNearbyPlaces(lat, lng);
      
      // Fetch flights only if we have valid dates
      if (startDate) {
        fetchFlights(originAirport, destAirport, startDate);
      }
    }
  }, [destinationData, days, companions, startDate, endDate, placeType, originAirport]);

  const extractAirportCode = (location) => {
    const airportCodes = location.match(/\b[A-Z]{3}\b/g);
    return airportCodes ? airportCodes[0] : null;
  };

  // Helper to format dates
  const formatDate = (dateString, withTime = false) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // Return original if invalid
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (!withTime) {
      return `${day}.${month}.${year}`;
    }
    
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'pm' : 'am';
    
    return `${day}.${month}.${year}, ${hours}:${minutes} ${ampm}`;
  };
  const fetchFlights = async (origin, destination, date) => {
    if (!TRAVELPAYOUTS_API_TOKEN) return;
    
    setLoadingFlights(true);
    try {
      // First convert date to YYYY-MM-DD format if it's not already
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      const response = await fetch(
        `https://api.travelpayouts.com/v2/prices/latest?currency=usd&origin=${origin}&destination=${destination}&depart_date=${formattedDate}&token=${TRAVELPAYOUTS_API_TOKEN}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        // Sort flights by price (cheapest first)
        const sortedFlights = data.data.sort((a, b) => a.price - b.price);
        
        setTripData(prev => ({
          ...prev,
          flights: sortedFlights.map(flight => ({
            id: flight.flight_number,
            airline: flight.airline,
            departure: flight.departure_at,
            arrival: flight.return_at || "",
            price: flight.price,
            cityFrom: flight.origin,
            cityTo: flight.destination,
            flightNumber: flight.flight_number,
            duration: flight.duration,
            transfers: flight.transfers
          })),
          // Update flight details with the cheapest option
          flight: {
            ...prev.flight,
            details: sortedFlights[0]
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching flights:", error);
      // You might want to set some error state here to show to the user
    } finally {
      setLoadingFlights(false);
    }
  };

  const getLocationBackground = (location) => {
    const locationImages = {
      "TOKYO": "https://images.unsplash.com/photo-1492571350019-22de08371fd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      "NEW YORK": "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      "PARIS": "https://images.unsplash.com/photo-1431274172761-fca41d930114?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      "UNITED STATES": "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    };
    
    return locationImages[location.toUpperCase()] || 
      "https://images.unsplash.com/photo-1500835556837-99ac94a94552?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80";
  };

  const fetchNearbyPlaces = async (lat, lng) => {
    if (!googleApiKey) return;
    
    setLoadingPlaces(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=${placeType}&key=${googleApiKey}`
      );
      const data = await response.json();
      
      if (data.results) {
        setTripData(prev => ({
          ...prev,
          nearbyPlaces: data.results.map(place => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity,
            rating: place.rating,
            totalRatings: place.user_ratings_total,
            photo: place.photos?.[0]?.photo_reference,
            location: place.geometry?.location
          }))
        }));
      }
    } catch (error) {
      console.error("Error fetching nearby places:", error);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const generateSampleActivities = (location) => {
    const defaultActivities = [
      {
        day: 1,
        date: "27.01.2025",
        list: [
          { 
            title: "Senso-ji Temple & Nakamise Shopping Street", 
            timing: "8:15 am Morning", 
            duration: "3 hours", 
            pickup: "From Hotel", 
            image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
          },
          { 
            title: "Tokyo Sky Tree", 
            timing: "1:00 pm Afternoon", 
            duration: "3 hours", 
            pickup: "From Nakamise Street", 
            image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
          },
          { 
            title: "Kimono Wearing Experience", 
            timing: "Anytime before 8:00pm", 
            duration: "1-2 hours", 
            pickup: "From Hotel", 
            image: "https://images.unsplash.com/photo-1525873020571-08690094e301?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
          }
        ]
      }
    ];

    // Customize activities based on location
    if (location.toUpperCase().includes("UNITED STATES")) {
      defaultActivities[0].list = [
        { 
          title: "Statue of Liberty Tour", 
          timing: "9:00 am Morning", 
          duration: "4 hours", 
          pickup: "From Hotel",
          image: "https://images.unsplash.com/photo-1543716091-a840c05249ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        },
        { 
          title: "Central Park Walk", 
          timing: "2:00 pm Afternoon", 
          duration: "2 hours", 
          pickup: "From Downtown",
          image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        }
      ];
    }

    return defaultActivities;
  };

  const getPlacePhotoUrl = (photoRef) => {
    return photoRef 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${googleApiKey}`
      : 'https://placehold.co/400x200?text=No+Image';
  };

  const mapSrc = tripData.coordinates
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${tripData.coordinates}&zoom=12&size=400x200&maptype=roadmap&markers=color:red%7C${tripData.coordinates}&key=${googleApiKey}`
    : 'https://placehold.co/400x200?text=Map+Not+Available';

  const currentDayData = tripData.activities.find(a => a.day === selectedDay);
console.log(tripData.coordinates)


const FlightDetailsCard = ({ flight }) => {
  if (!flight) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-lg">Flight Details</h4>
        <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
          ${flight.price}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-semibold">{flight.origin}</p>
          <p className="text-sm text-gray-300">
            {new Date(flight.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        <div className="text-center mx-4">
          <div className="text-xs text-gray-400">
            {flight.transfers === 0 ? 'Direct' : `${flight.transfers} stop${flight.transfers > 1 ? 's' : ''}`}
          </div>
          <div className="w-16 h-px bg-gray-500 my-1"></div>
          <div className="text-xs text-gray-400">
            {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-semibold">{flight.destination}</p>
          <p className="text-sm text-gray-300">
            {flight.return_at ? new Date(flight.return_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'One way'}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
        <span className="text-sm">Flight #{flight.flight_number}</span>
        <span className="text-sm">{flight.airline}</span>
      </div>
    </div>
  );
};

const FlightsList = ({ flights }) => {
  if (!flights || flights.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h4 className="text-md font-semibold mb-2">Available Flights</h4>
      <div className="space-y-3">
        {flights.slice(0, 3).map((flight) => (
          <div key={flight.id} className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {flight.cityFrom} → {flight.cityTo}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(flight.departure).toLocaleDateString()} • {flight.airline}
                </p>
              </div>
              <span className="font-bold">${flight.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


  return (
    <div className="min-h-screen  flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#000000] via-[#1c1c1e] to-[#000000] text-white dark:from-[#f9fafb] dark:via-[#f9fafb] dark:to-[#f9fafb] dark:text-black">
      {/* Header with background image */}
      <div 
        className="mt-2 relative h-60 w-full bg-cover bg-center rounded-2xl"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0  bg-opacity-40 flex flex-col justify-end p-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">Hello Chhavi!</h2>
              <p className="text-gray-200">Ready for the trip?</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold">C</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-6">
        {/* Trip Overview */}
        <div>
        
          <h3 className="text-lg font-semibold mb-2">Your Upcoming Trip</h3>
          <img 
              src={mapSrc} 
              alt={tripData.location} 
              className="w-full h-48 object-cover" 
              onError={(e) => (e.target.src = 'https://placehold.co/400x200?text=Map+Not+Available')} 
            />
          <div className="relative rounded-xl overflow-hidden">
           
            <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-4">
              <h1 className="text-3xl font-bold">{tripData.location.split(",")[0]}</h1>
              <p className="text-sm">{tripData.dates}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm mt-2">
          {console.log(tripData.days)}
          <div className="flex items-center gap-1">🗓️ {tripData.days} Days</div>
          <div className="flex items-center gap-1">👥 {tripData.companions} People</div>
          {/* <div className="flex items-center gap-1">🎯 {tripData.activities.reduce((acc, cur) => acc + cur.list.length, 0)} Activities</div> */}
        </div>

       
           {/* Flight Information */}
<div>
  <h3 className="text-lg font-semibold mb-2">Flight Information</h3>
  
  {loadingFlights ? (
    <div className="flex justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-300"></div>
    </div>
  ) : (
    <>
      {/* Basic Flight Info */}
{/* Flight Information */}
<div className="mb-6">


  {loadingFlights ? (
    <div className="flex justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-300"></div>
    </div>
  ) : tripData.flight.details ? (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Flight Date */}
      {tripData.flight.date && (
        <p className="text-gray-300 mb-4">{tripData.flight.date}</p>
      )}

      {/* Flight Route */}
      <div className="flex items-start justify-between">
        {/* Departure */}
        <div className="text-center">
          <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-lg">
              {tripData.flight.details.origin}
            </span>
          </div>
          <p className="text-sm text-gray-300">
            {tripData.flight.airports.split("➔")[0].trim()}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center px-2">
          <div className="relative w-full">
            <div className="border-t-2 border-gray-500 border-dashed absolute top-1/2 w-full"></div>
            <div className="relative flex justify-center">
              <div className="bg-gray-700 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Arrival */}
        <div className="text-center">
          <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-lg">
              {tripData.flight.details.destination}
            </span>
          </div>
          <p className="text-sm text-gray-300">
            {tripData.flight.airports.split("➔")[1].trim()}
          </p>
        </div>
      </div>

      {/* Flight Details */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-400">Flight</p>
            <p>{tripData.flight.details.airline} {tripData.flight.details.flight_number}</p>
          </div>
          <div>
            <p className="text-gray-400">Departure</p>
            <p>{new Date(tripData.flight.details.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <p className="text-gray-400">Duration</p>
            <p>{Math.floor(tripData.flight.details.duration / 60)}h {tripData.flight.details.duration % 60}m</p>
          </div>
          <div>
            <p className="text-gray-400">Price</p>
            <p className="font-bold">${tripData.flight.details.price}</p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
      No flight information available
    </div>
  )}
</div>


    </>
  )}
</div>
       
        {/* Accommodation */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Accommodation</h3>
          {tripData.accommodations.map((hotel, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 mb-3">
              <h4 className="font-bold mb-2">{hotel.name}</h4>
              <div className="flex justify-between text-sm mb-2">
                <p>Check in: {hotel.checkIn}</p>
                <p>Check out: {hotel.checkOut}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm">{hotel.nights}</p>
                <p className={`text-sm ${hotel.status === "Confirmed" ? 'text-green-400' : 'text-yellow-400'}`}>
                  {hotel.status}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Activities */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Activities</h3>
          
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto mb-4">
            {tripData.activities.map((day, idx) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`px-4 py-2 rounded-full ${selectedDay === day.day ? 'bg-yellow-300 text-white' : 'bg-gray-700 text-white'}`}
              >
                {["MON", "TUE", "WED", "THU", "FRI", "SAT"][idx]} {day.date.split(".")[0]}
              </button>
            ))}
          </div>

          {/* Day Info */}
          {currentDayData && (
            <div className="mb-4">
              <div className="flex gap-2 items-center mb-2">
                <span className="bg-yellow-300 text-black px-3 py-1 rounded-full text-xs">Day Plan</span>
                <span className="bg-gray-700 px-3 py-1 rounded-full text-xs">
                  {currentDayData.list.length} Activities
                </span>
              </div>
              <p className="font-bold mb-4">
                Day {currentDayData.day} · {currentDayData.date} · {currentDayData.list.length} Activities
              </p>
            </div>
          )}

         
        </div>

        {/* Nearby Places */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Nearby Places</h3>
          <div className="flex gap-2 overflow-x-auto mb-4">
            {["lodging", "restaurant", "tourist_attraction"].map((type) => (
              <button
                key={type}
                onClick={() => setPlaceType(type)}
                className={`px-4 py-2 rounded-full ${placeType === type ? 'bg-yellow-300 text-white' : 'bg-gray-700 text-gray-400'}`}
              >
                {type === "lodging" ? "Hotels" : 
                 type === "restaurant" ? "Restaurants" : 
                 "Attractions"}
              </button>
            ))}
          </div>

          {loadingPlaces ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-300"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {tripData.nearbyPlaces.slice(0, 3).map((place) => (
                <div key={place.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src={place.photo ? getPlacePhotoUrl(place.photo) : 'https://placehold.co/400x200?text=No+Image'} 
                    alt={place.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-bold text-white">{place.name}</h4>
                    <p className="text-sm text-gray-300 mb-2">{place.address}</p>
                    {place.rating && (
                      <div className="flex items-center">
                        <span className="text-yellow-300">★ {place.rating}</span>
                        {place.totalRatings && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({place.totalRatings.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}