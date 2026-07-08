type RatingInputProps = {
  value?: number;
  max?: number;
  disabled?: boolean;
};

export default function RatingInput({
  value = 0,
  max = 5,
  disabled = true,
}: RatingInputProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => (
        <button
          key={index}
          type="button"
          disabled={disabled}
          className={`text-2xl transition ${
            index < value
              ? "text-yellow-400"
              : "text-neutral-700 hover:text-neutral-500"
          }`}
        >
          ★
        </button>
      ))}

      {disabled && (
        <span className="ml-3 text-xs text-neutral-500">
          Coming later
        </span>
      )}
    </div>
  );
}