import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { set, get, ref } from 'firebase/database'

describe('Firebase Realtime Database Rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'dsa-imposter-rules-test',
      database: {
        host: '127.0.0.1',
        port: 9000,
        rules: readFileSync(resolve(process.cwd(), 'database.rules.json'), 'utf8'),
      },
    })
  })

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup()
    }
  })

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearDatabase()
    }
  })

  it("proves a non-host cannot read another player's roomSecrets", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database()
      await set(ref(db, 'rooms/ABCDE'), {
        hostUid: 'host123',
        phase: 'hint',
        createdAt: Date.now(),
        players: {
          host123: { name: 'Host', joinedAt: Date.now(), alive: true },
          player456: { name: 'PlayerTwo', joinedAt: Date.now(), alive: true },
        },
      })
      await set(ref(db, 'roomSecrets/ABCDE/host123'), {
        role: 'imposter',
        title: 'Decoy Problem',
        statement: 'Statement 1',
      })
      await set(ref(db, 'roomSecrets/ABCDE/player456'), {
        role: 'crew',
        title: 'Real Problem',
        statement: 'Statement 2',
      })
    })

    const playerTwoDb = testEnv.authenticatedContext('player456').database()

    // Player 2 reading their own secret -> SUCCESS
    await assertSucceeds(get(ref(playerTwoDb, 'roomSecrets/ABCDE/player456')))

    // Player 2 reading Host's secret -> FAILS
    await assertFails(get(ref(playerTwoDb, 'roomSecrets/ABCDE/host123')))
  })

  it('proves a non-host cannot read roomHostOnly', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database()
      await set(ref(db, 'rooms/ABCDE'), {
        hostUid: 'host123',
        phase: 'hint',
        createdAt: Date.now(),
        players: {
          host123: { name: 'Host', joinedAt: Date.now(), alive: true },
          player456: { name: 'PlayerTwo', joinedAt: Date.now(), alive: true },
        },
      })
      await set(ref(db, 'roomHostOnly/ABCDE'), {
        imposterUid: 'host123',
        problemTitle: 'Two Sum',
        decoyTitle: '3Sum',
      })
    })

    const hostDb = testEnv.authenticatedContext('host123').database()
    const nonHostDb = testEnv.authenticatedContext('player456').database()

    // Host reading roomHostOnly -> SUCCESS
    await assertSucceeds(get(ref(hostDb, 'roomHostOnly/ABCDE')))

    // Non-host reading roomHostOnly -> FAILS
    await assertFails(get(ref(nonHostDb, 'roomHostOnly/ABCDE')))
  })

  it('proves a non-host cannot change phase', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database()
      await set(ref(db, 'rooms/ABCDE'), {
        hostUid: 'host123',
        phase: 'hint',
        createdAt: Date.now(),
        players: {
          host123: { name: 'Host', joinedAt: Date.now(), alive: true },
          player456: { name: 'PlayerTwo', joinedAt: Date.now(), alive: true },
        },
      })
    })

    const hostDb = testEnv.authenticatedContext('host123').database()
    const nonHostDb = testEnv.authenticatedContext('player456').database()

    // Non-host trying to change phase -> FAILS
    await assertFails(set(ref(nonHostDb, 'rooms/ABCDE/phase'), 'discuss'))

    // Host changing phase -> SUCCESS
    await assertSucceeds(set(ref(hostDb, 'rooms/ABCDE/phase'), 'discuss'))
  })

  it("proves a player cannot write another player's vote", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database()
      await set(ref(db, 'rooms/ABCDE'), {
        hostUid: 'host123',
        phase: 'vote',
        createdAt: Date.now(),
        players: {
          host123: { name: 'Host', joinedAt: Date.now(), alive: true },
          player456: { name: 'PlayerTwo', joinedAt: Date.now(), alive: true },
          other789: { name: 'PlayerThree', joinedAt: Date.now(), alive: true },
        },
      })
    })

    const playerTwoDb = testEnv.authenticatedContext('player456').database()

    // Player 2 writing Player 3's vote -> FAILS
    await assertFails(set(ref(playerTwoDb, 'rooms/ABCDE/players/other789/vote'), 'host123'))

    // Player 2 voting for Player 3 in vote phase -> SUCCESS
    await assertSucceeds(set(ref(playerTwoDb, 'rooms/ABCDE/players/player456/vote'), 'other789'))
  })

  it('proves a non-host cannot edit room settings', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database()
      await set(ref(db, 'rooms/ABCDE'), {
        hostUid: 'host123',
        phase: 'lobby',
        createdAt: Date.now(),
        players: {
          host123: { name: 'Host', joinedAt: Date.now(), alive: true },
          player456: { name: 'PlayerTwo', joinedAt: Date.now(), alive: true },
        },
        settings: { difficulty: 'easy', maxRounds: 3, hintSeconds: 45, discussSeconds: 60, voteSeconds: 30 },
      })
    })

    const hostDb = testEnv.authenticatedContext('host123').database()
    const nonHostDb = testEnv.authenticatedContext('player456').database()

    // Non-host writing settings -> FAILS
    await assertFails(set(ref(nonHostDb, 'rooms/ABCDE/settings/difficulty'), 'hard'))

    // Host writing settings -> SUCCESS
    await assertSucceeds(set(ref(hostDb, 'rooms/ABCDE/settings/difficulty'), 'medium'))
  })

  it('proves host cannot edit settings once game has started', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database()
      await set(ref(db, 'rooms/ABCDE'), {
        hostUid: 'host123',
        phase: 'hint',
        createdAt: Date.now(),
        players: {
          host123: { name: 'Host', joinedAt: Date.now(), alive: true },
          player456: { name: 'PlayerTwo', joinedAt: Date.now(), alive: true },
        },
        settings: { difficulty: 'easy', maxRounds: 3, hintSeconds: 45, discussSeconds: 60, voteSeconds: 30 },
      })
    })

    const hostDb = testEnv.authenticatedContext('host123').database()

    // Host trying to change settings while game is running -> FAILS
    await assertFails(set(ref(hostDb, 'rooms/ABCDE/settings/difficulty'), 'hard'))
  })

  it('proves an out-of-range settings value is rejected', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database()
      await set(ref(db, 'rooms/ABCDE'), {
        hostUid: 'host123',
        phase: 'lobby',
        createdAt: Date.now(),
        players: {
          host123: { name: 'Host', joinedAt: Date.now(), alive: true },
        },
        settings: { difficulty: 'easy', maxRounds: 3, hintSeconds: 45, discussSeconds: 60, voteSeconds: 30 },
      })
    })

    const hostDb = testEnv.authenticatedContext('host123').database()

    // maxRounds = 99 (out of range) -> FAILS
    await assertFails(set(ref(hostDb, 'rooms/ABCDE/settings/maxRounds'), 99))

    // maxRounds = 5 (max allowed) -> SUCCESS
    await assertSucceeds(set(ref(hostDb, 'rooms/ABCDE/settings/maxRounds'), 5))

    // hintSeconds = 100 (not in allowed list) -> FAILS
    await assertFails(set(ref(hostDb, 'rooms/ABCDE/settings/hintSeconds'), 100))

    // difficulty = 'ultra' (invalid) -> FAILS
    await assertFails(set(ref(hostDb, 'rooms/ABCDE/settings/difficulty'), 'ultra'))
  })
})
