import React from 'react'

export default function Card({children, className=''}){
  return (
    <div className={`card p-6 ${className}`}>
      {children}
    </div>
  )
}
