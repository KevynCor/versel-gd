// src/pages/PrestamoDocumental.jsx
import React, { useState, useEffect } from "react";

// Componentes
import { CrudLayout } from "../components/layout/CrudLayout";
import { Toast } from "../components/ui/Toast";
import { SparkleLoader } from "../components/ui/SparkleLoader";
import { StatCard } from "../components/ui/StatCard";

// Subcomponentes
import PrestamoDocumentoNuevo from "./form/PrestamoDocumentoNuevo";
import PrestamoDocumentoActivos from "./form/PrestamoDocumentoActivos";
import PrestamoDocumentoHistorial from "./form/PrestamoDocumentoHistorial";

// Iconos
import { BookOpen, Clock, Download, AlertTriangle, CheckCircle, FileText, Plus } from "lucide-react";

export default function PrestamoDocumental() {
  const [tab, setTab] = useState("nuevo");
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Cargar préstamos
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const {  data, error } = await supabase
          .from("prestamos")
          .select(`*, documentos: prestamos_documentos(*)`)
          .order("fecha_prestamo", { ascending: false });

        if (error) throw error;
        setPrestamos(data || []);
      } catch (err) {
        setMensaje({ mensaje: "Error cargando datos", tipo: "error" });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Estadísticas
  const stats = {
    activos: prestamos.filter(p => p.estado_prestamo === "prestado").length,
    retrasados: prestamos.filter(p => {
      const hoy = new Date();
      const devolucion = new Date(p.fecha_devolucion_prevista);
      return p.estado_prestamo === "prestado" && devolucion < hoy;
    }).length,
    devueltos: prestamos.filter(p => p.estado_prestamo === "devuelto").length,
    total: prestamos.length,
  };

  return (
    <>
      {mensaje && (
        <Toast {...mensaje} onClose={() => setMensaje(null)} />
      )}

      <CrudLayout title="Gestión de Préstamos Documentales" icon={BookOpen}>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Activos" value={stats.activos} icon={Clock} color="from-blue-600 to-blue-700" />
          <StatCard title="Retrasados" value={stats.retrasados} icon={AlertTriangle} color="from-amber-600 to-orange-700" />
          <StatCard title="Devueltos" value={stats.devueltos} icon={CheckCircle} color="from-emerald-600 to-green-700" />
          <StatCard title="Total" value={stats.total} icon={FileText} color="from-indigo-600 to-purple-700" />
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-slate-200 mb-6 flex-wrap">
          {[
            { id: "nuevo", label: "Nuevo", icon: Plus },
            { id: "activos", label: "Activos", icon: Clock },
            { id: "historial", label: "Historial", icon: Download },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {loading ? (
          <SparkleLoader />
        ) : tab === "nuevo" ? (
          <PrestamoDocumentoNuevo setMensaje={setMensaje} />
        ) : tab === "activos" ? (
          <PrestamoDocumentoActivos
            prestamos={prestamos}
            setPrestamos={setPrestamos}
            setMensaje={setMensaje}
          />
        ) : (
          <PrestamoDocumentoHistorial prestamos={prestamos} />
        )}
      </CrudLayout>
    </>
  );
}