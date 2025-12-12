import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyles = "w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300",
    secondary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-200",
    outline: "border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-lg ${className}`}
    {...props}
  />
);

export const Screen: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
  <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">
      {title && (
        <header className="mb-6 mt-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
        </header>
      )}
      <main className="flex-1 flex flex-col gap-4">
        {children}
      </main>
    </div>
  </div>
);
