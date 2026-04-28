import React from "react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function LogoutConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Konfirmasi Keluar",
  description = "Apakah Anda yakin ingin keluar dari aplikasi?"
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-[90vw] max-w-sm bg-[#f8faff] rounded-[2rem] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-slate-500 text-[15px] pb-4 px-2 leading-relaxed">
            {description}
          </p>
          
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full bg-[#e60000] hover:bg-red-700 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-[1.25rem] text-[15px] shadow-sm"
            >
              Ya, Keluar
            </button>
            <button
              onClick={onClose}
              className="w-full bg-transparent border-2 border-slate-800 hover:bg-slate-100 active:scale-[0.98] transition-all text-slate-900 font-bold py-3.5 rounded-[1.25rem] text-[15px]"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
