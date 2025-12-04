// -----------------------------
// Constantes
// -----------------------------
export const MODALIDADES = [
  { value: "PRESTAMO_ORIGINAL", label: "Préstamo de Original" },
  { value: "CONSULTA_SALA", label: "Consulta en Sala" },
  { value: "COPIA_CERTIFICADA", label: "Copia Certificada" },
  { value: "COPIA_SIMPLE", label: "Copia Simple" },
  { value: "REPROGRAFIA", label: "Reprografía" },
  { value: "DIGITALIZACION", label: "Digitalización" },
  { value: "OTROS", label: "Otros" }
];


// -----------------------------
// Utilidades
// -----------------------------
export const getModalidadLabel = (value) => {
  return MODALIDADES.find((m) => m.value === value)?.label || value;
};


// -----------------------------
// Componentes Compartidos
// -----------------------------
export function InfoBlock({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

// ==========================================
// COMPONENTES AUXILIARES (UI)
// ==========================================

export const EstadoBadge = ({ estado }) => {
  const config = {
    PENDIENTE:   { style: "bg-amber-50 text-amber-700 border-amber-200", label: "Pendiente" },
    EN_PROCESO:  { style: "bg-blue-50 text-blue-700 border-blue-200", label: "En Proceso" },
    EN_PRESTAMO:    { style: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "En Prestamo" },
    ATENDIDO:    { style: "bg-slate-100 text-slate-600 border-slate-200", label: "Atendido" },
    RECHAZADO:   { style: "bg-red-50 text-red-700 border-red-200", label: "Rechazado" },
    ANULADO:     { style: "bg-gray-100 text-gray-500 border-gray-200", label: "Anulado" },
    CANCELADO: { style: "bg-gray-100 text-gray-600 border-gray-200", label: "Cancelado" }
  };
  const current = config[estado] || config.PENDIENTE;
  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider ${current.style}`}>
      {current.label}
    </span>
  );
};
