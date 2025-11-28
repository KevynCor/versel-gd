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
