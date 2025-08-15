"use client";

import { useEffect, useState } from "react";
import { MatchDoc, MatchStateDoc, rugbyPlayer } from "@/types/RugbyMatch";
import { db } from "@/utils/firebase";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import toast from "react-hot-toast";

interface ScoreKeeperProps {
  params: { id: string | string[] };
}

export default function ScoreKeeper({ params }: ScoreKeeperProps) {
  // Ensure matchId is always a string
  const matchId = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!matchId) return <div className="p-4">No match ID provided</div>;

  const [match, setMatch] = useState<MatchDoc | null>(null);
  const [matchState, setMatchState] = useState<MatchStateDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch match and matchState from Firestore
  useEffect(() => {
    const matchRef = doc(db, "matches", matchId);
    const matchStateRef = doc(db, "matchStates", matchId);

    const unsubMatch = onSnapshot(matchRef, (snapshot) => {
      if (snapshot.exists()) setMatch(snapshot.data() as MatchDoc);
    });

    const unsubState = onSnapshot(matchStateRef, (snapshot) => {
      if (snapshot.exists()) setMatchState(snapshot.data() as MatchStateDoc);
      setLoading(false);
    });

    return () => {
      unsubMatch();
      unsubState();
    };
  }, [matchId]);

  if (loading || !match || !matchState)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  // Firestore update helpers
  const updateScore = async (team: "home" | "away", type: "try" | "conversion" | "panelty" | "dropGoals") => {
    const stateRef = doc(db, "matchStates", matchId);
    let field = "";
    switch (type) {
      case "try":
        field = team === "home" ? "homeScore" : "awayScore";
        await updateDoc(stateRef, { [field]: increment(5) });
        break;
      case "conversion":
        field = team === "home" ? "homeScore" : "awayScore";
        await updateDoc(stateRef, { [field]: increment(2) });
        break;
      case "panelty":
        field = team === "home" ? "homeScore" : "awayScore";
        await updateDoc(stateRef, { [field]: increment(3) });
        break;
      case "dropGoals":
        field = team === "home" ? "homeScore" : "awayScore";
        await updateDoc(stateRef, { [field]: increment(3) });
        break;
    }
  };

  const updateCard = async (team: "home" | "away", type: "yellow" | "red") => {
    const stateRef = doc(db, "matchStates", matchId);
    if (team === "home") {
      if (type === "yellow") await updateDoc(stateRef, { yellowCardsHome: increment(1) });
      if (type === "red") await updateDoc(stateRef, { redCardsHome: increment(1) });
    } else {
      if (type === "yellow") await updateDoc(stateRef, { yellowCardsAway: increment(1) });
      if (type === "red") await updateDoc(stateRef, { redCardsAway: increment(1) });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">{match.tournamentName} - ScoreKeeper</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team */}
        <div className="card bg-base-200 border border-primary-content/50 shadow-md">
          <div className="card-body">
            <h2 className="card-title">{match.homeTeam.teamName} ({match.homeTeam.teamTriCode})</h2>
            <img src={match.homeTeam.logoUrl} alt="Home Logo" className="w-20 h-20 object-contain" />
            <p className="text-xl font-bold">Score: {matchState.homeScore}</p>
            <p className="text-sm text-yellow-500">Yellow Cards: {matchState.yellowCardsHome}</p>
            <p className="text-sm text-red-500">Red Cards: {matchState.redCardsHome}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button className="btn btn-success btn-sm" onClick={() => updateScore("home", "try")}>Try +5</button>
              <button className="btn btn-success btn-sm" onClick={() => updateScore("home", "conversion")}>Conversion +2</button>
              <button className="btn btn-warning btn-sm" onClick={() => updateScore("home", "panelty")}>Penalty +3</button>
              <button className="btn btn-info btn-sm" onClick={() => updateScore("home", "dropGoals")}>Drop Goal +3</button>
              <button className="btn btn-yellow btn-sm" onClick={() => updateCard("home", "yellow")}>Yellow Card</button>
              <button className="btn btn-error btn-sm" onClick={() => updateCard("home", "red")}>Red Card</button>
            </div>
          </div>
        </div>

        {/* Away Team */}
        <div className="card bg-base-200 border border-primary-content/50 shadow-md">
          <div className="card-body">
            <h2 className="card-title">{match.awayTeam.teamName} ({match.awayTeam.teamTriCode})</h2>
            <img src={match.awayTeam.logoUrl} alt="Away Logo" className="w-20 h-20 object-contain" />
            <p className="text-xl font-bold">Score: {matchState.awayScore}</p>
            <p className="text-sm text-yellow-500">Yellow Cards: {matchState.yellowCardsAway}</p>
            <p className="text-sm text-red-500">Red Cards: {matchState.redCardsAway}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button className="btn btn-success btn-sm" onClick={() => updateScore("away", "try")}>Try +5</button>
              <button className="btn btn-success btn-sm" onClick={() => updateScore("away", "conversion")}>Conversion +2</button>
              <button className="btn btn-warning btn-sm" onClick={() => updateScore("away", "panelty")}>Penalty +3</button>
              <button className="btn btn-info btn-sm" onClick={() => updateScore("away", "dropGoals")}>Drop Goal +3</button>
              <button className="btn btn-yellow btn-sm" onClick={() => updateCard("away", "yellow")}>Yellow Card</button>
              <button className="btn btn-error btn-sm" onClick={() => updateCard("away", "red")}>Red Card</button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Info */}
      <div className="card bg-base-200 border border-primary-content/50 shadow-md p-4">
        <p className="text-center font-medium">Venue: {match.venue}</p>
        <p className="text-center font-medium">Date: {new Date(match.matchDate).toLocaleString()}</p>
        <p className="text-center font-medium">Status: {match.status.toUpperCase()}</p>
        <p className="text-center font-medium">Weather: {matchState.weather?.condition}, Temp: {matchState.weather?.temp}°C, Wind: {matchState.weather?.windSpeed} km/h</p>
      </div>
      
    </div>
  );
}
