// ==========================================
// CONSTANTES
// ==========================================

// Modalidades
export const MODALIDADES = [
  { value: "PRESTAMO_ORIGINAL", label: "Préstamo de Original" },
  { value: "CONSULTA_SALA", label: "Consulta en Sala" },
  { value: "COPIA_CERTIFICADA", label: "Copia Certificada" },
  { value: "COPIA_SIMPLE", label: "Copia Simple" },
  { value: "REPROGRAFIA", label: "Reprografía" },
  { value: "DIGITALIZACION", label: "Digitalización" },
  { value: "OTROS", label: "Otros" }
];

// Estados del Documento
export const ESTADOS_DOCUMENTO = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "PRESTADO", label: "Prestado" },
  { value: "NO_LOCALIZADO", label: "No Localizado" },
  { value: "EN_RESTAURACION", label: "En Restauración" },
  { value: "EN_DIGITALIZACION", label: "En Digitalización" },
  { value: "RESERVADO", label: "Reservado" },
  { value: "RESTRINGIDO", label: "Restringido" },
  { value: "EN_SERVICIO_ARCHIVISTICO", label: "En Servicio Archivístico" }
];

// Estados de Gestión
export const ESTADOS_GESTION = [
  { value: "VIGENTE", label: "Vigente" },
  { value: "PENDIENTE_EVALUACION", label: "Pendiente Evaluación" },
  { value: "PROPUESTO_ELIMINACION", label: "Propuesto Eliminación" },
  { value: "APROBADO_ELIMINACION", label: "Aprobado Eliminación" },
  { value: "ELIMINADO", label: "Eliminado" }
];


// ==========================================
// ESTILOS POR ESTADO DE DOCUMENTO
// ==========================================

export const ESTADO_DOC_STYLE = {
  DISPONIBLE:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  PRESTADO:         "bg-amber-50 text-amber-700 border-amber-200",
  NO_LOCALIZADO:    "bg-red-50 text-red-700 border-red-200",
  EN_RESTAURACION:  "bg-blue-50 text-blue-700 border-blue-200",
  EN_DIGITALIZACION:"bg-indigo-50 text-indigo-700 border-indigo-200",
  RESERVADO:        "bg-purple-50 text-purple-700 border-purple-200",
  RESTRINGIDO:      "bg-gray-200 text-gray-700 border-gray-300",
  EN_SERVICIO_ARCHIVISTICO: "bg-blue-100 text-blue-700 border-blue-300",
  DEFAULT:          "bg-slate-50 text-slate-600 border-slate-200"
};


// ==========================================
// HELPERS
// ==========================================

export const getEstadoDocumentoLabel = (value) => {
  if (!value) return "";
  const clean = value.trim().toUpperCase(); // normaliza
  return ESTADOS_DOCUMENTO.find(e => e.value === clean)?.label || clean;
};

export const getEstadoGestionLabel = (value) => {
  if (!value) return "";
  const clean = value.trim().toUpperCase();
  return ESTADOS_GESTION.find(e => e.value === clean)?.label || clean;
};

// ==========================================
// UTILIDADES
// ==========================================

export const getModalidadLabel = (value) =>
  MODALIDADES.find((m) => m.value === value)?.label || value;


// ==========================================
// COMPONENTES COMPARTIDOS
// ==========================================

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
    EN_PRESTAMO: { style: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "En Préstamo" },
    ATENDIDO:    { style: "bg-slate-100 text-slate-600 border-slate-200", label: "Atendido" },
    RECHAZADO:   { style: "bg-red-50 text-red-700 border-red-200", label: "Rechazado" },
    ANULADO:     { style: "bg-gray-100 text-gray-500 border-gray-200", label: "Anulado" },
    CANCELADO:   { style: "bg-gray-100 text-gray-600 border-gray-200", label: "Cancelado" }
  };

  const current = config[estado] ?? config.PENDIENTE;

  return (
    <span
      className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider ${current.style}`}
    >
      {current.label}
    </span>
  );
};

// ==========================================
// FORMATEO DE FECHAS
// ==========================================
export const formatFechaHora = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};