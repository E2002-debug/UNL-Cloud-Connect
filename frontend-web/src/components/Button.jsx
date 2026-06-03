import React from 'react'

export default function Button({children, variant='primary', className='', ...props}){
  const base = 'px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center gap-2'
  const variants = {
    primary: `bg-primary text-white hover:opacity-95`,
    outline: `bg-white border border-slate-200 text-slate-900`
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
