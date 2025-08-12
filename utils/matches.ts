import { db } from "@/utils/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { MatchDoc, MatchStateDoc, MatchLogDoc } from "@/types/RugbyMatch";

/**
 * ==============
 * MATCHES
 * ==============
 */

// Create a new match (and its state)
export async function createMatch(match: MatchDoc, state: MatchStateDoc) {
  try {
    const matchRef = doc(collection(db, "matches"));
    const matchId = matchRef.id;

    await setDoc(matchRef, {
      ...match,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, "matchStates", matchId), {
      ...state,
      lastSyncedAt: new Date().toISOString()
    });

    return matchId;
  } catch (err) {
    throw new Error(`Failed to create match: ${(err as Error).message}`);
  }
}

// Update match doc
export async function updateMatch(matchId: string, data: Partial<MatchDoc>) {
  try {
    const matchRef = doc(db, "matches", matchId);
    await updateDoc(matchRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    throw new Error(`Failed to update match ${matchId}: ${(err as Error).message}`);
  }
}

// Delete match + state
export async function deleteMatch(matchId: string) {
  try {
    await deleteDoc(doc(db, "matches", matchId));
    await deleteDoc(doc(db, "matchStates", matchId));
    // Logs will be left in place unless we explicitly delete them (could be a batch job)
  } catch (err) {
    throw new Error(`Failed to delete match ${matchId}: ${(err as Error).message}`);
  }
}

// Get all matches
export async function listMatches() {
  try {
    const snap = await getDocs(collection(db, "matches"));
    return snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as (MatchDoc & { id: string })[];
  } catch (err) {
    throw new Error(`Failed to list matches: ${(err as Error).message}`);
  }
}

// Get single match by ID
export async function getMatchById(matchId: string) {
  try {
    const snap = await getDoc(doc(db, "matches", matchId));
    if (!snap.exists()) throw new Error("Match not found");
    return { id: snap.id, ...snap.data() } as MatchDoc & { id: string };
  } catch (err) {
    throw new Error(`Failed to get match ${matchId}: ${(err as Error).message}`);
  }
}

/**
 * ==============
 * STATES
 * ==============
 */
export async function updateMatchState(matchId: string, data: Partial<MatchStateDoc>) {
  try {
    const stateRef = doc(db, "matchStates", matchId);
    await updateDoc(stateRef, {
      ...data,
      lastSyncedAt: new Date().toISOString()
    });
  } catch (err) {
    throw new Error(`Failed to update match state for ${matchId}: ${(err as Error).message}`);
  }
}

/**
 * ==============
 * LOGS
 * ==============
 */

// Add a log entry
export async function addMatchLog(matchId: string, log: MatchLogDoc) {
  try {
    const logRef = doc(collection(db, "matchLogs", matchId, "logs"));
    await setDoc(logRef, {
      ...log,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    throw new Error(`Failed to add log for match ${matchId}: ${(err as Error).message}`);
  }
}

// List logs for a match
export async function listLogs(matchId: string) {
  try {
    const q = query(
      collection(db, "matchLogs", matchId, "logs"),
      orderBy("minute", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as (MatchLogDoc & { id: string })[];
  } catch (err) {
    throw new Error(`Failed to list logs for match ${matchId}: ${(err as Error).message}`);
  }
}

// Get single log by ID
export async function getLogById(matchId: string, logId: string) {
  try {
    const snap = await getDoc(doc(db, "matchLogs", matchId, "logs", logId));
    if (!snap.exists()) throw new Error("Log not found");
    return { id: snap.id, ...snap.data() } as MatchLogDoc & { id: string };
  } catch (err) {
    throw new Error(`Failed to get log ${logId} for match ${matchId}: ${(err as Error).message}`);
  }
}

// Delete log
export async function deleteMatchLog(matchId: string, logId: string) {
  try {
    await deleteDoc(doc(db, "matchLogs", matchId, "logs", logId));
  } catch (err) {
    throw new Error(`Failed to delete log ${logId} for match ${matchId}: ${(err as Error).message}`);
  }
}
