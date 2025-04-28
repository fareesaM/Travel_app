export default function DurationSelect({ value, onChange }) {
  // Generate options for 1-30 days
  const dayOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="mb-6">
      <label className="block mb-2 font-medium">Trip Duration</label>
      <div className="flex items-center border border-gray-600 dark:border-gray-300 rounded-lg p-3 bg-[#1c1c1e] dark:bg-white">
        <span className="mr-2 text-gray-400">📅</span>
        <select
          className="flex-1 bg-transparent outline-none appearance-none text-white dark:text-black placeholder-gray-400 dark:placeholder-gray-500"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))} // Convert to number
        >
          <option value="">Select number of days</option>
          {dayOptions.map((days) => (
            <option key={days} value={days}>
              {days} {days === 1 ? 'day' : 'days'}
            </option>
          ))}
          <option value="30+">More than 30 days</option>
        </select>
      </div>
    </div>
  );
}