import React from 'react'

export default function AuthLayout({children, title, subtitle}){
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background-muted">
      <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col items-start gap-6">
          <h1 className="text-3xl font-semibold text-slate-900">UNL-Cloud-Connect</h1>
          <p className="text-slate-700">Conecta y gestiona tus servicios en la nube de forma segura.</p>
          <div className="w-full card p-6">
            <img src="/logo192.png" alt="logo" className="w-40 h-40 object-contain" />
          </div>
        </div>
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6">
              {title && <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>}
              {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
            </div>
            <div className="card">
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
