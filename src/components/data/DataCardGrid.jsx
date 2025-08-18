export const DataCardGrid = ({ data, renderCard }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
    {data.map((item, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow hover:shadow-md transition-all overflow-hidden">
        {renderCard(item)}
      </div>
    ))}
  </div>
);