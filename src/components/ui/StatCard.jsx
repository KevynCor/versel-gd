export const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white shadow hover:shadow-md transition`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/90 text-xs">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
        <Icon size={18} />
      </div>
    </div>
  </div>
);