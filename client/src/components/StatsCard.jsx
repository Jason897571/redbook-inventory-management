export default function StatsCard({ label, value, icon: Icon, color = 'text-foreground' }) {
  return (
    <div className="bg-card rounded-lg p-4 border border-border flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-muted-foreground text-xs">{label}</div>
        {Icon && <Icon size={16} className="text-muted-foreground/70" />}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
