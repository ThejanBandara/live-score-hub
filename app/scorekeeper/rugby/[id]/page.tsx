'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { MatchDoc, MatchStateDoc, MatchLogDoc, rugbyPlayer } from '@/types/RugbyMatch';

const RugbyScorekeeper = () => {
  const params = useParams();
  const matchId = params.id as string;

  const [matchData, setMatchData] = useState<MatchDoc | null>(null);
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    minute: 0,
    type: 'try' as MatchLogDoc['type'],
    team: 'home' as 'home' | 'away',
    playerName: '',
    playerNumber: 1,
    description: ''
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
      setError('No match ID provided');
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    const matchDocRef = doc(db, 'matches', matchId);
    const unsubMatch = onSnapshot(matchDocRef, (doc) => {
      if (doc.exists()) {
        setMatchData(doc.data() as MatchDoc);
      } else {
        setError('Match not found');
      }
      setLoading(false);
    });
    unsubscribes.push(unsubMatch);

    const matchStateRef = doc(db, 'matchStates', matchId);
    const unsubState = onSnapshot(matchStateRef, (doc) => {
      if (doc.exists()) {
        setMatchState(doc.data() as MatchStateDoc);
      }
    });
    unsubscribes.push(unsubState);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [matchId]);

  // Timer functions
  const startTimer = async () => {
    if (!matchState) return;
    
    await updateDoc(doc(db, 'matchStates', matchId), {
      'timer.isRunning': true,
      'timer.startedAt': Date.now(),
      lastSyncedAt: new Date().toISOString()
    });
  };

  const pauseTimer = async () => {
    if (!matchState) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - (matchState.timer.startedAt || now)) / 1000);
    const newOffset = matchState.timer.offset + elapsed;

    await updateDoc(doc(db, 'matchStates', matchId), {
      'timer.isRunning': false,
      'timer.pausedAt': now,
      'timer.offset': newOffset,
      'timer.totalGameTime': newOffset,
      lastSyncedAt: new Date().toISOString()
    });
  };

  const resetTimer = async () => {
    await updateDoc(doc(db, 'matchStates', matchId), {
      'timer.isRunning': false,
      'timer.startedAt': null,
      'timer.pausedAt': null,
      'timer.offset': 0,
      'timer.totalGameTime': 0,
      lastSyncedAt: new Date().toISOString()
    });
  };

  const changeHalf = async (half: 1 | 2 | 'HT' | 'FT') => {
    await updateDoc(doc(db, 'matchStates', matchId), {
      'timer.currentHalf': half,
      'timer.isRunning': false,
      lastSyncedAt: new Date().toISOString()
    });
  };

  // Score functions
  const updateScore = async (team: 'home' | 'away', change: number) => {
    if (!matchState) return;
    
    const currentScore = team === 'home' ? matchState.homeScore : matchState.awayScore;
    const newScore = Math.max(0, currentScore + change);
    
    await updateDoc(doc(db, 'matchStates', matchId), {
      [team === 'home' ? 'homeScore' : 'awayScore']: newScore,
      lastSyncedAt: new Date().toISOString()
    });
  };

  const quickScore = async (team: 'home' | 'away', type: 'try' | 'conversion' | 'panelty' | 'drop goal') => {
    const points = {
      'try': 5,
      'conversion': 2,
      'panelty': 3,
      'drop goal': 3
    };
    
    await updateScore(team, points[type]);
    
    const minute = Math.floor(currentTime / 60);
    await addDoc(collection(db, 'matchLogs'), {
      rugbyMatchID: matchId,
      matchLogID: `${matchId}_${Date.now()}`,
      minute,
      type,
      team,
      player: { PlayerName: 'Auto', PlayerJerseyNumber: 0, playerID: 0, Position: '', isCaption: false, isSubstitiudePlayer: false },
      description: `${type} scored by ${team} team`,
      createdAt: new Date().toISOString()
    });
  };

  // Log functions
  const openLogModal = () => {
    setLogForm(prev => ({
      ...prev,
      minute: Math.floor(currentTime / 60)
    }));
    setShowLogModal(true);
  };

  const submitLog = async () => {
    const logData: Omit<MatchLogDoc, 'matchLogID'> = {
      rugbyMatchID: matchId,
      minute: logForm.minute,
      type: logForm.type,
      team: logForm.team,
      player: {
        PlayerName: logForm.playerName,
        PlayerJerseyNumber: logForm.playerNumber,
        playerID: Date.now(),
        Position: '',
        isCaption: false,
        isSubstitiudePlayer: false
      },
      description: logForm.description,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'matchLogs'), {
      ...logData,
      matchLogID: `${matchId}_${Date.now()}`
    });

    setShowLogModal(false);
    setLogForm({
      minute: 0,
      type: 'try',
      team: 'home',
      playerName: '',
      playerNumber: 1,
      description: ''
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error || 'Match data not available'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body p-4">
          <h1 className="text-3xl font-bold text-center">
            {matchData.homeTeam.teamTriCode} vs {matchData.awayTeam.teamTriCode}
          </h1>
          <p className="text-center text-base-content/70">{matchData.tournamentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Timer Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl justify-center mb-6">Timer Control</h2>
            
            <div className="text-center mb-8">
              <div className="text-7xl font-mono font-bold text-primary mb-2">
                {formatTime(currentTime)}
              </div>
              <div className="text-xl font-semibold mb-2">
                {matchState.timer.currentHalf === 1 && "1st Half"}
                {matchState.timer.currentHalf === 2 && "2nd Half"}
                {matchState.timer.currentHalf === 'HT' && "Half Time"}
                {matchState.timer.currentHalf === 'FT' && "Full Time"}
              </div>
              <div className={`badge badge-lg ${
                matchState.timer.isRunning ? 'badge-success' : 'badge-error'
              }`}>
                {matchState.timer.isRunning ? 'RUNNING' : 'PAUSED'}
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
                  matchState.timer.currentHalf === 1 ? 'btn-primary' : 'btn-outline'
                }`}
              >
                1st Half
              </button>
              <button
                onClick={() => changeHalf('HT')}
                className={`btn btn-sm ${
                  matchState.timer.currentHalf === 'HT' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                Half Time
              </button>
              <button
                onClick={() => changeHalf(2)}
                className={`btn btn-sm ${
                  matchState.timer.currentHalf === 2 ? 'btn-primary' : 'btn-outline'
                }`}
              >
                2nd Half
              </button>
              <button
                onClick={() => changeHalf('FT')}
                className={`btn btn-sm ${
                  matchState.timer.currentHalf === 'FT' ? 'btn-primary' : 'btn-outline'
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
            <h2 className="card-title text-2xl justify-center mb-6">Score Control</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Home Team */}
              <div className="text-center">
                <div className="bg-primary text-primary-content rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-lg mb-2">{matchData.homeTeam.teamTriCode}</h3>
                  <div className="text-5xl font-bold">{matchState.homeScore}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="btn-group grid grid-cols-2">
                    <button
                      onClick={() => updateScore('home', 1)}
                      className="btn btn-success btn-sm"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore('home', -1)}
                      className="btn btn-error btn-sm"
                    >
                      -1
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => quickScore('home', 'try')}
                      className="btn btn-info btn-sm w-full"
                    >
                      Try (+5)
                    </button>
                    <button
                      onClick={() => quickScore('home', 'conversion')}
                      className="btn btn-secondary btn-xs w-full"
                    >
                      Conversion (+2)
                    </button>
                    <button
                      onClick={() => quickScore('home', 'panelty')}
                      className="btn btn-warning btn-xs w-full"
                    >
                      Penalty (+3)
                    </button>
                    <button
                      onClick={() => quickScore('home', 'drop goal')}
                      className="btn btn-accent btn-xs w-full"
                    >
                      Drop Goal (+3)
                    </button>
                  </div>
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="bg-secondary text-secondary-content rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-lg mb-2">{matchData.awayTeam.teamTriCode}</h3>
                  <div className="text-5xl font-bold">{matchState.awayScore}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="btn-group grid grid-cols-2">
                    <button
                      onClick={() => updateScore('away', 1)}
                      className="btn btn-success btn-sm"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore('away', -1)}
                      className="btn btn-error btn-sm"
                    >
                      -1
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => quickScore('away', 'try')}
                      className="btn btn-info btn-sm w-full"
                    >
                      Try (+5)
                    </button>
                    <button
                      onClick={() => quickScore('away', 'conversion')}
                      className="btn btn-secondary btn-xs w-full"
                    >
                      Conversion (+2)
                    </button>
                    <button
                      onClick={() => quickScore('away', 'panelty')}
                      className="btn btn-warning btn-xs w-full"
                    >
                      Penalty (+3)
                    </button>
                    <button
                      onClick={() => quickScore('away', 'drop goal')}
                      className="btn btn-accent btn-xs w-full"
                    >
                      Drop Goal (+3)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-xl">Match Events</h2>
              <button
                onClick={openLogModal}
                className="btn btn-primary btn-sm"
              >
                Add Event
              </button>
            </div>

            <div className="divider my-2"></div>

            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-base-content/60">Match events will appear here</p>
              <p className="text-sm text-base-content/40 mt-2">
                Use quick score buttons or add custom events
              </p>
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
                  onChange={(e) => setLogForm(prev => ({ ...prev, minute: parseInt(e.target.value) || 0 }))}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Event Type</span>
                </label>
                <select
                  value={logForm.type}
                  onChange={(e) => setLogForm(prev => ({ ...prev, type: e.target.value as MatchLogDoc['type'] }))}
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
                  onChange={(e) => setLogForm(prev => ({ ...prev, team: e.target.value as 'home' | 'away' }))}
                  className="select select-bordered"
                >
                  <option value="home">Home ({matchData.homeTeam.teamTriCode})</option>
                  <option value="away">Away ({matchData.awayTeam.teamTriCode})</option>
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
                    onChange={(e) => setLogForm(prev => ({ ...prev, playerName: e.target.value }))}
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
                    onChange={(e) => setLogForm(prev => ({ ...prev, playerNumber: parseInt(e.target.value) || 1 }))}
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
                  onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
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
              <button
                onClick={submitLog}
                className="btn btn-primary"
              >
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