interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  maxLength?: number;
  minLength?: number;
  error?: string;
  className?: string;
}

export default function Field({ label, value, onChange, type = 'text', required, textarea, maxLength, minLength, error, className }: FieldProps) {
  const id = label.replace(/\s+/g, '-').toLowerCase();
  const inputClassName = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} required={required} maxLength={maxLength} className={inputClassName} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={maxLength} minLength={minLength} className={inputClassName} />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}