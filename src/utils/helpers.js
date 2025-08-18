// src/utils/helpers.jsx

export const formatDate = (date) => {
  if (!date) return "";
  if (typeof date === "string" && date.includes("/")) return date;
  if (date instanceof Date && !isNaN(date)) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  if (typeof date === "string") {
    const parsed = new Date(date);
    if (!isNaN(parsed)) return formatDate(parsed);
  }
  return "";
};

// ✅ Nueva función opcional
export const formatDateTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d)) return "-";
  const fecha = formatDate(d);
  const time = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} ${time}`;
};