import { MatchDoc } from "@/types/RugbyMatch";
import {
  Calendar,
  Edit,
  MapPin,
  Trash,
  Users,
  Trophy,
  Clock,
  Star,
} from "lucide-react";
import React from "react";

const MoreInfoModal = ({
  match,
  isOpen,
  setIsOpen,
  isEditModalOpen,
  setIsEditModalOpen,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
}: {
  match: MatchDoc;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (value: boolean) => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (value: boolean) => void;
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return "badge badge-success gap-1";
      case "scheduled":
        return "badge badge-info gap-1";
      case "ended":
        return "badge badge-neutral gap-1";
      case "cancelled":
        return "badge badge-error gap-1";
      default:
        return "badge badge-ghost gap-1";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const { date, time } = formatDate(match.matchDate);

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 z-10 pb-4 border-b border-base-200 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="size-6 text-primary" />
                <h1 className="text-2xl font-bold text-base-content">
                  {match.tournamentName}
                </h1>
                <div className={getStatusBadge(match.status)}>
                  {match.status === "live" && (
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  )}
                  {match.status.toUpperCase()}
                </div>
              </div>
              <p className="text-base-content/60 text-sm">
                Match ID: {match.rugbyMatchID}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="tooltip" data-tip="Edit Match">
                <button
                  className="btn btn-warning btn-sm gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit className="size-4" />
                  Edit
                </button>
              </div>

              <div className="tooltip" data-tip="Delete Match">
                <button
                  className="btn btn-error btn-sm gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash className="size-4" />
                  Delete
                </button>
              </div>

              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Teams Section */}
        <div className="card bg-gradient-to-r from-base-200 to-base-300 mb-6">
          <div className="card-body p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Home Team */}
              <div className="text-center py-2 rounded">
                <div className="w-24 h-24 mx-auto mb-4 bg-base-100 rounded-xl shadow-sm border border-base-300 flex items-center justify-center overflow-hidden">
                  {match.homeTeam.logoUrl ? (
                    <img
                      src={match.homeTeam.logoUrl}
                      alt={match.homeTeam.teamName}
                      className="w-20 h-20 object-contain py-2"
                    />
                  ) : (
                    <div className="text-base-content/40 text-xs">No Logo</div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-base-content mb-1">
                  {match.homeTeam.teamName}
                </h3>
                <div className="badge badge-outline badge-lg">
                  {match.homeTeam.teamTriCode}
                </div>
              </div>

              {/* VS & Score */}
              <div className="text-center">
                <div className="text-3xl font-bold text-base-content/40 mb-2">
                  VS
                </div>
                {(match.status === "live" || match.status === "ended") && (
                  <div className="bg-base-100 rounded-lg p-4 shadow-sm">
                    <div className="text-4xl font-bold text-primary">
                      {match.homeTeam.tries * 5 +
                        match.homeTeam.conversions * 2 +
                        match.homeTeam.panelties * 3}
                      <span className="mx-3 text-base-content/40">-</span>
                      {match.awayTeam.tries * 5 +
                        match.awayTeam.conversions * 2 +
                        match.awayTeam.panelties * 3}
                    </div>
                    <p className="text-sm text-base-content/60 mt-1">
                      Final Score
                    </p>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-base-100 rounded-xl shadow-sm border border-base-300 flex items-center justify-center overflow-hidden">
                  {match.awayTeam.logoUrl ? (
                    <img
                      src={match.awayTeam.logoUrl}
                      alt={match.awayTeam.teamName}
                      className="w-20 h-20 object-contain py-2"
                    />
                  ) : (
                    <div className="text-base-content/40 text-xs">No Logo</div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-base-content mb-1">
                  {match.awayTeam.teamName}
                </h3>
                <div className="badge badge-outline badge-lg">
                  {match.awayTeam.teamTriCode}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Information */}
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">
              <Calendar className="size-5" />
              Match Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-base-content">{date}</p>
                    <p className="text-sm text-base-content/60">{time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <MapPin className="size-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-base-content">Venue</p>
                    <p className="text-sm text-base-content/60">
                      {match.venue}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {match.matchOfficials && match.matchOfficials.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users className="size-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-base-content">Officials</p>
                      <p className="text-sm text-base-content/60">
                        {match.matchOfficials.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {match.matchCommentators &&
                  match.matchCommentators.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                        <Star className="size-5 text-info" />
                      </div>
                      <div>
                        <p className="font-medium text-base-content">
                          Commentators
                        </p>
                        <p className="text-sm text-base-content/60">
                          {match.matchCommentators.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home Team Players */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h4 className="card-title text-lg mb-4">
                <div
                  className="w-6 h-6 rounded"
                  style={{
                    backgroundColor: match.homeTeam.color_1 || "#3B82F6",
                  }}
                ></div>
                {match.homeTeam.teamName} Squad
              </h4>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {match.homeTeam.players?.map((player, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                  >
                    <div className="avatar avatar-placeholder ">
                      <div className={`text-neutral-content w-8 rounded-full bg-neutral-content/20`}>
                        <span className="text-sm font-medium">{player.PlayerJerseyNumber || '#'}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base-content">
                          {player.PlayerName}
                        </span>
                        {player.isCaption && (
                          <div className="badge badge-primary badge-sm gap-1">
                            <Star className="size-3" />
                            Captain
                          </div>
                        )}
                        {player.isSubstitiudePlayer && (
                          <div className="badge badge-ghost badge-sm">Sub</div>
                        )}
                      </div>
                      {player.Position && (
                        <p className="text-sm text-base-content/60">
                          {player.Position}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(!match.homeTeam.players ||
                match.homeTeam.players.length === 0) && (
                <div className="text-center py-8 text-base-content/40">
                  <Users className="size-12 mx-auto mb-2" />
                  <p>No players added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Away Team Players */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h4 className="card-title text-lg mb-4">
                <div
                  className="w-6 h-6 rounded"
                  style={{
                    backgroundColor: match.awayTeam.color_1 || "#EF4444",
                  }}
                ></div>
                {match.awayTeam.teamName} Squad
              </h4>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {match.awayTeam.players?.map((player, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                  >
                    <div className="avatar avatar-placeholder ">
                      <div className={`text-neutral-content w-8 rounded-full bg-neutral-content/20`}>
                        <span className="text-sm font-medium">{player.PlayerJerseyNumber || '#'}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base-content">
                          {player.PlayerName}
                        </span>
                        {player.isCaption && (
                          <div className="badge badge-primary badge-sm gap-1">
                            <Star className="size-3" />
                            Captain
                          </div>
                        )}
                        {player.isSubstitiudePlayer && (
                          <div className="badge badge-ghost badge-sm">Sub</div>
                        )}
                      </div>
                      {player.Position && (
                        <p className="text-sm text-base-content/60">
                          {player.Position}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(!match.awayTeam.players ||
                match.awayTeam.players.length === 0) && (
                <div className="text-center py-8 text-base-content/40">
                  <Users className="size-12 mx-auto mb-2" />
                  <p>No players added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with timestamps */}
        <div className="mt-6 pt-4 border-t border-base-200 text-center">
          <div className="text-xs text-base-content/40 space-x-4">
            <span>
              Created: {new Date(match.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>
              Updated: {new Date(match.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoreInfoModal;
