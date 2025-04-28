export default function ContinueButton({ onClick }) {
    return (
      <button
        className="w-full hover:bg-blue-700 text-blue rounded-lg py-3 mt-6"
        onClick={onClick}
      >
        Continue
      </button>
    );
  }