// src/components/ui/CheckboxList.jsx
export default function CheckboxList({ items = [], isChecked, isDisabled, onToggle, render }) {
  return (
    <div className="max-h-44 overflow-y-auto border rounded-lg p-2">
      {items.map(it => (
        <label key={it.id} className="flex items-center gap-2 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isChecked(it)}
            disabled={isDisabled?.(it)}
            onChange={() => onToggle(it)}
          />
          <span className={isDisabled?.(it) ? "line-through text-gray-400" : ""}>
            {render(it)}
          </span>
        </label>
      ))}
    </div>
  );
}