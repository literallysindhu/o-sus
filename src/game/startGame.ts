import { ref, get, update, type Database } from 'firebase/database'
import { getBank } from './difficulty'
import { DEFAULT_SETTINGS, type RoomSettings } from './settings'
import { getClassicBank } from '../problems/classic'
import { GEEKSFORGEEKS_PROBLEMS } from '../problems/geeksforgeeks'

export const MIN_PLAYERS = 2

export interface StartGameResult {
  code: string
  round: number
  imposterUid: string
  problemTitle: string
  decoyTitle: string
}

/**
 * Starts a game room. Pure game logic with no UI dependencies,
 * designed so it can be ported directly to a Cloud Function later.
 */
export async function startGame(
  database: Database,
  code: string,
  callerUid: string,
): Promise<StartGameResult> {
  const roomSnap = await get(ref(database, `rooms/${code}`))
  if (!roomSnap.exists()) {
    throw new Error('Room not found.')
  }

  const room = roomSnap.val()
  if (room.hostUid !== callerUid) {
    throw new Error('Only the host can start the game.')
  }

  if (room.phase !== 'lobby') {
    throw new Error('The game is already in progress.')
  }

  const playerEntries = Object.entries(room.players ?? {})
  if (playerEntries.length < MIN_PLAYERS) {
    throw new Error(`Need at least ${MIN_PLAYERS} players to start the game.`)
  }

  const settings: RoomSettings = { ...DEFAULT_SETTINGS, ...room.settings }
  const bank = room.gameMode === 'geeksforgeeks'
    ? GEEKSFORGEEKS_PROBLEMS
    : room.gameMode === 'classic'
      ? getClassicBank(settings.difficulty)
      : getBank(settings.difficulty)
  if (bank.length === 0) {
    throw new Error('No problems available for this difficulty.')
  }

  const playerUids = playerEntries.map(([uid]) => uid)
  const imposterUid = playerUids[Math.floor(Math.random() * playerUids.length)]
  const pair = bank[Math.floor(Math.random() * bank.length)]

  const updates: Record<string, unknown> = {}

  // 1. Secret role and problem assignments per user
  for (const uid of playerUids) {
    const isImposter = uid === imposterUid
    const assigned = isImposter ? pair.decoy : pair.problem
    updates[`roomSecrets/${code}/${uid}`] = {
      role: isImposter ? 'imposter' : 'crew',
      title: assigned.title,
      statement: assigned.statement,
    }
  }

  // 2. Secret imposter record accessible only by host/server
  updates[`roomHostOnly/${code}`] = {
    imposterUid,
    problemTitle: pair.problem.title,
    decoyTitle: pair.decoy.title,
  }

  // 3. Room phase, round, countdown, and player resets in one atomic multi-path update
  updates[`rooms/${code}/phase`] = 'hint'
  updates[`rooms/${code}/round`] = 1
  updates[`rooms/${code}/phaseEndsAt`] = Date.now() + settings.hintSeconds * 1000
  updates[`rooms/${code}/winner`] = null
  updates[`rooms/${code}/revealedImposter`] = null

  for (const uid of playerUids) {
    updates[`rooms/${code}/players/${uid}/alive`] = true
    updates[`rooms/${code}/players/${uid}/hint`] = null
    updates[`rooms/${code}/players/${uid}/vote`] = null
    updates[`rooms/${code}/players/${uid}/skipToVote`] = null
  }

  await update(ref(database), updates)

  return {
    code,
    round: 1,
    imposterUid,
    problemTitle: pair.problem.title,
    decoyTitle: pair.decoy.title,
  }
}
