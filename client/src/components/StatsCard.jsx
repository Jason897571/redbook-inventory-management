export default function StatsCard({ label, value, icon: Icon, color = 'text-white' }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-xs">{label}</div>
        {Icon && <Icon size={16} className="text-gray-600" />}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
