import CompanionButton from "./CompanionButton";

const options = [
  { label: "Solo", icon: "👤" },
  { label: "Couple", icon: "👫" },
  { label: "Family", icon: "👪" },
  { label: "Friends", icon: "👬" },
];

export default function TravelCompanions({ selected, onSelect }) {
  return (
    <div className="mb-6">
      <label className="block mb-4 font-medium">Who are you traveling with?</label>
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => (
          <CompanionButton
            key={opt.label}
            label={opt.label}
            icon={opt.icon}
            isSelected={selected === opt.label}
            onClick={() => onSelect(opt.label)}
          />
        ))}
      </div>
    </div>
  );
}
