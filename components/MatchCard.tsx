'use client';

import { MatchDoc } from "@/types/RugbyMatch";
import { Calendar, Delete, Edit, Eye, MapPin } from "lucide-react";
import React, { useState } from "react";
import MoreInfoModal from "./modals/MoreInfo";
import EditMatchModal from "./modals/EditMatch";
import DeleteMatchModal from "./modals/DeleteMatch";

const MatchCard = ({ match }: { match: MatchDoc }) => {

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMoreInfoModal, setShowMoreInfoModal] = useState(false);
    
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
   <div className="bg-base-100 p-4 rounded-xl shadow hover:shadow-lg transition-all min-h-48 flex flex-col gap-4">
  {/* Top Row - Status + Actions */}
  <div className="flex justify-between items-center">
    <div
      className={`badge capitalize ${
        match.status === "scheduled"
          ? "badge-info"
          : match.status === "live"
          ? "badge-error animate-pulse"
          : match.status === "ended"
          ? "badge-warning"
          : match.status === "cancelled"
          ? "badge-neutral"
          : ""
      }`}
    >
      {match.status}
    </div>
    <div className="flex gap-2">
      <div className="tooltip tooltip-neutral" data-tip="More Info">
        <button className="btn btn-ghost btn-circle btn-sm text-info" onClick={() => setShowMoreInfoModal(true)}>
          <Eye className="size-4" />
        </button>
      </div>
      <div className="tooltip tooltip-neutral" data-tip="Edit Match">
        <button className="btn btn-ghost btn-circle btn-sm text-warning" onClick={() => setShowEditModal(true)}>
          <Edit className="size-4" />
        </button>
      </div>
      <div className="tooltip tooltip-neutral" data-tip="Delete Match" onClick={() => setShowDeleteModal(true)}>
        <button className="btn btn-ghost btn-circle btn-sm text-error">
          <Delete className="size-4" />
        </button>
      </div>
    </div>
  </div>

<div className="w-full flex items-center justify-center">
    {/* Match Title */}
    <h2 className="text-sm text-gray-400">{match.tournamentName}</h2>    
</div>

  {/* Teams Row */}
  <div className="flex justify-between items-center gap-4">
    {/* Home Team */}
    <div className="flex items-center gap-2 flex-1">
      <div className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden">
        <img
          src={match.homeTeam.logoUrl}
          alt={match.homeTeam.teamName}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div>
        <h3 className="text-md font-semibold">{match.homeTeam.teamName}</h3>
        <p className="text-sm opacity-70">{match.homeTeam.teamTriCode}</p>
      </div>
    </div>

    {/* VS */}
    <span className="text-lg font-bold text-gray-500">VS</span>

    {/* Away Team */}
    <div className="flex items-center gap-2 flex-1 justify-end">
      <div className="text-right">
        <h3 className="text-md font-semibold">{match.awayTeam.teamName}</h3>
        <p className="text-sm opacity-70">{match.awayTeam.teamTriCode}</p>
      </div>
      <div className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden">
        <img
          src={match.awayTeam.logoUrl}
          alt={match.awayTeam.teamName}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  </div>

  {/* Match Info */}
  <div className="text-sm opacity-70 flex flex-col gap-2">
    <div className="flex gap-2 items-center">
      <Calendar className="size-4" />
      <p>{formatDate(match.matchDate)}</p>
    </div>
    <div className="flex gap-2 items-center">
      <MapPin className="size-4" />
      <p>{match.venue}</p>
    </div>
  </div>

  {/* More info Modal */}

  {
    showMoreInfoModal && (
      <MoreInfoModal match={match} isOpen={showMoreInfoModal} setIsOpen={setShowMoreInfoModal} isEditModalOpen={showEditModal} setIsEditModalOpen={setShowEditModal} isDeleteModalOpen={showDeleteModal} setIsDeleteModalOpen={setShowDeleteModal}/>
    )
  }

  {/* Edit Match Modal */}
  {
    showEditModal && (
      <EditMatchModal match={match} isOpen={showEditModal} setIsOpen={setShowEditModal} />
    )
  }

  {/* Delete Match Modal */}
  {
    showDeleteModal && (
      <DeleteMatchModal match={match} isOpen={showDeleteModal} setIsOpen={setShowDeleteModal} />
    )
  }

</div>

  );
};

export default MatchCard;
