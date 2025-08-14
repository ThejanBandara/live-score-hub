import { MatchDoc } from '@/types/RugbyMatch';
import { auth } from '@/utils/firebase';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DeleteMatchModal = ({
  match,
  isOpen,
  setIsOpen,
}: {
  match: MatchDoc;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => {
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if deletion should be restricted based on match status
  const isDeletionRestricted = match.status === "live" || match.status === "ended";

  const handleDelete = async () => {
    if (!confirmationChecked) {
      toast.error("Please confirm that you understand this action cannot be undone");
      return;
    }

    if (isDeletionRestricted) {
      toast.error(`Cannot delete a match that is ${match.status}`);
      return;
    }

    setIsDeleting(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/matches/${match.rugbyMatchID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setIsOpen(false);
        toast.success(`Successfully deleted ${match.tournamentName}`);
        window.location.reload();
      } else {
        const errorData = await res.json();
        console.error(errorData);
        toast.error("Failed to delete match");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting match");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetModal = () => {
    setConfirmationChecked(false);
    setIsDeleting(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-medium text-xl text-error">Confirm Delete</h1>
          <button
            className="btn btn-soft btn-sm btn-square btn-ghost"
            onClick={handleClose}
            disabled={isDeleting}
          >
            ✕
          </button>
        </div>

        {isDeletionRestricted && (
          <div className="alert alert-error mb-4">
            <span>
              ❌ Cannot delete: Match is currently {match.status}. Only scheduled matches can be deleted.
            </span>
          </div>
        )}

        <div className="space-y-4">
          {/* Match Details */}
          <div className="bg-base-200 rounded-lg p-4 border border-error/20">
            <h3 className="font-medium text-lg mb-2">Match Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Tournament:</span>
                <span>{match.tournamentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Teams:</span>
                <span>
                  {match.homeTeam.teamName} vs {match.awayTeam.teamName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{new Date(match.matchDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Venue:</span>
                <span>{match.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="capitalize badge badge-outline">{match.status}</span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="alert alert-warning">
            <span>
              ⚠️ This action will permanently delete the match and all associated data including:
            </span>
          </div>

          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>Match information and team details</li>
            <li>All player data ({match.homeTeam.players.length + match.awayTeam.players.length} players)</li>
            <li>Match officials ({match.matchOfficials.length} officials)</li>
            <li>Commentators ({match.matchCommentators.length} commentators)</li>
            <li>Match state and scoring data</li>
            <li>All related match history</li>
          </ul>

          {/* Confirmation Checkbox */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={confirmationChecked}
                onChange={(e) => setConfirmationChecked(e.target.checked)}
                className="checkbox checkbox-error"
                disabled={isDeletionRestricted || isDeleting}
              />
              <span className="label-text font-medium text-wrap">
                I understand this action cannot be undone and will permanently delete all match data
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="modal-action">
            <button
              className={`btn btn-error ${isDeleting ? 'loading' : ''}`}
              onClick={handleDelete}
              disabled={!confirmationChecked || isDeletionRestricted || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Match'}
            </button>
            <button
              className="btn"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteMatchModal;