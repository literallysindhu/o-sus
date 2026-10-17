import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously as firebaseSignInAnonymously, type User } from 'firebase/auth'
import {
  getDatabase,
  get,
  set,
  onValue,
  onDisconnect,
  remove,
  ref,
  runTransaction,
  type Database,
} from 'firebase/database'

export type GamePhase = 'lobby' | 'hint' | 'discuss' | 'vote' | 'result'
export type GameMode = 'dsa' | 'classic'

export interface RoomPlayer {
  name: string
  joinedAt: number
  alive?: boolean
  hint?: string
  vote?: string
  isBot?: boolean
}

export interface RevealedImposter {
  uid: string
  name: string
  problemTitle: string
  decoyTitle: string
}

import { DEFAULT_SETTINGS, type RoomSettings } from './game/settings'

export interface GameRoom {
  hostUid: string
  phase: GamePhase
  createdAt: number
  round?: number
  phaseEndsAt?: number | null
  players: Record<string, RoomPlayer>
  winner?: 'crew' | 'imposter' | null
  revealedImposter?: RevealedImposter | null
  settings?: RoomSettings
  gameMode?: GameMode
}

export interface PlayerSecret {
  role: 'crew' | 'imposter'
  title: string
  statement: string
}

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function isConfiguredValue(value: string): boolean {
  const normalized = value.trim()
  return normalized.length > 0 && !/^(your[-_]|replace[-_]|<)/i.test(normalized)
}

export const firebaseConfigured = [
  config.apiKey,
  config.authDomain,
  config.databaseURL,
  config.projectId,
  config.appId,
].every((value) => typeof value === 'string' && isConfiguredValue(value))

export const app = firebaseConfigured ? initializeApp(config) : null
export const auth = app ? getAuth(app) : null
export const database: Database | null = app ? getDatabase(app) : null
let pendingAnonymousSignIn: Promise<User> | null = null

export async function signInAnonymously(): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured.')
  if (auth.currentUser) return auth.currentUser

  if (!pendingAnonymousSignIn) {
    pendingAnonymousSignIn = firebaseSignInAnonymously(auth).then(
      (credential) => credential.user,
    )
  }

  const attempt = pendingAnonymousSignIn
  try {
    return await attempt
  } finally {
    if (pendingAnonymousSignIn === attempt) pendingAnonymousSignIn = null
  }
}

function createRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const randomBytes = new Uint8Array(5)
  crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export async function createRoom(
  uid: string,
  name: string,
  settings?: RoomSettings,
  gameMode: GameMode = 'dsa',
): Promise<string> {
  if (!database) throw new Error('Firebase is not configured.')

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createRoomCode()
    const roomRef = ref(database, `rooms/${code}`)
    const result = await runTransaction(
      roomRef,
      (current: GameRoom | null) =>
        current === null
          ? {
              hostUid: uid,
              phase: 'lobby',
              createdAt: Date.now(),
              round: 1,
              players: {
                [uid]: { name, joinedAt: Date.now(), alive: true },
              },
              settings: settings ?? DEFAULT_SETTINGS,
              gameMode,
            }
          : undefined,
      { applyLocally: false },
    )
    if (result.committed) return code
  }

  throw new Error('Could not find an available room code. Please try again.')
}

export async function updateRoomSettings(
  database: Database,
  code: string,
  settings: RoomSettings,
): Promise<void> {
  await set(ref(database, `rooms/${code}/settings`), settings)
}

export async function joinRoom(code: string, uid: string, name: string): Promise<void> {
  if (!database) throw new Error('Firebase is not configured.')

  const roomSnapshot = await get(ref(database, `rooms/${code}`))
  const room = parseRoom(roomSnapshot.val())
  if (!room) throw new Error('Room not found. Check the code and try again.')
  if (room.phase !== 'lobby') throw new Error('This game has already started.')
  if (room.players[uid]) return
  if (Object.keys(room.players).length >= 10) throw new Error('This room is full.')

  const playerRef = ref(database, `rooms/${code}/players/${uid}`)
  const result = await runTransaction(
    playerRef,
    (current: RoomPlayer | null) =>
      current === null ? { name, joinedAt: Date.now(), alive: true } : undefined,
    { applyLocally: false },
  )
  if (!result.committed) {
    throw new Error('Could not join this room. It may be full or already started.')
  }

  const secretRef = ref(database, `roomSecrets/${code}/${uid}`)
  const playerDisconnect = onDisconnect(playerRef)
  const secretDisconnect = onDisconnect(secretRef)
  try {
    await playerDisconnect.remove()
    await secretDisconnect.remove()
  } catch (error) {
    await Promise.allSettled([
      playerDisconnect.cancel(),
      secretDisconnect.cancel(),
      remove(playerRef),
    ])
    throw error
  }
}

export async function removeRoomPlayer(database: Database, code: string, uid: string): Promise<void> {
  const playerRef = ref(database, `rooms/${code}/players/${uid}`)
  const secretRef = ref(database, `roomSecrets/${code}/${uid}`)
  await Promise.all([
    onDisconnect(playerRef).cancel(),
    onDisconnect(secretRef).cancel(),
  ])
  await Promise.all([remove(playerRef), remove(secretRef)])
}

export function observeRoom(
  code: string,
  onRoom: (room: GameRoom | null) => void,
  onError: (error: Error) => void,
): () => void {
  if (!database) {
    onError(new Error('Firebase is not configured.'))
    return () => undefined
  }

  return onValue(
    ref(database, `rooms/${code}`),
    (snapshot) => onRoom(parseRoom(snapshot.val())),
    onError,
  )
}

export function observePlayerSecret(
  code: string,
  uid: string,
  onSecret: (secret: PlayerSecret | null) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!database) {
    onError?.(new Error('Firebase is not configured.'))
    return () => undefined
  }

  return onValue(
    ref(database, `roomSecrets/${code}/${uid}`),
    (snapshot) => {
      const val = snapshot.val()
      if (
        isRecord(val) &&
        (val.role === 'crew' || val.role === 'imposter') &&
        typeof val.title === 'string' &&
        typeof val.statement === 'string'
      ) {
        onSecret({
          role: val.role,
          title: val.title,
          statement: val.statement,
        })
      } else {
        onSecret(null)
      }
    },
    onError,
  )
}

const VALID_PHASES = new Set(['lobby', 'hint', 'discuss', 'vote', 'result'])

function parseRoom(value: unknown): GameRoom | null {
  if (!isRecord(value)) return null
  const candidate = value
  if (
    typeof candidate.hostUid !== 'string' ||
    typeof candidate.phase !== 'string' ||
    !VALID_PHASES.has(candidate.phase) ||
    typeof candidate.createdAt !== 'number' ||
    !isRecord(candidate.players)
  ) {
    return null
  }

  const players: Record<string, RoomPlayer> = {}
  for (const [uid, player] of Object.entries(candidate.players)) {
    if (
      !isRecord(player) ||
      typeof player.name !== 'string' ||
      typeof player.joinedAt !== 'number'
    ) {
      continue
    }
    players[uid] = {
      name: player.name,
      joinedAt: player.joinedAt,
      alive: typeof player.alive === 'boolean' ? player.alive : true,
      hint: typeof player.hint === 'string' ? player.hint : undefined,
      vote: typeof player.vote === 'string' ? player.vote : undefined,
      isBot: typeof player.isBot === 'boolean' ? player.isBot : undefined,
    }
  }

  let revealedImposter: RevealedImposter | null = null
  if (isRecord(candidate.revealedImposter)) {
    const rev = candidate.revealedImposter
    if (
      typeof rev.uid === 'string' &&
      typeof rev.name === 'string' &&
      typeof rev.problemTitle === 'string' &&
      typeof rev.decoyTitle === 'string'
    ) {
      revealedImposter = {
        uid: rev.uid,
        name: rev.name,
        problemTitle: rev.problemTitle,
        decoyTitle: rev.decoyTitle,
      }
    }
  }

  let settings: RoomSettings = { ...DEFAULT_SETTINGS }
  if (isRecord(candidate.settings)) {
    const s = candidate.settings
    const difficulty =
      s.difficulty === 'medium' || s.difficulty === 'hard' || s.difficulty === 'easy'
        ? s.difficulty
        : DEFAULT_SETTINGS.difficulty
    const maxRounds =
      typeof s.maxRounds === 'number' && s.maxRounds >= 1 && s.maxRounds <= 5
        ? s.maxRounds
        : DEFAULT_SETTINGS.maxRounds
    const hintSeconds =
      typeof s.hintSeconds === 'number' && [15, 30, 45, 60].includes(s.hintSeconds)
        ? s.hintSeconds
        : DEFAULT_SETTINGS.hintSeconds
    const discussSeconds =
      typeof s.discussSeconds === 'number' && [30, 60, 90, 120, 180].includes(s.discussSeconds)
        ? s.discussSeconds
        : DEFAULT_SETTINGS.discussSeconds
    const voteSeconds =
      typeof s.voteSeconds === 'number' && [15, 30, 45].includes(s.voteSeconds)
        ? s.voteSeconds
        : DEFAULT_SETTINGS.voteSeconds

    settings = {
      difficulty,
      maxRounds,
      hintSeconds,
      discussSeconds,
      voteSeconds,
    }
  }

  return {
    hostUid: candidate.hostUid,
    phase: candidate.phase as GamePhase,
    createdAt: candidate.createdAt,
    round: typeof candidate.round === 'number' ? candidate.round : 1,
    phaseEndsAt: typeof candidate.phaseEndsAt === 'number' ? candidate.phaseEndsAt : null,
    players,
    winner: candidate.winner === 'crew' || candidate.winner === 'imposter' ? candidate.winner : null,
    revealedImposter,
    settings,
    gameMode: candidate.gameMode === 'classic' ? 'classic' : 'dsa',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
