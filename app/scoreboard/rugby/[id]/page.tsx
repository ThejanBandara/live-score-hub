'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { MatchDoc, MatchStateDoc, MatchLogDoc } from '@/types/RugbyMatch';

const RugbyListener = () => {
  const params = useParams();
  const matchId = params.id as string;

  const [matchData, setMatchData] = useState<MatchDoc | null>(null);
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [matchLogs, setMatchLogs] = useState<MatchLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setError('No match ID provided');
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    try {
      console.log('Setting up listeners for match ID:', matchId);

      // Listen to Match Document
      const matchDocRef = doc(db, 'matches', matchId);
      const unsubMatch = onSnapshot(
        matchDocRef,
        (doc) => {
          console.log('Match document update:', doc.exists());
          if (doc.exists()) {
            setMatchData(doc.data() as MatchDoc);
          } else {
            setError('Match not found');
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to match doc:', err);
          setError(`Match doc error: ${err.message}`);
          setLoading(false);
        }
      );
      unsubscribes.push(unsubMatch);

      // Listen to Match State Document (separate collection)
      const matchStateRef = doc(db, 'matchStates', matchId);
      const unsubState = onSnapshot(
        matchStateRef,
        (doc) => {
          console.log('Match state update:', doc.exists());
          if (doc.exists()) {
            setMatchState(doc.data() as MatchStateDoc);
          } else {
            console.log('Match state document does not exist');
            setMatchState(null);
          }
        },
        (err) => {
          console.error('Error listening to match state:', err);
          setError(`Match state error: ${err.message}`);
        }
      );
      unsubscribes.push(unsubState);

      // Listen to Match Logs Collection (root collection, filter by rugbyMatchID)
      const logsQuery = query(
        collection(db, 'matchLogs'),
        // Note: We'll need to add a where clause once you create some logs with rugbyMatchID
        orderBy('createdAt', 'desc')
      );
      const unsubLogs = onSnapshot(
        logsQuery,
        (snapshot) => {
          console.log('Match logs update, total count:', snapshot.docs.length);
          // Filter logs for this specific match using rugbyMatchID
          const logs = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                ...data,
                matchLogID: data.matchLogID || doc.id,
              } as MatchLogDoc;
            })
            .filter(log => log.rugbyMatchID === matchId);
          
          console.log('Filtered logs for match:', logs.length);
          setMatchLogs(logs);
        },
        (err) => {
          console.error('Error listening to match logs:', err);
          // Don't set error for logs since collection might not exist yet
          console.log('Match logs collection might not exist yet - this is normal');
        }
      );
      unsubscribes.push(unsubLogs);

    } catch (err) {
      console.error('Setup error:', err);
      setError(`Setup error: ${err}`);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up listeners');
      unsubscribes.forEach(unsub => unsub());
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-lg">Loading match data for ID: {matchId}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-100 border border-red-400 rounded">
        <p className="text-red-700 font-semibold">Error: {error}</p>
        <p className="text-sm text-gray-600 mt-2">Match ID: {matchId}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Rugby Match Listener - ID: {matchId}</h1>
      
      {/* Match Document */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">Match Document</h2>
        {matchData ? (
          <div className="space-y-2">
            <p><strong>Tournament:</strong> {matchData.tournamentName}</p>
            <p><strong>Date:</strong> {matchData.matchDate}</p>
            <p><strong>Venue:</strong> {matchData.venue}</p>
            <p><strong>Status:</strong> {matchData.status}</p>
            <p><strong>Home Team:</strong> {matchData.homeTeam.teamName} ({matchData.homeTeam.teamTriCode})</p>
            <p><strong>Away Team:</strong> {matchData.awayTeam.teamName} ({matchData.awayTeam.teamTriCode})</p>
            <p><strong>Officials:</strong> {matchData.matchOfficials.join(', ')}</p>
            <p><strong>Commentators:</strong> {matchData.matchCommentators.join(', ')}</p>
            <p><strong>Created At:</strong> {matchData.createdAt}</p>
            <p><strong>Updated At:</strong> {matchData.updatedAt}</p>
          </div>
        ) : (
          <p className="text-gray-500">No match document data</p>
        )}
      </div>

      {/* Match State Document */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3 text-green-600">Match State Document</h2>
        {matchState ? (
          <div className="space-y-2">
            <p><strong>Home Score:</strong> {matchState.homeScore}</p>
            <p><strong>Away Score:</strong> {matchState.awayScore}</p>
            <p><strong>Current Half:</strong> {matchState.timer.currentHalf}</p>
            <p><strong>Timer Running:</strong> {matchState.timer.isRunning ? 'Yes' : 'No'}</p>
            <p><strong>Total Game Time:</strong> {matchState.timer.totalGameTime} seconds</p>
            <p><strong>Timer Offset:</strong> {matchState.timer.offset} seconds</p>
            <p><strong>Started At:</strong> {matchState.timer.startedAt ? new Date(matchState.timer.startedAt).toLocaleString() : 'Not started'}</p>
            <p><strong>Weather:</strong> {matchState.weather.condition}, {matchState.weather.temp}°C</p>
            <p><strong>Cards (Home):</strong> Yellow: {matchState.yellowCardsHome}, Red: {matchState.redCardsHome}</p>
            <p><strong>Cards (Away):</strong> Yellow: {matchState.yellowCardsAway}, Red: {matchState.redCardsAway}</p>
            <p><strong>Last Synced:</strong> {matchState.lastSyncedAt}</p>
          </div>
        ) : (
          <p className="text-gray-500">No match state document data</p>
        )}
      </div>

      {/* Match Logs Collection */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3 text-purple-600">Match Logs ({matchLogs.length} entries)</h2>
        {matchLogs.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matchLogs.map((log, index) => (
              <div key={log.matchLogID || index} className="bg-gray-50 p-3 rounded border-l-4 border-purple-400">
                <p><strong>Log ID:</strong> {log.matchLogID}</p>
                <p><strong>Minute:</strong> {log.minute}'</p>
                <p><strong>Type:</strong> {log.type}</p>
                <p><strong>Team:</strong> {log.team}</p>
                <p><strong>Player:</strong> {log.player.PlayerName} (#{log.player.PlayerJerseyNumber})</p>
                <p><strong>Description:</strong> {log.description}</p>
                <p><strong>Created At:</strong> {log.createdAt}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No match logs available</p>
        )}
      </div>
    </div>
  );
};

export default RugbyListener;