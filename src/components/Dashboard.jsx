import { useEffect, useState } from "react";

export default function Dashboard({ destinationData, googleApiKey }) {
  const [tripData, setTripData] = useState({
    location: "TOKYO",
    coordinates: null,
    dates: "27.01.2025 - 02.02.2025",
    days: 8,
    companions: 4,
    flight: {
      date: "26.01.2025, 10:50 am",
      route: "DEL ➔ NRT",
      airports: "Delhi, India ➔ Narita, Tokyo"
    },
    accommodations: [],
    activities: [],
    nearbyPlaces: [] // New state for nearby places
  });

  const [selectedDay, setSelectedDay] = useState(1);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placeType, setPlaceType] = useState("lodging"); // Default to hotels

  useEffect(() => {
    if (destinationData && destinationData.geometry) {
      const newLocation = destinationData.name || destinationData.formatted_address || "Unknown Location";
      const lat = destinationData.geometry.location.lat();
      const lng = destinationData.geometry.location.lng();
      const coords = `${lat.toFixed(4)},${lng.toFixed(4)}`;

      setTripData(prev => ({
        ...prev,
        location: newLocation,
        coordinates: coords,
        activities: generateSampleActivities()
      }));
      fetchNearbyPlaces(lat, lng);
    }
  }, [destinationData, placeType]);

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

  const generateSampleActivities = () => [
    {
      day: 1,
      date: "27.01.2025",
      list: [
        { title: "Senso-ji Temple", timing: "8:15 am Morning", duration: "3 hours", pickup: "From Hotel", image: "https://via.placeholder.com/300x150" },
        { title: "Tokyo Sky Tree", timing: "1:00 pm Afternoon", duration: "3 hours", pickup: "From Street", image: "https://via.placeholder.com/300x150" },
        { title: "Kimono Wearing", timing: "Anytime before 8:00pm", duration: "1-2 hours", pickup: "From Hotel", image: "https://via.placeholder.com/300x150" }
      ]
    }
  ];
  

  const mapSrc = tripData.coordinates
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${tripData.coordinates}&zoom=12&size=400x200&maptype=roadmap&markers=color:red%7C${tripData.coordinates}&key=${googleApiKey}`
    : `https://via.placeholder.com/400x200?text=Map+Not+Available`;

  const currentDayData = tripData.activities.find(a => a.day === selectedDay);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] via-[#1c1c1e] to-[#000000] text-white p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hello Chhavi!</h2>
          <p className="text-gray-400">Ready for the trip?</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold">C</div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Your Upcoming Tripp</h3>
        <div className="relative rounded-xl overflow-hidden">
        <img 
      src="https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350"
      alt="new"
      />
          <img src={mapSrc} alt={tripData.location} className="w-full h-48 object-cover" onError={(e) => (e.target.src = 'https://via.placeholder.com/400x200?text=Map+Not+Available')} />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-4">
            <h1 className="text-3xl font-bold">{tripData.location.split(",")[0]}</h1>
            <p className="text-sm">{tripData.dates}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm mt-2">
        <div className="flex items-center gap-1">🗓️ {tripData.days} Days</div>
        <div className="flex items-center gap-1">👥 {tripData.companions} People</div>
        <div className="flex items-center gap-1">🎯 {tripData.activities.reduce((acc, cur) => acc + cur.list.length, 0)} Activities</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-full bg-yellow-300 text-black text-xs">Day Plan</button>
            <button className="px-3 py-1 rounded-full bg-gray-700 text-white text-xs">{tripData.activities.reduce((acc, cur) => acc + cur.list.length, 0)} Activities</button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-scroll pb-2">
          {["MON 27", "TUE 28", "WED 29", "THU 30", "FRI 31", "SAT 1"].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx + 1)}
              className={`px-4 py-2 rounded-full ${selectedDay === idx + 1 ? 'bg-yellow-300 text-black' : 'bg-gray-700 text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-yellow-300 text-black rounded-full px-3 py-1 inline-block text-xs">
          Day {currentDayData?.day} · {currentDayData?.date} · {currentDayData?.list.length} Activities
        </div>

        <div className="space-y-4">
          {currentDayData?.list.map((activity, index) => (
            <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
              <img src={activity.image} alt={activity.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h4 className="font-bold">{activity.title}</h4>
                <p className="text-sm">Timing: {activity.timing}</p>
                <p className="text-sm">Duration: {activity.duration}</p>
                <p className="text-sm">Pickup: {activity.pickup}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}