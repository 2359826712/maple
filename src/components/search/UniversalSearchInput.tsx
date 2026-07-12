interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  compact?: boolean;
  autoFocus?: boolean;
}

export default function UniversalSearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  compact = false,
  autoFocus = false,
}: Props) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className={`flex items-center gap-2 border border-background-300 bg-background-50 p-2 shadow-sm ${
        compact ? 'rounded-full' : 'rounded-xl'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <i className="ri-search-2-line text-foreground-500" aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
          className="h-11 w-full bg-transparent text-sm text-foreground-900 outline-none placeholder:text-foreground-500"
        />
      </div>
      <button
        type="submit"
        className={`h-11 shrink-0 bg-primary-500 text-sm font-semibold text-background-50 hover:bg-primary-600 ${
          compact ? 'flex w-11 items-center justify-center rounded-full' : 'rounded-lg px-5'
        }`}
        aria-label={submitLabel}
      >
        {compact ? <i className="ri-search-line" aria-hidden="true" /> : submitLabel}
      </button>
    </form>
  );
}
