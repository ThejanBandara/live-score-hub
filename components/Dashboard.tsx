"use client";

// imports
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import { LogOut, Plus, Settings, User, Delete } from "lucide-react";
import Image from "next/image";
import {
  MatchDoc,
  MatchStateDoc,
  rugbyPlayer,
  TeamCard,
} from "@/types/RugbyMatch";
import toast from "react-hot-toast";

// Empty team object to initialize state
const emptyTeam: TeamCard = {
  teamName: "",
  teamTriCode: "",
  logoUrl: "",
  color_1: "",
  color_2: "",
  players: [],
  packWeight: 0,
  yellowCards: 0,
  redCards: 0,
  tries: 0,
  conversions: 0,
  panelties: 0,
  dropGoals: 0,
  replacements: [],
};

const Dashboard = () => {
  // Matches storage
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  // filter 
  const [filter, setFilter] = useState("all");
  // Create Match Modal
  const [showModal, setShowModal] = useState(false);

  // Create Match Modal Data Storage
  const [tournamentName, setTournamentName] = useState<string>("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [homeTeam, setHomeTeam] = useState<TeamCard>({ ...emptyTeam });
  const [awayTeam, setAwayTeam] = useState<TeamCard>({ ...emptyTeam });
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<rugbyPlayer[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<rugbyPlayer[]>([]);
  const [matchOfficials, setMatchOfficials] = useState<string[]>([]);
  const [matchCommentators, setMatchCommentators] = useState<string[]>([]);

  const router = useRouter();

  // Fetch matches on component mount 
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/matches", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const statusOrder = { live: 0, scheduled: 1, ended: 2, cancelled: 3 };
        data.sort(
          (a: MatchDoc, b: MatchDoc) =>
            statusOrder[a.status] - statusOrder[b.status]
        );
        setMatches(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatches();
  }, []);

  // Update team players when players arrays change
  useEffect(() => {
    setHomeTeam(prev => ({ ...prev, players: homeTeamPlayers }));
  }, [homeTeamPlayers]);

  useEffect(() => {
    setAwayTeam(prev => ({ ...prev, players: awayTeamPlayers }));
  }, [awayTeamPlayers]);

  // Filter matches based on selected filter
  const filteredMatches =
    filter === "all" ? matches : matches.filter((m) => m.status === filter);

  // Handle user logout
  const handleLogout = async () => {
    toast("Logging out...");
    await signOut(auth);
    router.push("/login");
  };

  // Player management functions
  const addHomePlayer = () => {
    setHomeTeamPlayers((prev) => [
      ...prev,
      {
        playerID: prev.length + 1,
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
    setAwayTeamPlayers((prev) => [
      ...prev,
      {
        playerID: prev.length + 1,
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

  // Reset form function
  const resetForm = () => {
    setTournamentName("");
    setMatchDate("");
    setVenue("");
    setHomeTeam({ ...emptyTeam });
    setAwayTeam({ ...emptyTeam });
    setHomeTeamPlayers([]);
    setAwayTeamPlayers([]);
    setMatchOfficials([]);
    setMatchCommentators([]);
  };

  // Create The New match and the state for the match
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const match: MatchDoc = {
      tournamentName,
      rugbyMatchID: "",
      matchDate,
      venue,
      status: "scheduled",
      homeTeam: { ...homeTeam, players: homeTeamPlayers },
      awayTeam: { ...awayTeam, players: awayTeamPlayers },
      matchOfficials: matchOfficials.filter((o) => o.trim() !== ""),
      matchCommentators: matchCommentators.filter((c) => c.trim() !== ""),
      createdAt: "",
      updatedAt: "",
    };

    const state: MatchStateDoc = {
      homeScore: 0,
      awayScore: 0,
      weather: { condition: "", temp: 0, humidity: 0, windSpeed: 0 },
      timer: {
        startedAt: null,
        pausedAt: null,
        isRunning: false,
        offset: 0,
        currentHalf: 1,
        totalGameTime: 80,
        timerType: "countup",
      },
      lastSyncedAt: "",
      yellowCardsHome: 0,
      redCardsHome: 0,
      yellowCardsAway: 0,
      redCardsAway: 0,
    };

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ match, state }),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        window.location.reload();
        toast.success("Match created successfully!");
      } else {
        console.error(await res.json());
        toast.error("Failed to create match");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating match");
    }
  };

  return (
    <div className="w-full min-h-screen bg-base-300">

      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm px-4">

        {/* Navbar left (logo and text */}
        <div className="flex flex-1 flex-row items-center gap-2">
          <Image
            src={"/VimasaLogo.png"}
            width={90}
            height={30}
            alt="Vimasa Logo"
          />
          <a className="text-xl">Live Score Hub</a>
        </div>

        {/* Navbar right (buttons and avatar) */}
        <div className="flex flex-row gap-4 items-center">
          <button className="btn btn-info" onClick={() => setShowModal(true)}>
            <Plus /> <span className="ml-2">Add Match</span>
          </button>
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <img
                  alt="Avatar"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <a>
                  <User className="size-5" />
                  Profile
                </a>
              </li>
              <li>
                <a>
                  <Settings className="size-5" />
                  Settings
                </a>
              </li>
              <li onClick={handleLogout}>
                <a className=" text-error">
                  <LogOut className="size-5" />
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 p-4">
        {["all", "scheduled", "live", "ended", "cancelled"].map((state) => (
          <button
            key={state}
            className={`btn btn-sm ${
              filter === state ? "btn-info" : "btn-ghost btn-soft"
            }`}
            onClick={() => setFilter(state)}
          >
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </button>
        ))}
      </div>

      {/* Matches grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 px-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <div key={match.rugbyMatchID} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{match.homeTeam.teamName} vs {match.awayTeam.teamName}</h2>
                <p>{match.venue}</p>
                <p>{new Date(match.matchDate).toLocaleDateString()}</p>
                <div className={`badge ${
                  match.status === 'live' ? 'badge-success' :
                  match.status === 'scheduled' ? 'badge-info' :
                  match.status === 'ended' ? 'badge-neutral' : 'badge-error'
                }`}>
                  {match.status}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No matches found</p>
          </div>
        )}
      </div>

      {/* Comprehensive Modal Form */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h1 className="font-medium text-xl">Create New Match</h1>
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
                      <div
                        key={player.playerID}
                        className="col-span-6 flex gap-2"
                      >
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
                          onClick={() => {
                            setHomeTeamPlayers((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                            toast("Home player removed");
                          }}
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
                      <div
                        key={player.playerID}
                        className="col-span-6 flex gap-2"
                      >
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
                          onClick={() => {
                            setAwayTeamPlayers((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                            toast("Away player removed");
                          }}
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
                      onClick={() => {
                        setMatchOfficials((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                        toast("Match Official Removed");
                      }}
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
                      onClick={() => {
                        setMatchCommentators((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                        toast("Match Commentator Removed");
                      }}
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
                <button type="submit" className="btn btn-primary">
                  Create Match
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;