import { MatchDoc } from '@/types/RugbyMatch'
import React from 'react'

const DeleteMatchModal = ({match, isOpen, setIsOpen} : {match: MatchDoc, isOpen: boolean, setIsOpen: (value:boolean) => void}) => {
  return (
    <div className='modal modal-open'>
        <div className='modal-box'>
            <div className='flex items-center justify-between mb-4'>
            <h1 className="font-medium text-xl">Confirm Delete</h1>
            <button className="btn btn-soft btn-sm btn-square  btn-ghost" onClick={() => setIsOpen(false)}>✕</button>
            </div>
        </div>
    </div>
  )
}

export default DeleteMatchModal