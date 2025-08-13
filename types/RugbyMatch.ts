
export interface MatchDoc {
  tournamentName: string;
  rugbyMatchID: string;
  matchDate: string;
  venue: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  homeTeam: TeamCard;
  awayTeam: TeamCard;
  matchOfficials: string[];
  matchCommentators: string[];
  createdAt: string; // ISO or Timestamp.toDate().toISOString()
  updatedAt: string;
}

// Match States Collection
export interface MatchStateDoc {
  homeScore: number;
  awayScore: number;
  weather: weatherInfo;
  timer: MatchTimer;
  lastSyncedAt: string;
  yellowCardsHome: number;
  redCardsHome: number;
  yellowCardsAway: number;
  redCardsAway: number;
}

// Match Logs Collection
export interface MatchLogDoc {
  matchLogID: string;
  minute: number;
  type: "try" | "conversion" | "panelty" | "drop goal" | "yellow card" | "red card" | "player replacement";
  team: "home" | "away";
  player: rugbyPlayer;
  description: string;
  createdAt: string;
}

export interface TeamCard {
    teamName: string;
    teamTriCode: string;
    logoUrl: string;
    color_1: string;
    color_2: string;
    players: rugbyPlayer[];
    packWeight: number;
    yellowCards: number;
    redCards: number;
    tries: number;
    conversions: number;
    panelties: number;
    dropGoals: number;
    replacements: PlayerReplacement[];
}

export interface rugbyPlayer {
    playerID: number;
    PlayerName: string;
    PlayerJerseyNumber: number;
    Position: string;
    isCaption: boolean;
    isSubstitiudePlayer: boolean;
}

export interface PlayerReplacement {
    playerName: string | number | readonly string[] | undefined;
    replacementID: number;
    outgoingPlayerID: number;
    incomingPlayerID: number;
    gameTime: number; // in minitues
}

export interface weatherInfo {
    condition: string;
    temp: number;
    humidity: number;
    windSpeed: number;
}

export interface MatchTimer {
  startedAt: number | null;
  pausedAt: number | null;
  isRunning: boolean;
  offset: number;
  currentHalf: 1 | 2 | "HT" | "FT";
  totalGameTime: number;
  timerType: "countup" | "countdown";
}

export interface MatchLog {
    matchLogID: number;
    minute: number;
    type: "try" | "conversion" | "panelty" | "drop goal" | "yellow card" | "red card" | "player replacement";
    team: string;
    player: rugbyPlayer;
    description: string;
    createdAt: string;
}