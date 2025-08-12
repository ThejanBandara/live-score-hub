import Image from 'next/image'
import React from 'react'

const dashboard = () => {
  return (
    <div className='w-full h-screen'>
        {/* Navbar */}
        <div className='w-full h-16  bg-slate-700 shadow-md flex items-center justify-between px-4'>
            <div className='flex items-center gap-2'>
                 <Image src={'/VimasaLogo.png'} width={80} height={40} alt='Viamsa Logo'/>
                 <h1 className='text-white text-2xl'>| Live Score Hub</h1>
            </div>
            <div>
                
            </div>
        </div>
    </div>
  )
}

export default dashboard