import { useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import DestinationInput from "./components/DestinationInput";
import DurationSelect from "./components/DurationSelect";
import TravelCompanions from "./components/TravelCompanions";
import ContinueButton from "./components/ContinueButton";
import Dashboard from "./components/testDash";
import { motion, AnimatePresence } from "framer-motion";

const libraries = ["places"];

export default function App() {
  const [destinationData, setDestinationData] = useState(null);
  const [duration, setDuration] = useState(0); // Changed to number type
  const [companion, setCompanion] = useState("");
  const [showThirdPane, setShowThirdPane] = useState(false);
  const [tripDates, setTripDates] = useState({
    startDate: "",
    endDate: ""
  });

  const handleContinue = () => {
    if (destinationData && duration > 0 && companion) {
      setShowThirdPane(true);
    } else {
      alert("Please complete all fields before continuing.");
    }
  };

  // Calculate end date based on start date and duration
  const calculateEndDate = (startDate, days) => {
    if (!startDate || !days) return "";
    const date = new Date(startDate);
    date.setDate(date.getDate() + days - 1); // Subtract 1 to include start day
    return date.toISOString().split('T')[0];
  };

  // Format date to DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  // Handle date changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setTripDates(prev => {
      const newDates = {
        ...prev,
        [name]: value
      };
      
      // If both start date and duration are set, calculate end date
      if (name === 'startDate' && duration > 0) {
        newDates.endDate = calculateEndDate(value, duration);
      }
      
      return newDates;
    });
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_API_KEY} libraries={libraries}>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#000000] via-[#1c1c1e] to-[#000000] text-white dark:from-[#f9fafb] dark:via-[#f9fafb] dark:to-[#f9fafb] dark:text-black">
        <AnimatePresence>
          {showThirdPane ? (
            <motion.div
              key="third-pane"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <Dashboard 
                destinationData={destinationData} 
                googleApiKey={import.meta.env.VITE_GOOGLE_API_KEY}
                days={duration}
                companions={companion}
                startDate={formatDate(tripDates.startDate)}
                endDate={formatDate(tripDates.endDate)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="journey-form"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="max-w-md w-full"
            >
              <h1 className="text-2xl font-bold mb-1">Plan Your Journey, Your Way!</h1>
              <p className="mb-6 text-sm text-gray-400 dark:text-gray-600">
                Let's create your personalised travel experience
              </p>

              <DestinationInput
                value={destinationData?.formatted_address || ""}
                onChange={(address) => setDestinationData(prev => ({ ...prev, formatted_address: address }))}
                onPlaceSelect={(place) => setDestinationData(place)}
                useGooglePlaces
              />

              {/* Start Date Input */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">Trip Start Date</label>
                <div className="flex items-center border border-gray-600 dark:border-gray-300 rounded-lg p-3 bg-[#1c1c1e] dark:bg-white">
                  <span className="mr-2 text-gray-400">📅</span>
                  <input
                    type="date"
                    name="startDate"
                    value={tripDates.startDate}
                    onChange={handleDateChange}
                    className="flex-1 bg-transparent outline-none text-white dark:text-black"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <DurationSelect 
                value={duration} 
                onChange={(days) => {
                  setDuration(days);
                  if (tripDates.startDate) {
                    setTripDates(prev => ({
                      ...prev,
                      endDate: calculateEndDate(prev.startDate, days)
                    }));
                  }
                }} 
              />

              <TravelCompanions selected={companion} onSelect={setCompanion} />
              
              <ContinueButton onClick={handleContinue} />
              
              {/* Debug preview (optional) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs">
                  <p>Debug Info:</p>
                  <p>Days: {duration}</p>
                  <p>Start: {tripDates.startDate}</p>
                  <p>End: {tripDates.endDate}</p>
                  <p>Companions: {companion}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LoadScript>
  );
}