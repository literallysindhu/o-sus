import { ref, get, update, set, type Database } from 'firebase/database'
import type { GameRoom, RoomPlayer } from '../firebase'

export const BOT_NAMES = [
  'hash_hound',
  'pointer_pet',
  'greedy_guru',
  'stack_slayer',
  'tree_troll',
  'dp_detective',
  'heap_hero',
  'trie_trickster',
]

export const BOT_HINTS = [
  'Think about tracking seen values in a hash map.',
  'Could two pointers simplify the boundary checks?',
  'A monotonic stack helps identify the previous elements.',
  'Sorting the input first makes duplicate checking trivial.',
  'Binary search cuts the remaining search space in half.',
  'A sliding window maintains the state within valid bounds.',
  'Dynamic programming avoids recomputing overlapping subproblems.',
  'Level-order BFS explores the shortest paths cleanly.',
  'Store running prefix calculations to evaluate complements.',
  'A min-heap keeps track of extreme candidate values.',
]

const CLASSIC_BOT_HINTS: Record<string, string[]> = {
  Coffee: ['A lot of people reach for this first thing in the morning.', 'The smell alone can wake up a room.', 'It can be served hot or over ice.'],
  Tea: ['This one usually needs a little time to steep.', 'There are loads of varieties, from floral to smoky.', 'A warm mug of this is a classic rainy-day choice.'],
  Beach: ['I would pack a towel and some sunscreen for this.', 'You can spend the day near the water and come home sandy.', 'A bucket and spade would not look out of place here.'],
  'Swimming pool': ['You can do laps here without worrying about waves.', 'This place often has lanes and a tiled edge.', 'Remember your goggles if you are going here.'],
  Bicycle: ['You provide the power for this ride.', 'It is a good way to get around without using fuel.', 'A helmet is sensible, even for a short trip.'],
  Motorcycle: ['This ride has an engine and usually just two wheels.', 'A helmet is part of the look and the safety gear.', 'It is louder than the pedal-powered alternative.'],
  Pizza: ['This is easy to share when a group is hungry.', 'A slice is a pretty common way to serve it.', 'It often arrives in a flat cardboard box.'],
  Burger: ['This is usually held together with a soft bun.', 'It can get messy if it has too many toppings.', 'Fries are a familiar side for this meal.'],
  Cinema: ['The room gets dark when the main event begins.', 'People usually keep quiet and look toward one big screen.', 'Snacks tend to cost more once you are inside.'],
  Theatre: ['The audience watches performers live in front of them.', 'A curtain often marks the beginning of the show.', 'The seats face a stage rather than a screen.'],
  Dog: ['This animal is often excited when its person comes home.', 'A walk outside is part of the daily routine.', 'Some of them are trained to fetch.'],
  Cat: ['This animal is known for finding the warmest spot in the house.', 'It may decide it wants attention, then change its mind.', 'A cardboard box can be more interesting than a new toy.'],
  Airplane: ['This is a fast way to travel a long distance.', 'There is usually a safety demonstration before the trip.', 'You might hear an announcement from the cockpit.'],
  Train: ['You can watch the scenery pass from a window seat.', 'It follows a fixed route between stations.', 'A platform is where you wait for it.'],
  Rain: ['You might want to carry an umbrella for this.', 'It can turn a sunny walk into a wet one.', 'Puddles are a giveaway after it passes.'],
  Snow: ['This can make roads slippery and rooftops look different.', 'You can bundle up and leave footprints in it.', 'Some people try to turn it into a little figure.'],
  Guitar: ['You can strum this one around a campfire.', 'It usually has strings and can be carried on your back.', 'People often learn a few chords on this.'],
  Piano: ['The keys are arranged from low notes to high notes.', 'This instrument often stays in one place because it is so large.', 'You can play several notes at once with both hands.'],
  Camping: ['You might sleep outdoors under canvas for this.', 'Packing a torch and a warm sleeping bag is a good idea.', 'A campfire can be the best part of the evening.'],
  'Road trip': ['The journey is part of the holiday.', 'Good music and snacks can make the miles go faster.', 'You can stop whenever something interesting appears.'],
  Pancakes: ['These are often stacked up and topped with something sweet.', 'A pan and a quick flip are part of making them.', 'They are a familiar weekend breakfast.'],
  Waffles: ['The little squares hold onto syrup and toppings.', 'This breakfast is made with a special patterned iron.', 'Fruit or something sweet goes nicely on top.'],
  Library: ['You can borrow something to read and bring it back later.', 'People tend to keep their voices down here.', 'A card can help you take things home.'],
  Bookstore: ['You can browse the shelves and leave with a new read.', 'The things here are arranged for you to buy.', 'It is easy to lose track of time in this place.'],
}

const CLASSIC_FALLBACK_HINTS = [
  'This is something a lot of people have tried at least once.',
  'I would know what to expect if someone mentioned this in a story.',
  'There is a time and place where this feels especially familiar.',
]

function getClassicBotHint(title: string): string {
  const hints = CLASSIC_BOT_HINTS[title] ?? CLASSIC_FALLBACK_HINTS
  return hints[Math.floor(Math.random() * hints.length)]
}

/**
 * Submits a single-line hint for an active player.
 */
export async function submitPlayerHint(
  database: Database,
  code: string,
  uid: string,
  hint: string,
): Promise<void> {
  const cleanHint = hint.trim().slice(0, 120)
  if (!cleanHint) throw new Error('Hint cannot be empty.')
  await set(ref(database, `rooms/${code}/players/${uid}/hint`), cleanHint)
}

/**
 * Submits a vote for an active player against another player.
 */
export async function submitPlayerVote(
  database: Database,
  code: string,
  voterUid: string,
  targetUid: string,
): Promise<void> {
  if (voterUid === targetUid) {
    throw new Error('You cannot vote for yourself.')
  }
  await set(ref(database, `rooms/${code}/players/${uidTarget(targetUid)}/vote`,), undefined)
}

function uidTarget(target: string) {
  return target
}

/**
 * Correct vote submission path: rooms/{code}/players/{voterUid}/vote = targetUid
 */
export async function castVote(
  database: Database,
  code: string,
  voterUid: string,
  targetUid: string,
): Promise<void> {
  if (voterUid === targetUid) {
    throw new Error('You cannot vote for yourself.')
  }
  await set(ref(database, `rooms/${code}/players/${voterUid}/vote`), targetUid)
}

export async function voteToSkipDiscussion(
  database: Database,
  code: string,
  uid: string,
  shouldSkip: boolean,
): Promise<void> {
  await set(ref(database, `rooms/${code}/players/${uid}/skipToVote`), shouldSkip)
}

import { DEFAULT_SETTINGS, type RoomSettings } from './settings'

/**
 * Host transition: Advance from Hint to Discuss phase.
 */
export async function advanceToDiscuss(
  database: Database,
  code: string,
  settings?: RoomSettings,
): Promise<void> {
  let resolvedSec = settings?.discussSeconds
  if (!resolvedSec) {
    const snap = await get(ref(database, `rooms/${code}/settings/discussSeconds`))
    resolvedSec = typeof snap.val() === 'number' ? snap.val() : DEFAULT_SETTINGS.discussSeconds
  }
  const discussSec: number = resolvedSec ?? DEFAULT_SETTINGS.discussSeconds
  await update(ref(database, `rooms/${code}`), {
    phase: 'discuss',
    phaseEndsAt: Date.now() + discussSec * 1000,
  })
}

/**
 * Host transition: Advance from Discuss to Vote phase.
 */
export async function advanceToVote(
  database: Database,
  code: string,
  settings?: RoomSettings,
): Promise<void> {
  let resolvedSec = settings?.voteSeconds
  if (!resolvedSec) {
    const snap = await get(ref(database, `rooms/${code}/settings/voteSeconds`))
    resolvedSec = typeof snap.val() === 'number' ? snap.val() : DEFAULT_SETTINGS.voteSeconds
  }
  const voteSec: number = resolvedSec ?? DEFAULT_SETTINGS.voteSeconds
  await update(ref(database, `rooms/${code}`), {
    phase: 'vote',
    phaseEndsAt: Date.now() + voteSec * 1000,
  })
}

export interface TallyResult {
  eliminatedUid: string | null
  voteCounts: Record<string, number>
}

export function tallyVotes(players: Record<string, RoomPlayer>): TallyResult {
  const voteCounts: Record<string, number> = {}

  for (const player of Object.values(players)) {
    if (player.alive !== false && player.vote && players[player.vote]) {
      voteCounts[player.vote] = (voteCounts[player.vote] ?? 0) + 1
    }
  }

  let maxVotes = 0
  let topCandidate: string | null = null
  let isTie = false

  for (const [candidateUid, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count
      topCandidate = candidateUid
      isTie = false
    } else if (count === maxVotes) {
      isTie = true
    }
  }

  return {
    eliminatedUid: isTie || maxVotes === 0 ? null : topCandidate,
    voteCounts,
  }
}

/**
 * Host transition: Evaluate vote tally, determine elimination,
 * check win conditions, and either declare result or advance to next hint round.
 */
export async function advanceFromVote(database: Database, code: string): Promise<void> {
  const [roomSnap, hostOnlySnap] = await Promise.all([
    get(ref(database, `rooms/${code}`)),
    get(ref(database, `roomHostOnly/${code}`)),
  ])

  if (!roomSnap.exists()) return
  const room = roomSnap.val() as GameRoom
  const hostOnly = hostOnlySnap.val() as {
    imposterUid: string
    problemTitle: string
    decoyTitle: string
  } | null

  if (!hostOnly) {
    throw new Error('Host-only room secrets missing.')
  }

  const players = room.players ?? {}
  const { eliminatedUid } = tallyVotes(players)

  // Calculate updated alive states
  const updatedAlive: Record<string, boolean> = {}
  for (const [uid, player] of Object.entries(players)) {
    if (player.alive === false) {
      updatedAlive[uid] = false
    } else if (eliminatedUid && uid === eliminatedUid) {
      updatedAlive[uid] = false
    } else {
      updatedAlive[uid] = true
    }
  }

  const alivePlayers = Object.entries(updatedAlive).filter(([, alive]) => alive)
  const isImposterEliminated = eliminatedUid === hostOnly.imposterUid
  const imposterUid = hostOnly.imposterUid
  const imposterName = players[imposterUid]?.name ?? 'Unknown'

  const updates: Record<string, unknown> = {}

  // Apply elimination
  if (eliminatedUid) {
    updates[`rooms/${code}/players/${eliminatedUid}/alive`] = false
  }

  const settings: RoomSettings = { ...DEFAULT_SETTINGS, ...room.settings }
  const nextRound = (room.round ?? 1) + 1
  const isMaxRoundsExceeded = nextRound > settings.maxRounds

  if (isImposterEliminated) {
    // Crew wins!
    updates[`rooms/${code}/phase`] = 'result'
    updates[`rooms/${code}/winner`] = 'crew'
    updates[`rooms/${code}/phaseEndsAt`] = null
    updates[`rooms/${code}/revealedImposter`] = {
      uid: imposterUid,
      name: imposterName,
      problemTitle: hostOnly.problemTitle,
      decoyTitle: hostOnly.decoyTitle,
    }
  } else if (alivePlayers.length <= 2 || isMaxRoundsExceeded) {
    // Imposter wins!
    updates[`rooms/${code}/phase`] = 'result'
    updates[`rooms/${code}/winner`] = 'imposter'
    updates[`rooms/${code}/phaseEndsAt`] = null
    updates[`rooms/${code}/revealedImposter`] = {
      uid: imposterUid,
      name: imposterName,
      problemTitle: hostOnly.problemTitle,
      decoyTitle: hostOnly.decoyTitle,
    }
  } else {
    // Neither won yet -> Next round
    updates[`rooms/${code}/phase`] = 'hint'
    updates[`rooms/${code}/round`] = nextRound
    updates[`rooms/${code}/phaseEndsAt`] = Date.now() + settings.hintSeconds * 1000

    // Clear hints and votes for all players
    for (const uid of Object.keys(players)) {
      updates[`rooms/${code}/players/${uid}/hint`] = null
      updates[`rooms/${code}/players/${uid}/vote`] = null
      updates[`rooms/${code}/players/${uid}/skipToVote`] = null
    }
  }

  await update(ref(database), updates)
}

/**
 * Host reset: Returns game to the lobby for "Play again".
 */
export async function resetToLobby(database: Database, code: string): Promise<void> {
  const roomSnap = await get(ref(database, `rooms/${code}`))
  if (!roomSnap.exists()) return
  const room = roomSnap.val() as GameRoom

  const updates: Record<string, unknown> = {}
  updates[`rooms/${code}/phase`] = 'lobby'
  updates[`rooms/${code}/round`] = 1
  updates[`rooms/${code}/phaseEndsAt`] = null
  updates[`rooms/${code}/winner`] = null
  updates[`rooms/${code}/revealedImposter`] = null

  for (const uid of Object.keys(room.players ?? {})) {
    updates[`rooms/${code}/players/${uid}/alive`] = true
    updates[`rooms/${code}/players/${uid}/hint`] = null
    updates[`rooms/${code}/players/${uid}/vote`] = null
    updates[`rooms/${code}/players/${uid}/skipToVote`] = null
  }

  // Clear secrets
  updates[`roomHostOnly/${code}`] = null
  updates[`roomSecrets/${code}`] = null

  await update(ref(database), updates)
}

/**
 * Dev Helper: Adds a simulated bot player to the lobby.
 */
export async function addBotPlayer(database: Database, code: string): Promise<string> {
  const botId = `bot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`
  const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + `_${Math.floor(Math.random() * 90 + 10)}`

  await set(ref(database, `rooms/${code}/players/${botId}`), {
    name: botName,
    joinedAt: Date.now(),
    isBot: true,
    alive: true,
  })

  return botId
}

/**
 * Dev Helper: Automatically acts on behalf of bot players during Hint and Vote phases.
 */
export async function processBotsTurn(
  database: Database,
  code: string,
  room: GameRoom,
): Promise<void> {
  const players = room.players ?? {}
  const botEntries = Object.entries(players).filter(
    ([, p]) => p.isBot && p.alive !== false,
  )

  if (room.phase === 'hint') {
    let classicTitles: { imposterUid: string; problemTitle: string; decoyTitle: string } | null = null
    if (room.gameMode === 'classic') {
      const hostOnlySnap = await get(ref(database, `roomHostOnly/${code}`))
      classicTitles = hostOnlySnap.val()
    }

    for (const [botUid, bot] of botEntries) {
      if (!bot.hint) {
        const hint = room.gameMode === 'classic'
          ? getClassicBotHint(
              botUid === classicTitles?.imposterUid
                ? classicTitles.decoyTitle
                : classicTitles?.problemTitle ?? '',
            )
          : BOT_HINTS[Math.floor(Math.random() * BOT_HINTS.length)]
        await set(ref(database, `rooms/${code}/players/${botUid}/hint`), hint)
      }
    }
  } else if (room.phase === 'vote') {
    const aliveTargets = Object.entries(players)
      .filter(([, p]) => p.alive !== false)
      .map(([uid]) => uid)

    for (const [botUid, bot] of botEntries) {
      if (!bot.vote) {
        // Vote for any alive player except self
        const validTargets = aliveTargets.filter((t) => t !== botUid)
        if (validTargets.length > 0) {
          const target = validTargets[Math.floor(Math.random() * validTargets.length)]
          await set(ref(database, `rooms/${code}/players/${botUid}/vote`), target)
        }
      }
    }
  }
}
