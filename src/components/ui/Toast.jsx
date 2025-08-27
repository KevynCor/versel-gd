import React, { useEffect } from "react";
import { motion } from "framer-motion";

export const Toast = ({ mensaje, tipo, onClose }) => {
  const config = {
    success: { bg: "from-emerald-500 to-green-600", icon: "✓" },
    error: { bg: "from-red-500 to-pink-600", icon: "✗" },
    warning: { bg: "from-amber-500 to-orange-600", icon: "⚠" },
    info: { bg: "from-blue-500 to-indigo-600", icon: "ⓘ" }
  };

  const { bg, icon } = config[tipo] || config.info;

  // 🔥 Cerrar automáticamente a los 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-4 right-4 z-[100] sm:top-6 sm:right-6"
    >
      <div className={`bg-gradient-to-r ${bg} backdrop-blur-lg border rounded-xl shadow-xl p-3 min-w-[280px] max-w-sm text-white`}>
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            {icon}
          </div>
          <p className="text-sm flex-1">{mensaje}</p>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-full"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
