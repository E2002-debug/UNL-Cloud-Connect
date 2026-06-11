import React from 'react'

export default function Input({label, type='text', name, value, onChange, readOnly=false, placeholder='', error}){
  return (
    <label className="block text-sm">
      {label && <div className="mb-2 text-sm text-slate-900">{label}</div>}
      <input
        className={`w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
      />
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </label>
  )
}
