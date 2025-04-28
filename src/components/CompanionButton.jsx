export default function CompanionButton({ label, icon, isSelected, onClick }) {
    return (
      <button
        className={`border rounded-lg py-3 flex items-center justify-center gap-2 ${isSelected ? "bg-blue-500 text-white" : "bg-transparent"}`}
        onClick={onClick}
      >
        <span>{icon}</span>
        <span className="font-medium">{label}</span>
      </button>
    );
  }