import { 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  FileText,
  Shield,
  Ban,
  Layers
} from "lucide-react";

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
  { value: "ELIMINADO", label: "Eliminado" },
  { value: "RETIRADO_DEL_ARCHIVO", label: "Retirado del Archivo" }
];

// ==========================================
// ESTILOS POR ESTADO DE GESTIÓN
// ==========================================

export const ESTADO_GES_STYLE = {
  VIGENTE:                  "bg-emerald-50 text-emerald-700 border-emerald-200",
  PROPUESTO_ELIMINACION:    "bg-blue-50 text-blue-700 border-blue-200",
  PROPUESTO_ELIMINACION:    "bg-orange-50 text-orange-700 border-orange-300  ",
  PROBADO_ELIMINACION:      "bg-amber-50 text-amber-700 border-amber-200",
  ELIMINADO:                "bg-indigo-50 text-indigo-700 border-indigo-200",
  RETIRADO_DEL_ARCHIVO:     "bg-red-50 text-red-700 border-red-300 font-bold",
  DEFAULT:                  "bg-cyan-50 text-cyan-700 border-cyan-200"
};

// ==========================================
// ESTILOS POR ESTADO DE DOCUMENTO
// ==========================================

export const ESTADO_DOC_STYLE = {
  DISPONIBLE:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  PRESTADO:         "bg-blue-50 text-blue-700 border-blue-200",
  NO_LOCALIZADO:    "bg-orange-50 text-orange-700 border-orange-300 font-bold",
  EN_RESTAURACION:  "bg-amber-50 text-amber-700 border-amber-200",
  EN_DIGITALIZACION:"bg-indigo-50 text-indigo-700 border-indigo-200",
  RESERVADO:        "bg-purple-50 text-purple-700 border-purple-200",
  RESTRINGIDO:      "bg-red-50 text-red-700 border-red-300 font-bold",
  EN_SERVICIO_ARCHIVISTICO: "bg-cyan-50 text-blue-700 border-blue-300",
  DEFAULT:          "bg-cyan-50 text-cyan-700 border-cyan-200"
};

export const ESTADO_INFO = {
  DISPONIBLE: { 
    text: "El documento se encuentra en archivo y habilitado para préstamo o consulta.", 
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2 
  },
  PRESTADO: { 
    text: "El documento ha sido entregado a un usuario. Verifique la fecha de devolución.", 
    style: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock 
  },
  NO_LOCALIZADO: { 
    text: "Atención: Este documento está marcado como NO LOCALIZADO. Verifique en Observaciones de Estado.", 
    style: "bg-orange-50 text-orange-700 border-orange-300 font-bold",
    icon: AlertTriangle 
  },
  EN_RESTAURACION: { 
    text: "El documento está en proceso de conservación o restauración física.", 
    style: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Activity 
  },
  EN_DIGITALIZACION: { 
    text: "El documento se encuentra en el área de digitalización.", 
    style: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: FileText 
  },
  RESERVADO: { 
    text: "Acceso limitado. Requiere autorización especial para su consulta.", 
    style: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Shield 
  },
  RESTRINGIDO: { 
    text: "Acceso denegado temporalmente por normativa legal o administrativa.", 
    style: "bg-red-50 text-red-700 border-red-300 font-bold",
    icon: Ban 
  },
  EN_SERVICIO_ARCHIVISTICO: { 
    text: "En proceso técnico (clasificación, ordenación o descripción).", 
    style: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: Layers 
  }
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