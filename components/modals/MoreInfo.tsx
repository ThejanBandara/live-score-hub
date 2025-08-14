import { MatchDoc } from '@/types/RugbyMatch'
import { Edit, Trash } from 'lucide-react';
import React from 'react'

const MoreInfoModal = ({match, isOpen, setIsOpen, isEditModalOpen, setIsEditModalOpen, isDeleteModalOpen, setIsDeleteModalOpen} : {match:MatchDoc, isOpen:boolean, setIsOpen : (value: boolean) => void, isEditModalOpen: boolean, setIsEditModalOpen: (value: boolean) => void, isDeleteModalOpen: boolean, setIsDeleteModalOpen : (value: boolean) => void}) => {
  return (
    <div className='modal modal-open'>
        <div className="modal-box w-11/12 max-w-5xl">
        <div className='flex items-center justify-between mb-4'>
            <h1 className="font-medium text-xl">{match.tournamentName} | {match.homeTeam.teamTriCode} Vs {match.awayTeam.teamTriCode}</h1>
            <div className='flex gap-2 items-center'>

                <button className='btn btn-soft btn-sm btn-warning'
                // closes the more info modal and opens edit modal
                    onClick={() => {
                        setIsOpen(false);
                        setIsEditModalOpen(true);
                    }}
                >
                    <Edit className='size-4'/> <span>Edit Match</span>
                </button>

                <button className='btn btn-soft btn-sm btn-error'
                // closes the more info modal and opens the delete confirmation dialog
                    onClick={() => {
                        setIsOpen(false);
                        setIsDeleteModalOpen(true);
                    }}
                >
                    <Trash className='size-4'/> <span>Delete Match</span>
                </button>

                <button className="btn btn-soft btn-sm btn-square  btn-ghost" onClick={() => setIsOpen(false)}>✕</button>
            </div>
        </div>

        <form action="">

        </form>
        </div>
    </div>
  )
}

export default MoreInfoModal