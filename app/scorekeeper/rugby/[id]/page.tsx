"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import {
  MatchDoc,
  MatchStateDoc,
  MatchLogDoc,
  rugbyPlayer,
} from "@/types/RugbyMatch";
import { Ban, Clock, Edit, FlagOff, Trash } from "lucide-react";
import toast from "react-hot-toast";

const RugbyScorekeeper = () => {
  const params = useParams();
  const matchId = params.id as string;

  const [matchData, setMatchData] = useState<MatchDoc | null>(null);
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [matchLogs, setMatchLogs] = useState<MatchLogDoc[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<"scheduled" | "live" | "ended" | "cancelled" | "">("");
  const [infoModal, setInfoModal] = useState(false);

  // Modal states
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    minute: 0,
    type: "try" as MatchLogDoc["type"],
    team: "home" as "home" | "away",
    playerName: "",
    playerNumber: 1,
    description: "",
  });

  // Calculate live game time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (matchState?.timer.isRunning && matchState.timer.startedAt) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - matchState.timer.startedAt!) / 1000);
        const totalTime = elapsed + matchState.timer.offset;
        setCurrentTime(totalTime);
      }, 1000);
    } else if (matchState?.timer) {
      setCurrentTime(matchState.timer.offset);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchState?.timer]);

  // Firebase listeners
  useEffect(() => {
    if (!matchId) {
      setError("No match ID provided");
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    // Match data listener
    const matchDocRef = doc(db, "matches", matchId);
    const unsubMatch = onSnapshot(matchDocRef, (doc) => {
      if (doc.exists()) {
        setMatchData(doc.data() as MatchDoc);
        setMatchStatus(doc.data().status);
      } else {
        setError("Match not found");
      }
      setLoading(false);
    });
    unsubscribes.push(unsubMatch);

    // Match state listener
    const matchStateRef = doc(db, "matchStates", matchId);
    const unsubState = onSnapshot(matchStateRef, (doc) => {
      if (doc.exists()) {
        setMatchState(doc.data() as MatchStateDoc);
      }
    });
    unsubscribes.push(unsubState);

    // Match logs listener - Listen to all logs for this match
    const matchLogsQuery = query(
      collection(db, "matchLogs"),
      where("rugbyMatchID", "==", matchId)
    );

    const unsubLogs = onSnapshot(
      matchLogsQuery,
      (snapshot) => {
        console.log("Match logs snapshot received, size:", snapshot.size);
        const logs: MatchLogDoc[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data() as MatchLogDoc;
          console.log("Log data:", docData);
          logs.push(docData);
        });

        // Sort by minute (descending) then by createdAt (descending) on client side
        logs.sort((a, b) => {
          if (a.minute !== b.minute) {
            return b.minute - a.minute; // Higher minutes first
          }
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        console.log("Final sorted logs:", logs);
        setMatchLogs(logs);
      },
      (error) => {
        console.error("Error in match logs listener:", error);
        setError(`Error loading match events: ${error.message}`);
      }
    );
    unsubscribes.push(unsubLogs);

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [matchId]);

  // check for match state changes 

  useEffect(() => {
    if (matchStatus === "scheduled") {
      setInfoModal(true);
    }
    else if (matchStatus === "ended") {
      setInfoModal(true);
    }
    else if (matchStatus === "live") {
      setInfoModal(false);
    }
    else if (matchStatus === "cancelled") {
      setInfoModal(true);
    }

  }, [matchStatus]);

  // Handle match state changes

  const updateMatchStatus = async (matchId: string, newStatus: "scheduled" | "live" | "ended" | "cancelled") => {
  try {
    const matchRef = doc(db, "matches", matchId);
    
    await updateDoc(matchRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    console.log("Match status updated:", { matchId, newStatus });
  } catch (error) {
    console.error("Error updating match status:", error);
    alert("Failed to update match status. Please try again.");
  }
};


  // Timer functions
  const startTimer = async () => {
    if (!matchState) return;

    await updateDoc(doc(db, "matchStates", matchId), {
      "timer.isRunning": true,
      "timer.startedAt": Date.now(),
      lastSyncedAt: new Date().toISOString(),
    });
  };

  const pauseTimer = async () => {
    if (!matchState) return;

    const now = Date.now();
    const elapsed = Math.floor(
      (now - (matchState.timer.startedAt || now)) / 1000
    );
    const newOffset = matchState.timer.offset + elapsed;

    await updateDoc(doc(db, "matchStates", matchId), {
      "timer.isRunning": false,
      "timer.pausedAt": now,
      "timer.offset": newOffset,
      "timer.totalGameTime": newOffset,
      lastSyncedAt: new Date().toISOString(),
    });
  };

  const resetTimer = async () => {
    await updateDoc(doc(db, "matchStates", matchId), {
      "timer.isRunning": false,
      "timer.startedAt": null,
      "timer.pausedAt": null,
      "timer.offset": 0,
      "timer.totalGameTime": 0,
      lastSyncedAt: new Date().toISOString(),
    });
  };

  const changeHalf = async (half: 1 | 2 | "HT" | "FT") => {
    await updateDoc(doc(db, "matchStates", matchId), {
      "timer.currentHalf": half,
      "timer.isRunning": false,
      lastSyncedAt: new Date().toISOString(),
    });
  };

  // Score functions
  const updateScore = async (team: "home" | "away", change: number) => {
    if (!matchState) return;

    const currentScore =
      team === "home" ? matchState.homeScore : matchState.awayScore;
    const newScore = Math.max(0, currentScore + change);

    await updateDoc(doc(db, "matchStates", matchId), {
      [team === "home" ? "homeScore" : "awayScore"]: newScore,
      lastSyncedAt: new Date().toISOString(),
    });
  };

  const quickScore = async (
    team: "home" | "away",
    type: "try" | "conversion" | "panelty" | "drop goal"
  ) => {
    const points = {
      try: 5,
      conversion: 2,
      panelty: 3,
      "drop goal": 3,
    };

    await updateScore(team, points[type]);

    const minute = Math.floor(currentTime / 60);
    const logData: MatchLogDoc = {
      rugbyMatchID: matchId,
      matchLogID: `${matchId}_${Date.now()}`,
      minute,
      type,
      team,
      player: {
        PlayerName: "Auto",
        PlayerJerseyNumber: 0,
        playerID: 0,
        Position: "",
        isCaption: false,
        isSubstitiudePlayer: false,
      },
      description: `${type} scored by ${team} team`,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "matchLogs"), logData);
  };

  // Log functions
  const openLogModal = () => {
    setLogForm({
      minute: Math.floor(currentTime / 60),
      type: "try",
      team: "home",
      playerName: "",
      playerNumber: 1,
      description: "",
    });
    setShowLogModal(true);
  };

  const submitLog = async () => {
    try {
      const logData: MatchLogDoc = {
        rugbyMatchID: matchId,
        matchLogID: `${matchId}_${Date.now()}`,
        minute: logForm.minute,
        type: logForm.type,
        team: logForm.team,
        player: {
          PlayerName: logForm.playerName,
          PlayerJerseyNumber: logForm.playerNumber,
          playerID: Date.now(),
          Position: "",
          isCaption: false,
          isSubstitiudePlayer: false,
        },
        description: logForm.description,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "matchLogs"), logData);
      toast.success("New log created:");

      setShowLogModal(false);
      setLogForm({
        minute: 0,
        type: "try",
        team: "home",
        playerName: "",
        playerNumber: 1,
        description: "",
      });
    } catch (error) {
      toast.error("Failed to save event. Please try again.");
    }
  };

const deleteLog = async (logId: string) => {
  try {
    const matchLogsQuery = query(
      collection(db, "matchLogs"),
      where("matchLogID", "==", logId)
    );
    
    const querySnapshot = await getDocs(matchLogsQuery);
    
    if (!querySnapshot.empty) {
      // Delete the first matching document
      const docToDelete = querySnapshot.docs[0];
      await deleteDoc(doc(db, "matchLogs", docToDelete.id));
      toast.success("Log deleted");
    } else {
      toast.error("Event not found.");
    }
  } catch (error) {
    toast.error("Failed to delete event. Please try again.");
  }
}


  // Helper functions for displaying events
  const getEventIcon = (type: MatchLogDoc["type"]) => {
    switch (type) {
      case "try":
        return "🏉";
      case "conversion":
        return "🎯";
      case "panelty":
        return "⚠️";
      case "drop goal":
        return "⚽";
      case "yellow card":
        return "🟡";
      case "red card":
        return "🔴";
      case "player replacement":
        return "🔄";
      default:
        return "📝";
    }
  };

  const getEventColor = (type: MatchLogDoc["type"]) => {
    switch (type) {
      case "try":
        return "badge-success";
      case "conversion":
        return "badge-info";
      case "panelty":
        return "badge-warning";
      case "drop goal":
        return "badge-accent";
      case "yellow card":
        return "badge-warning";
      case "red card":
        return "badge-error";
      case "player replacement":
        return "badge-secondary";
      default:
        return "badge-neutral";
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !matchData || !matchState) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="alert alert-error max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error || "Match data not available"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Info Modal */}
        {infoModal && matchStatus === "scheduled" && (
        <div className="modal modal-open">
          <div className="modal-box flex flex-col items-center justify-center gap-4">
            <Clock className="size-12" strokeWidth={1.5} />
            <h1 className="text-xl font-medium">Match is Not Live</h1>
            <p className="text-sm text-center w-8/12 text-gray-400">
              This match is still scheduled. You cannot edit data until the match is set to live.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-error btn-soft"
                onClick={() => {
                  updateMatchStatus(matchId, "live");
                  setMatchStatus("live");
                }}
              >
                Go Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ended */}
      {infoModal && matchStatus === "ended" && (
        <div className="modal modal-open">
          <div className="modal-box flex flex-col items-center justify-center gap-4">
            <FlagOff className="size-12" strokeWidth={1.5} />
            <h1 className="text-xl font-medium">Match Ended</h1>
            <p className="text-sm text-center w-8/12 text-gray-400">
              This match has ended. Editing is disabled for completed matches.
            </p>
          </div>
        </div>
      )}

      {/* Cancelled */}
      {matchStatus === "cancelled" && (
        <div className="modal modal-open">
          <div className="modal-box flex flex-col items-center justify-center gap-4">
            <Ban className="size-12" strokeWidth={1.5} />
            <h1 className="text-xl font-medium">Match Cancelled</h1>
            <p className="text-sm text-center w-8/12 text-gray-400">
              This match was cancelled. Editing match data is not allowed.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body p-4">
          <h1 className="text-3xl font-bold text-center">
            {matchStatus}
            {matchData.homeTeam.teamTriCode} vs {matchData.awayTeam.teamTriCode}
          </h1>
          <p className="text-center text-base-content/70">
            {matchData.tournamentName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Timer Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl justify-center mb-6">
              Timer Control
            </h2>

            <div className="text-center mb-8">
              <div className="text-7xl font-mono font-bold text-primary mb-2 countdown">
                {formatTime(currentTime)}
              </div>

              <div className="text-xl font-semibold mb-2">
                {matchState.timer.currentHalf === 1 && "1st Half"}
                {matchState.timer.currentHalf === 2 && "2nd Half"}
                {matchState.timer.currentHalf === "HT" && "Half Time"}
                {matchState.timer.currentHalf === "FT" && "Full Time"}
              </div>
              <div
                className={`badge badge-lg ${
                  matchState.timer.isRunning ? "badge-success" : "badge-error"
                }`}
              >
                {matchState.timer.isRunning ? "RUNNING" : "PAUSED"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={startTimer}
                disabled={matchState.timer.isRunning}
                className="btn btn-success btn-lg"
              >
                START
              </button>
              <button
                onClick={pauseTimer}
                disabled={!matchState.timer.isRunning}
                className="btn btn-warning btn-lg"
              >
                PAUSE
              </button>
            </div>

            <button
              onClick={resetTimer}
              className="btn btn-error btn-outline w-full mb-6"
            >
              RESET TIMER
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => changeHalf(1)}
                className={`btn btn-sm ${
                  matchState.timer.currentHalf === 1
                    ? "btn-primary"
                    : "btn-outline"
                }`}
              >
                1st Half
              </button>
              <button
                onClick={() => changeHalf("HT")}
                className={`btn btn-sm ${
                  matchState.timer.currentHalf === "HT"
                    ? "btn-primary"
                    : "btn-outline"
                }`}
              >
                Half Time
              </button>
              <button
                onClick={() => changeHalf(2)}
                className={`btn btn-sm ${
                  matchState.timer.currentHalf === 2
                    ? "btn-primary"
                    : "btn-outline"
                }`}
              >
                2nd Half
              </button>
              <button
                onClick={() => changeHalf("FT")}
                className={`btn btn-sm ${
                  matchState.timer.currentHalf === "FT"
                    ? "btn-primary"
                    : "btn-outline"
                }`}
              >
                Full Time
              </button>
            </div>
          </div>
        </div>

        {/* Score Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl justify-center mb-6">
              Score Control
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Home Team */}
              <div className="text-center">
                <div className="bg-primary text-primary-content rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-lg mb-2">
                    {matchData.homeTeam.teamTriCode}
                  </h3>
                  <div className="text-5xl font-bold">
                    {matchState.homeScore}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="btn-group grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateScore("home", 1)}
                      className="btn btn-success btn-sm"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore("home", -1)}
                      className="btn btn-error btn-sm"
                    >
                      -1
                    </button>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => quickScore("home", "try")}
                      className="btn btn-info btn-sm w-full"
                    >
                      Try (+5)
                    </button>
                    <button
                      onClick={() => quickScore("home", "conversion")}
                      className="btn btn-secondary btn-sm w-full"
                    >
                      Conversion (+2)
                    </button>
                    <button
                      onClick={() => quickScore("home", "panelty")}
                      className="btn btn-warning btn-sm w-full"
                    >
                      Penalty (+3)
                    </button>
                    <button
                      onClick={() => quickScore("home", "drop goal")}
                      className="btn btn-accent btn-sm w-full"
                    >
                      Drop Goal (+3)
                    </button>
                  </div>
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="bg-secondary text-secondary-content rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-lg mb-2">
                    {matchData.awayTeam.teamTriCode}
                  </h3>
                  <div className="text-5xl font-bold">
                    {matchState.awayScore}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="btn-group grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateScore("away", 1)}
                      className="btn btn-success btn-sm"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore("away", -1)}
                      className="btn btn-error btn-sm"
                    >
                      -1
                    </button>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => quickScore("away", "try")}
                      className="btn btn-info btn-sm w-full"
                    >
                      Try (+5)
                    </button>
                    <button
                      onClick={() => quickScore("away", "conversion")}
                      className="btn btn-secondary btn-sm w-full"
                    >
                      Conversion (+2)
                    </button>
                    <button
                      onClick={() => quickScore("away", "panelty")}
                      className="btn btn-warning btn-sm w-full"
                    >
                      Penalty (+3)
                    </button>
                    <button
                      onClick={() => quickScore("away", "drop goal")}
                      className="btn btn-accent btn-sm w-full"
                    >
                      Drop Goal (+3)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section - UPDATED! */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-xl">Match Events</h2>
              <button onClick={openLogModal} className="btn btn-primary btn-sm">
                Add Event
              </button>
            </div>

            <div className="divider my-2"></div>

            <div className="flex-1 overflow-y-auto max-h-96">
              {matchLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-base-content/60">No match events yet</p>
                  <p className="text-sm text-base-content/40 mt-2">
                    Use quick score buttons or add custom events
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchLogs.map((log, index) => (
                    <div
                      key={log.matchLogID || `log-${index}`}
                      className="card card-compact bg-base-200 shadow-sm"
                    >
                      <div className="card-body">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {getEventIcon(log.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span
                                  className={`badge ${getEventColor(
                                    log.type
                                  )} badge-sm`}
                                >
                                  {log.type.toUpperCase()}
                                </span>
                                <span
                                  style={{
                                    background:
                                      log.team === "home"
                                        ? matchData.homeTeam.color_1
                                        : matchData.awayTeam.color_1,
                                  }}
                                  className="badge badge-sm"
                                >
                                  {log.team === "home"
                                    ? matchData.homeTeam.teamTriCode
                                    : matchData.awayTeam.teamTriCode}
                                </span>
                              </div>

                              <div className="text-sm">
                                {log.player.PlayerName &&
                                  log.player.PlayerName !== "Auto" && (
                                    <span className="font-medium">
                                      #{log.player.PlayerJerseyNumber}{" "}
                                      {log.player.PlayerName}
                                    </span>
                                  )}
                                {log.description && (
                                  <p className="text-xs text-base-content/70 mt-1">
                                    {log.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-center flex gap-2 justify-end">
                            <div className="flex-1 flex flex-col gap-2 items-center justify-center">
                              <div className="text-sm font-mono font-bold mb-1">
                                {log.minute}'
                              </div>
                              <div className="text-xs text-base-content/50">
                                {new Date(log.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button className="btn btn-sm btn-outline btn-square btn-warning">
                                <Edit className="size-4" />
                              </button>
                              <button className="btn btn-sm btn-outline btn-square btn-error" onClick={() => {deleteLog(log.matchLogID)}}>
                                {" "}
                                <Trash className="size-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-md">
            <h3 className="font-bold text-lg mb-4">Add Match Event</h3>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Minute</span>
                </label>
                <input
                  type="number"
                  value={logForm.minute}
                  onChange={(e) =>
                    setLogForm((prev) => ({
                      ...prev,
                      minute: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Event Type</span>
                </label>
                <select
                  value={logForm.type}
                  onChange={(e) =>
                    setLogForm((prev) => ({
                      ...prev,
                      type: e.target.value as MatchLogDoc["type"],
                    }))
                  }
                  className="select select-bordered"
                >
                  <option value="try">Try</option>
                  <option value="conversion">Conversion</option>
                  <option value="panelty">Penalty</option>
                  <option value="drop goal">Drop Goal</option>
                  <option value="yellow card">Yellow Card</option>
                  <option value="red card">Red Card</option>
                  <option value="player replacement">Substitution</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Team</span>
                </label>
                <select
                  value={logForm.team}
                  onChange={(e) =>
                    setLogForm((prev) => ({
                      ...prev,
                      team: e.target.value as "home" | "away",
                    }))
                  }
                  className="select select-bordered"
                >
                  <option value="home">
                    Home ({matchData.homeTeam.teamTriCode})
                  </option>
                  <option value="away">
                    Away ({matchData.awayTeam.teamTriCode})
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Player Name</span>
                  </label>
                  <input
                    type="text"
                    value={logForm.playerName}
                    onChange={(e) =>
                      setLogForm((prev) => ({
                        ...prev,
                        playerName: e.target.value,
                      }))
                    }
                    className="input input-bordered"
                    placeholder="Player name"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Jersey #</span>
                  </label>
                  <input
                    type="number"
                    value={logForm.playerNumber}
                    onChange={(e) =>
                      setLogForm((prev) => ({
                        ...prev,
                        playerNumber: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="input input-bordered"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  value={logForm.description}
                  onChange={(e) =>
                    setLogForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="textarea textarea-bordered h-20"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowLogModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={submitLog} className="btn btn-primary">
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RugbyScorekeeper;
