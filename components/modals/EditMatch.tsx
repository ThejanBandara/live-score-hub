import { MatchDoc, rugbyPlayer, TeamCard } from "@/types/RugbyMatch";
import { auth } from "@/utils/firebase";
import { Delete } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const EditMatchModal = ({
  match,
  isOpen,
  setIsOpen,
}: {
  match: MatchDoc;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => {
  // Initialize state with existing match data
  const [tournamentName, setTournamentName] = useState<string>(match.tournamentName);
  const [matchDate, setMatchDate] = useState(match.matchDate);
  const [venue, setVenue] = useState(match.venue);
  const [homeTeam, setHomeTeam] = useState<TeamCard>({ ...match.homeTeam });
  const [awayTeam, setAwayTeam] = useState<TeamCard>({ ...match.awayTeam });
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<rugbyPlayer[]>([...match.homeTeam.players]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<rugbyPlayer[]>([...match.awayTeam.players]);
  const [matchOfficials, setMatchOfficials] = useState<string[]>([...match.matchOfficials]);
  const [matchCommentators, setMatchCommentators] = useState<string[]>([...match.matchCommentators]);
  
  // Reset form data when match prop changes
  useEffect(() => {
    if (match) {
      setTournamentName(match.tournamentName);
      setMatchDate(match.matchDate);
      setVenue(match.venue);
      setHomeTeam({ ...match.homeTeam });
      setAwayTeam({ ...match.awayTeam });
      setHomeTeamPlayers([...match.homeTeam.players]);
      setAwayTeamPlayers([...match.awayTeam.players]);
      setMatchOfficials([...match.matchOfficials]);
      setMatchCommentators([...match.matchCommentators]);
    }
  }, [match]);

  // Update team players when players arrays change
  useEffect(() => {
    setHomeTeam((prev) => ({ ...prev, players: homeTeamPlayers }));
  }, [homeTeamPlayers]);

  useEffect(() => {
    setAwayTeam((prev) => ({ ...prev, players: awayTeamPlayers }));
  }, [awayTeamPlayers]);

  // Player management functions
  const addHomePlayer = () => {
    const newPlayerId = Math.max(0, ...homeTeamPlayers.map(p => p.playerID)) + 1;
    setHomeTeamPlayers((prev) => [
      ...prev,
      {
        playerID: newPlayerId,
        PlayerName: "",
        PlayerJerseyNumber: 0,
        Position: "",
        isCaption: false,
        isSubstitiudePlayer: false,
      },
    ]);
    toast("Home player added");
  };

  const addAwayPlayer = () => {
    const newPlayerId = Math.max(0, ...awayTeamPlayers.map(p => p.playerID)) + 1;
    setAwayTeamPlayers((prev) => [
      ...prev,
      {
        playerID: newPlayerId,
        PlayerName: "",
        PlayerJerseyNumber: 0,
        Position: "",
        isCaption: false,
        isSubstitiudePlayer: false,
      },
    ]);
    toast("Away player added");
  };

  const updateHomePlayer = (
    index: number,
    updatedFields: Partial<rugbyPlayer>
  ) => {
    setHomeTeamPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], ...updatedFields };
      return newPlayers;
    });
  };

  const updateAwayPlayer = (
    index: number,
    updatedFields: Partial<rugbyPlayer>
  ) => {
    setAwayTeamPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], ...updatedFields };
      return newPlayers;
    });
  };

  const removeHomePlayer = (index: number) => {
    setHomeTeamPlayers((prev) => prev.filter((_, i) => i !== index));
    toast("Home player removed");
  };

  const removeAwayPlayer = (index: number) => {
    setAwayTeamPlayers((prev) => prev.filter((_, i) => i !== index));
    toast("Away player removed");
  };

  // Officials management functions
  const addMatchOfficial = () => {
    setMatchOfficials((prev) => [...prev, ""]);
    toast("Match official added");
  };

  const updateMatchOfficial = (index: number, value: string) => {
    setMatchOfficials((prev) => {
      const newOfficials = [...prev];
      newOfficials[index] = value;
      return newOfficials;
    });
  };

  const removeMatchOfficial = (index: number) => {
    setMatchOfficials((prev) => prev.filter((_, i) => i !== index));
    toast("Match Official Removed");
  };

  // Commentators management functions
  const addMatchCommentator = () => {
    setMatchCommentators((prev) => [...prev, ""]);
    toast("Match Commentator added");
  };

  const updateMatchCommentator = (index: number, value: string) => {
    setMatchCommentators((prev) => {
      const newCommentators = [...prev];
      newCommentators[index] = value;
      return newCommentators;
    });
  };

  const removeMatchCommentator = (index: number) => {
    setMatchCommentators((prev) => prev.filter((_, i) => i !== index));
    toast("Match Commentator Removed");
  };

  // Update match function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedMatch: Partial<MatchDoc> = {
      tournamentName,
      matchDate,
      venue,
      homeTeam: { ...homeTeam, players: homeTeamPlayers },
      awayTeam: { ...awayTeam, players: awayTeamPlayers },
      matchOfficials: matchOfficials.filter((o) => o.trim() !== ""),
      matchCommentators: matchCommentators.filter((c) => c.trim() !== ""),
      updatedAt: new Date().toISOString(),
    };

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/matches/${match.rugbyMatchID}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: updatedMatch }),
      });

      if (res.ok) {
        setIsOpen(false);
        window.location.reload();
        toast.success("Match updated successfully!");
      } else {
        const errorData = await res.json();
        console.error(errorData);
        toast.error("Failed to update match");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating match");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-medium text-xl">
            Edit Match | {match.tournamentName} | {match.homeTeam.teamTriCode} Vs{" "}
            {match.awayTeam.teamTriCode}
          </h1>
          <button
            className="btn btn-soft btn-sm btn-square btn-ghost"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[75vh] overflow-y-auto pr-2"
        >
          {/* Basic Info Section */}
          <div className="w-full h-fit bg-base-200 rounded-lg border border-primary-content/50 flex flex-col gap-2 p-2 mt-4">
            <h2 className="w-fit font-medium text-lg">Basic Info</h2>
            <input
              type="text"
              placeholder="Tournament Name *"
              className="input w-full"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              placeholder="Match Date *"
              className="input w-full"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Venue *"
              className="input w-full"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>

          {/* Teams Info Section */}
          <div className="w-full grid grid-rows-2 grid-cols-1 md:grid-rows-1 md:grid-cols-2 gap-4 mt-4">
            {/* Home Team Info Card */}
            <div className="w-full h-fit bg-base-200 rounded-lg border border-primary-content/50 flex flex-row">
              <div className="flex-1 flex flex-col gap-2 p-2">
                <h2 className="w-fit font-medium text-lg">Home Team</h2>
                <input
                  type="text"
                  placeholder="Team Name *"
                  className="input"
                  value={homeTeam.teamName}
                  onChange={(e) =>
                    setHomeTeam({ ...homeTeam, teamName: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Team Tricode"
                  className="input"
                  value={homeTeam.teamTriCode}
                  onChange={(e) =>
                    setHomeTeam({ ...homeTeam, teamTriCode: e.target.value })
                  }
                />
                <input
                  type="url"
                  placeholder="Team Logo URL"
                  className="input"
                  value={homeTeam.logoUrl}
                  onChange={(e) => {
                    setHomeTeam({ ...homeTeam, logoUrl: e.target.value });
                  }}
                />
                <input
                  type="color"
                  placeholder="Team Color #1"
                  className="input"
                  value={homeTeam.color_1}
                  onChange={(e) => {
                    setHomeTeam({ ...homeTeam, color_1: e.target.value });
                  }}
                />
                <input
                  type="color"
                  placeholder="Team Color #2"
                  className="input"
                  value={homeTeam.color_2}
                  onChange={(e) => {
                    setHomeTeam({ ...homeTeam, color_2: e.target.value });
                  }}
                />
              </div>

              <div className="w-1/3 flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-sm italic">Logo Preview</p>
                <div className="aspect-square w-full border border-primary-content/50 rounded-lg flex items-center justify-center overflow-hidden bg-base-100">
                  {homeTeam.logoUrl ? (
                    <img
                      src={homeTeam.logoUrl}
                      alt="Team Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm ">No logo</span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center gap-2 w-full">
                  <p className="text-sm italic">Color Previews</p>
                  <div className="flex flex-row items-center justify-center gap-2 w-full">
                    <div
                      className="w-1/3 h-8 border border-primary-content/50 rounded"
                      style={{
                        backgroundColor: homeTeam.color_1 || "#f3f4f6",
                      }}
                    ></div>
                    <div
                      className="w-1/3 h-8 border border-primary-content/50 rounded"
                      style={{
                        backgroundColor: homeTeam.color_2 || "#f3f4f6",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Away Team Info Card */}
            <div className="w-full h-fit bg-base-200 rounded-lg border border-primary-content/50 flex flex-row">
              <div className="flex-1 flex flex-col gap-2 p-2">
                <h2 className="w-fit font-medium text-lg">Away Team</h2>
                <input
                  type="text"
                  placeholder="Team Name *"
                  className="input"
                  value={awayTeam.teamName}
                  onChange={(e) => {
                    setAwayTeam({ ...awayTeam, teamName: e.target.value });
                  }}
                  required
                />
                <input
                  type="text"
                  placeholder="Team Tricode"
                  className="input"
                  value={awayTeam.teamTriCode}
                  onChange={(e) => {
                    setAwayTeam({ ...awayTeam, teamTriCode: e.target.value });
                  }}
                />
                <input
                  type="url"
                  placeholder="Team Logo URL"
                  className="input"
                  value={awayTeam.logoUrl}
                  onChange={(e) => {
                    setAwayTeam({ ...awayTeam, logoUrl: e.target.value });
                  }}
                />
                <input
                  type="color"
                  placeholder="Team Color #1"
                  className="input"
                  value={awayTeam.color_1}
                  onChange={(e) => {
                    setAwayTeam({ ...awayTeam, color_1: e.target.value });
                  }}
                />
                <input
                  type="color"
                  placeholder="Team Color #2"
                  className="input"
                  value={awayTeam.color_2}
                  onChange={(e) => {
                    setAwayTeam({ ...awayTeam, color_2: e.target.value });
                  }}
                />
              </div>

              <div className="w-1/3 flex flex-col items-center justify-center gap-2 p-2">
                <p className="text-sm italic">Logo Preview</p>
                <div className="aspect-square w-full border border-primary-content/50 rounded-lg flex items-center justify-center overflow-hidden bg-base-100">
                  {awayTeam.logoUrl ? (
                    <img
                      src={awayTeam.logoUrl}
                      alt="Team Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm ">No logo</span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center gap-2 w-full">
                  <p className="text-sm italic">Color Previews</p>
                  <div className="flex flex-row items-center justify-center gap-2 w-full">
                    <div
                      className="w-1/3 h-8 border border-primary-content/50 rounded"
                      style={{
                        backgroundColor: awayTeam.color_1 || "#f3f4f6",
                      }}
                    ></div>
                    <div
                      className="w-1/3 h-8 border border-primary-content/50 rounded"
                      style={{
                        backgroundColor: awayTeam.color_2 || "#f3f4f6",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="w-full grid grid-rows-2 grid-cols-1 md:grid-rows-1 md:grid-cols-2 gap-4 mt-4">
            {/* Home Team Players */}
            <div className="w-full h-fit bg-base-200 rounded-lg border border-primary-content/50 flex flex-col p-2">
              <h2 className="w-fit font-medium text-lg">Home Team Players</h2>
              <div className="grid grid-cols-6 gap-2">
                {homeTeamPlayers.map((player, index) => (
                  <div key={player.playerID} className="col-span-6 flex gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="input input-bordered w-full"
                      value={player.PlayerName}
                      onChange={(e) =>
                        updateHomePlayer(index, {
                          PlayerName: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="#"
                      className="input input-bordered w-12"
                      value={player.PlayerJerseyNumber || ""}
                      onChange={(e) =>
                        updateHomePlayer(index, {
                          PlayerJerseyNumber: Number(e.target.value),
                        })
                      }
                    />
                    <select
                      className="select select-bordered"
                      value={player.Position}
                      onChange={(e) =>
                        updateHomePlayer(index, { Position: e.target.value })
                      }
                    >
                      <option value="">Position</option>
                      <option value="Prop">Prop</option>
                      <option value="Hooker">Hooker</option>
                      <option value="Lock">Lock</option>
                      <option value="Flanker">Flanker</option>
                      <option value="Scrum-half">Scrum-half</option>
                      <option value="Fly-half">Fly-half</option>
                      <option value="Center">Center</option>
                      <option value="Wing">Wing</option>
                      <option value="Fullback">Fullback</option>
                    </select>
                    <label className="label cursor-pointer">
                      <span className="label-text text-sm">C</span>
                      <input
                        type="checkbox"
                        checked={player.isCaption}
                        onChange={(e) =>
                          updateHomePlayer(index, {
                            isCaption: e.target.checked,
                          })
                        }
                        className="checkbox checkbox-sm"
                      />
                    </label>
                    <label className="label cursor-pointer">
                      <span className="label-text text-sm">Sub</span>
                      <input
                        type="checkbox"
                        checked={player.isSubstitiudePlayer}
                        onChange={(e) =>
                          updateHomePlayer(index, {
                            isSubstitiudePlayer: e.target.checked,
                          })
                        }
                        className="checkbox checkbox-sm"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-error btn-sm btn-square flex flex-col items-center justify-center"
                      onClick={() => removeHomePlayer(index)}
                    >
                      <Delete className="size-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-info col-span-6"
                  onClick={addHomePlayer}
                >
                  Add Player
                </button>
              </div>
            </div>

            {/* Away Team Players */}
            <div className="w-full h-fit bg-base-200 rounded-lg border border-primary-content/50 flex flex-col p-2">
              <h2 className="w-fit font-medium text-lg">Away Team Players</h2>
              <div className="grid grid-cols-6 gap-2">
                {awayTeamPlayers.map((player, index) => (
                  <div key={player.playerID} className="col-span-6 flex gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="input input-bordered w-full"
                      value={player.PlayerName}
                      onChange={(e) =>
                        updateAwayPlayer(index, {
                          PlayerName: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="#"
                      className="input input-bordered w-20"
                      value={player.PlayerJerseyNumber || ""}
                      onChange={(e) =>
                        updateAwayPlayer(index, {
                          PlayerJerseyNumber: Number(e.target.value),
                        })
                      }
                    />
                    <select
                      className="select select-bordered"
                      value={player.Position}
                      onChange={(e) =>
                        updateAwayPlayer(index, { Position: e.target.value })
                      }
                    >
                      <option value="">Position</option>
                      <option value="Prop">Prop</option>
                      <option value="Hooker">Hooker</option>
                      <option value="Lock">Lock</option>
                      <option value="Flanker">Flanker</option>
                      <option value="Scrum-half">Scrum-half</option>
                      <option value="Fly-half">Fly-half</option>
                      <option value="Center">Center</option>
                      <option value="Wing">Wing</option>
                      <option value="Fullback">Fullback</option>
                    </select>
                    <label className="label cursor-pointer">
                      <span className="label-text text-sm">C</span>
                      <input
                        type="checkbox"
                        checked={player.isCaption}
                        onChange={(e) =>
                          updateAwayPlayer(index, {
                            isCaption: e.target.checked,
                          })
                        }
                        className="checkbox checkbox-sm"
                      />
                    </label>
                    <label className="label cursor-pointer">
                      <span className="label-text text-sm">Sub</span>
                      <input
                        type="checkbox"
                        checked={player.isSubstitiudePlayer}
                        onChange={(e) =>
                          updateAwayPlayer(index, {
                            isSubstitiudePlayer: e.target.checked,
                          })
                        }
                        className="checkbox checkbox-sm"
                      />
                    </label>

                    <button
                      type="button"
                      className="btn btn-error btn-sm btn-square flex flex-col items-center justify-center"
                      onClick={() => removeAwayPlayer(index)}
                    >
                      <Delete className="size-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-info col-span-6"
                  onClick={addAwayPlayer}
                >
                  Add Player
                </button>
              </div>
            </div>
          </div>

          {/* Match Officials Section */}
          <div className="w-full h-fit bg-base-200 rounded-lg border border-primary-content/50 flex flex-col p-2">
            <h2 className="w-fit font-medium text-lg">Match Officials</h2>
            {matchOfficials.map((official, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Official Name"
                  className="input input-bordered w-full"
                  value={official}
                  onChange={(e) => updateMatchOfficial(index, e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-error btn-sm"
                  onClick={() => removeMatchOfficial(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-info col-span-5"
              onClick={addMatchOfficial}
            >
              Add Officials
            </button>
          </div>

          {/* Commentators Section */}
          <div className="w-full h-fit bg-base-200 rounded-lg border border-primary-content/50 flex flex-col p-2">
            <h2 className="w-fit font-medium text-lg">Commentators</h2>
            {matchCommentators.map((commentator, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Commentator Name"
                  className="input input-bordered w-full"
                  value={commentator}
                  onChange={(e) =>
                    updateMatchCommentator(index, e.target.value)
                  }
                />
                <button
                  type="button"
                  className="btn btn-error btn-sm"
                  onClick={() => removeMatchCommentator(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-info col-span-5"
              onClick={addMatchCommentator}
            >
              Add Commentator
            </button>
          </div>

          {/* Modal Actions */}
          <div className="modal-action">
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Update Match
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMatchModal;