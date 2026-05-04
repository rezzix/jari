export default function BarChart({ items, maxValue }: { items: { label: string; title?: string; value: number; color: string }[]; maxValue: number }) {
  const max = maxValue || Math.max(...items.map((i) => i.value)) || 1;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-gray-700 w-32 shrink-0 truncate" title={item.title || item.label}>{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
            <div className={`h-5 rounded-full ${item.color} flex items-center justify-end pr-2 transition-all`} style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}>
              {item.value > 0 && <span className="text-[10px] font-bold text-inherit">{item.value}</span>}
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-gray-400">No data</p>}
    </div>
  );
}