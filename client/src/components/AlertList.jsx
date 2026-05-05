export default function AlertList({ title, items, nameKey = 'name' }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-medium mb-3 text-foreground">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-foreground">{item[nameKey]}</span>
            </div>
            <span className="text-red-400 text-xs">
              剩余 {item.stock} / 阈值 {item.stockAlertThreshold}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
