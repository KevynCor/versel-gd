export const CrudLayout = ({ children, title, icon: Icon }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
            <Icon size={24} className="text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">Gestión Documental y Archivo Central</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  </div>
);