import { useEffect, useState, useRef } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import type { GameMode, GameRoom, PlayerSecret } from './firebase'
import {
  firebaseConfigured,
  database,
  observeRoom,
  observePlayerSecret,
  signInAnonymously,
  createRoom,
  joinRoom,
  updateRoomSettings,
  removeRoomPlayer,
} from './firebase'
import { startGame, MIN_PLAYERS } from './game/startGame'
import {
  submitPlayerHint,
  castVote,
  advanceToDiscuss,
  advanceToVote,
  advanceFromVote,
  resetToLobby,
  addBotPlayer,
  processBotsTurn,
  voteToSkipDiscussion,
} from './game/roundLoop'
import { DEFAULT_SETTINGS, type RoomSettings } from './game/settings'
import { RoomSettingsPanel } from './components/RoomSettingsPanel'
import { Splash } from './components/Splash'
import splashAudio from './assets/splash-bgm.mp3'
import './App.css'


type AuthStatus = 'setup' | 'connecting' | 'ready' | 'error'

function App() {
  const [introStarted, setIntroStarted] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [landingEntering, setLandingEntering] = useState(false)
  const [audioError, setAudioError] = useState('')
  const splashAudioRef = useRef<HTMLAudioElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    firebaseConfigured ? 'connecting' : 'setup',
  )
  const [authAttempt, setAuthAttempt] = useState(0)
  const [name, setName] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [secret, setSecret] = useState<PlayerSecret | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('dsa')

  // Pre-creation settings (landing screen)

  // Game UI state
  const [hintInput, setHintInput] = useState('')
  const [revealedDossier, setRevealedDossier] = useState(false)
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null)

  // Host auto-loop transition throttle
  const isTransitioningRef = useRef(false)

  const startIntro = async () => {
    const audio = splashAudioRef.current
    if (!audio) return
    try {
      await audio.play()
      setAudioError('')
      setIntroStarted(true)
    } catch {
      setAudioError('Sound could not start. Check your device volume and try again.')
    }
  }

  const finishIntro = () => {
    const audio = splashAudioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIntroDone(true)
    setLandingEntering(true)
  }

  // Anonymous auth
  useEffect(() => {
    if (!firebaseConfigured) return
    let active = true
    signInAnonymously()
      .then((signedInUser) => {
        if (active) {
          setUser(signedInUser)
          setAuthStatus('ready')
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(getErrorMessage(reason))
          setAuthStatus('error')
        }
      })

    return () => {
      active = false
    }
  }, [authAttempt])

  // Room listener
  useEffect(() => {
    if (!roomCode) return

    return observeRoom(
      roomCode,
      (nextRoom) => {
        setRoom(nextRoom)
        if (!nextRoom) {
          setRoomCode('')
          setError('That room is no longer available.')
          setHintInput('')
          setRevealedDossier(false)
          setSelectedVoteTarget(null)
        } else if (nextRoom.phase === 'lobby') {
          setHintInput('')
          setRevealedDossier(false)
          setSelectedVoteTarget(null)
        }
      },
      (reason) => setError(getErrorMessage(reason)),
    )
  }, [roomCode])

  // Player Secret listener
  useEffect(() => {
    if (!roomCode || !user) return

    return observePlayerSecret(
      roomCode,
      user.uid,
      (nextSecret) => setSecret(nextSecret),
      (reason) => setError(getErrorMessage(reason)),
    )
  }, [roomCode, user])

  // Countdown timer clock
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!room?.phaseEndsAt) return
    const timerInterval = setInterval(() => {
      setNow(Date.now())
    }, 500)
    return () => clearInterval(timerInterval)
  }, [room?.phaseEndsAt])

  const displayTimeLeft = room?.phaseEndsAt
    ? Math.max(0, Math.ceil((room.phaseEndsAt - now) / 1000))
    : null

  // Host Game Loop Driver & Dev Bots Automation
  const isHost = Boolean(user && room && room.hostUid === user.uid)
  useEffect(() => {
    if (!isHost || !database || !room || !roomCode) return
    const db = database

    // Dev Bot automated turn processor
    if (import.meta.env.DEV && (room.phase === 'hint' || room.phase === 'vote')) {
      const botTimer = setTimeout(() => {
        processBotsTurn(db, roomCode, room).catch((err) =>
          console.error('Error running bot turn:', err),
        )
      }, 1400)
      return () => clearTimeout(botTimer)
    }
  }, [isHost, room, roomCode])

  // Host automated phase transitions
  useEffect(() => {
    if (!isHost || !database || !room || !roomCode) return
    if (room.phase === 'lobby' || room.phase === 'result') return

    const alivePlayers = Object.entries(room.players ?? {}).filter(
      ([, p]) => p.alive !== false,
    )
    if (alivePlayers.length === 0) return

    const isTimerExpired = Boolean(
      room.phaseEndsAt && Date.now() >= room.phaseEndsAt,
    )

    if (room.phase === 'hint') {
      const allHintsSubmitted = alivePlayers.every(([, p]) => Boolean(p.hint))
      if (allHintsSubmitted || isTimerExpired) {
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true
          advanceToDiscuss(database, roomCode)
            .catch((err) => setError(getErrorMessage(err)))
            .finally(() => {
              isTransitioningRef.current = false
            })
        }
      }
    } else if (room.phase === 'discuss') {
      const skipVotes = alivePlayers.filter(([, player]) => player.skipToVote).length
      const hasSkipMajority = skipVotes > alivePlayers.length / 2
      if (isTimerExpired || hasSkipMajority) {
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true
          advanceToVote(database, roomCode)
            .catch((err) => setError(getErrorMessage(err)))
            .finally(() => {
              isTransitioningRef.current = false
            })
        }
      }
    } else if (room.phase === 'vote') {
      const allVotesSubmitted = alivePlayers.every(([, p]) => Boolean(p.vote))
      if (allVotesSubmitted || isTimerExpired) {
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true
          advanceFromVote(database, roomCode)
            .catch((err) => setError(getErrorMessage(err)))
            .finally(() => {
              isTransitioningRef.current = false
            })
        }
      }
    }
  }, [isHost, room, roomCode, displayTimeLeft])

  const normalizedName = name.trim()
  const canEnterRoom =
    firebaseConfigured &&
    authStatus === 'ready' &&
    Boolean(user) &&
    normalizedName.length >= 2 &&
    !busy
  function retryAuthConnection() {
    setError('')
    setAuthStatus('connecting')
    setAuthAttempt((attempt) => attempt + 1)
  }

  async function handleCreateRoom() {
    if (!user || !canEnterRoom) return
    setBusy(true)
    setError('')
    try {
      const code = await createRoom(user.uid, normalizedName, DEFAULT_SETTINGS, gameMode)
      setRoomCode(code)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateGeeksforGeeksRoom() {
    if (!user || !canEnterRoom) return
    setBusy(true)
    setError('')
    try {
      const code = await createRoom(user.uid, normalizedName, DEFAULT_SETTINGS, 'geeksforgeeks')
      setRoomCode(code)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateSettings(next: RoomSettings) {
    if (!database || !roomCode) return
    try {
      await updateRoomSettings(database, roomCode, next)
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !canEnterRoom) return
    const code = roomCodeInput.trim().toUpperCase()
    if (!/^[A-Z]{5}$/.test(code)) {
      setError('Enter a valid five-letter room code.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await joinRoom(code, user.uid, normalizedName)
      setRoomCode(code)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleStartGame() {
    if (!database || !user || !isHost || !roomCode) return
    setBusy(true)
    setError('')
    try {
      await startGame(database, roomCode, user.uid)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleAddBot() {
    if (!database || !roomCode) return
    try {
      await addBotPlayer(database, roomCode)
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }

  async function handleSkipToVote() {
    if (!database || !roomCode || !user || !room) return
    try {
      await voteToSkipDiscussion(
        database,
        roomCode,
        user.uid,
        !room.players[user.uid]?.skipToVote,
      )
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }

  async function handleSubmitHint(event: FormEvent) {
    event.preventDefault()
    if (!database || !user || !roomCode) return
    const cleanHint = hintInput.trim()
    if (!cleanHint) return

    setBusy(true)
    setError('')
    try {
      await submitPlayerHint(database, roomCode, user.uid, cleanHint)
      setHintInput('')
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleCastVote(targetUid: string) {
    if (!database || !user || !roomCode) return
    setSelectedVoteTarget(targetUid)
    setError('')
    try {
      await castVote(database, roomCode, user.uid, targetUid)
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }

  async function handlePlayAgain() {
    if (!database || !roomCode || !isHost) return
    setBusy(true)
    setError('')
    try {
      await resetToLobby(database, roomCode)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch (reason) {
      setError(`Couldn't copy the code: ${getErrorMessage(reason)}`)
    }
  }

  async function leaveRoom() {
    if (database && roomCode && user) {
      setBusy(true)
      setError('')
      try {
        await removeRoomPlayer(database, roomCode, user.uid)
      } catch (reason) {
        setError(getErrorMessage(reason))
        setBusy(false)
        return
      }
      setBusy(false)
    }
    setRoom(null)
    setRoomCode('')
    setSecret(null)
    setError('')
    setHintInput('')
    setRevealedDossier(false)
    setSelectedVoteTarget(null)
  }

  // Active game view
  if (roomCode && room) {
    const players = Object.entries(room.players ?? {})
    const isPlayerHost = room.hostUid === user?.uid
    const isClassicMode = room.gameMode === 'classic'
    const isGeeksforGeeksRoom = room.gameMode === 'geeksforgeeks'
    const currentPlayer = user ? room.players[user.uid] : null
    const isAlive = currentPlayer?.alive !== false
    const myHint = currentPlayer?.hint
    const myVote = currentPlayer?.vote
    const alivePlayers = players.filter(([, player]) => player.alive !== false)
    const skipVotes = alivePlayers.filter(([, player]) => player.skipToVote).length
    const skipVotesNeeded = Math.floor(alivePlayers.length / 2) + 1

    return (
      <main className="app-shell">
        <header className="topbar">
          <a
            className="wordmark"
            href="/"
            onClick={(event) => {
              event.preventDefault()
              leaveRoom()
            }}
          >
            <img className="wordmark-mark" src="/mask-logo.png" alt="" aria-hidden="true" />
            O<span>(sus)</span>
          </a>
          <span className="status-pill">
            <i /> {isGeeksforGeeksRoom ? 'GEEKSFORGEEKS' : isClassicMode ? 'CLASSIC' : 'DSA'} // {room.phase === 'lobby' ? 'LIVE LOBBY' : `PHASE // ${room.phase.toUpperCase()}`}
          </span>
        </header>

        {/* LOBBY VIEW */}
        {room.phase === 'lobby' ? (
          <section className="room-layout" aria-labelledby="room-title">
            <div className="room-heading">
              <p className="eyebrow">ROOM // WAITING FOR PLAYERS</p>
              <h1 id="room-title">
                {isGeeksforGeeksRoom ? 'GeeksforGeeks room' : 'The war room'}<span className="cursor">_</span>
              </h1>
              <p className="lede">{isGeeksforGeeksRoom ? 'Club-only first-year room: Arrays, Strings, Binary Search, and Trees.' : 'Get your crew together. Trust absolutely nobody.'}</p>
            </div>

            <div className="room-code-panel">
              <div>
                <span className="eyebrow">YOUR ROOM CODE</span>
                <strong className="room-code">{roomCode}</strong>
              </div>
              <button className="button button-secondary copy-button" onClick={copyRoomCode}>
                {copied ? 'COPIED ✓' : 'COPY CODE'}
              </button>
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            {/* Settings: editable for host, read-only for guests */}
            {isPlayerHost ? (
              <RoomSettingsPanel
                settings={room.settings ?? DEFAULT_SETTINGS}
                onChange={handleUpdateSettings}
                gameMode={room.gameMode}
              />
            ) : (
              <RoomSettingsPanel
                settings={room.settings ?? DEFAULT_SETTINGS}
                readOnly
                gameMode={room.gameMode}
              />
            )}

            <section className="players-panel" aria-labelledby="players-title">
              <div className="panel-heading">
                <h2 id="players-title">
                  Players <span className="player-count">{players.length}/10</span>
                </h2>
                <span className="minimum-note">{MIN_PLAYERS} MINIMUM TO PLAY</span>
              </div>
              <ul className="player-list">
                {players.map(([uid, player], index) => (
                  <li className="player-row" key={uid}>
                    <span className={`player-avatar avatar-${index % 5}`} aria-hidden="true">
                      {player.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="player-name">
                      {player.name}
                      {uid === user?.uid && <small> (YOU)</small>}
                      {player.isBot && <small> [BOT]</small>}
                    </span>
                    {room.hostUid === uid && <span className="host-tag">HOST</span>}
                    <span className="connected-indicator" aria-label="Connected" />
                  </li>
                ))}
                {Array.from({ length: Math.max(0, MIN_PLAYERS - players.length) }, (_, index) => (
                  <li className="player-row player-placeholder" key={`open-${index}`}>
                    <span className="placeholder-avatar">+</span>
                    <span>Waiting for player...</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="lobby-actions">
              <button
                className="button button-primary start-button"
                type="button"
                onClick={handleStartGame}
                disabled={!isPlayerHost || players.length < MIN_PLAYERS || busy}
              >
                {busy
                  ? 'COMMENCING...'
                  : isPlayerHost
                  ? 'START GAME'
                  : 'WAITING FOR HOST'}
                <span aria-hidden="true"> ↗</span>
              </button>

              {import.meta.env.DEV && isPlayerHost && (
                <button
                  className="button button-secondary dev-bot-btn"
                  type="button"
                  onClick={handleAddBot}
                  title="Dev helper: add an automated bot player"
                >
                  [DEV] + ADD BOT
                </button>
              )}

              <p className="start-note">
                {players.length < MIN_PLAYERS
                  ? `Need ${MIN_PLAYERS - players.length} more ${
                      MIN_PLAYERS - players.length === 1 ? 'player' : 'players'
                    } to start.`
                  : 'Lobby ready. Host can launch the mission.'}
              </p>
            </div>

            <button className="text-button leave-button" onClick={leaveRoom}>
              ← Leave room
            </button>
          </section>
        ) : (
          /* ACTIVE GAME ROUND LOOP VIEW (hint -> discuss -> vote -> result) */
          <section className="room-layout" aria-labelledby="game-round-title">
            <div className="game-meta-bar">
              <span className="phase-tag">
                <i /> ROUND {room.round ?? 1}{room.settings?.maxRounds ? ` OF ${room.settings.maxRounds}` : ''} // {room.phase.toUpperCase()}
              </span>
              {displayTimeLeft !== null && (
                <span className={`timer-pill ${displayTimeLeft <= 10 ? 'timer-urgent' : ''}`}>
                  ⏱ {String(Math.floor(displayTimeLeft / 60)).padStart(2, '0')}:
                  {String(displayTimeLeft % 60).padStart(2, '0')}
                </span>
              )}
            </div>

            {/* ROLE DOSSIER (Hold or click to view so shoulder-peeking cannot spoil) */}
            <section
              className="dossier-card"
              onMouseDown={() => setRevealedDossier(true)}
              onMouseUp={() => setRevealedDossier(false)}
              onTouchStart={() => setRevealedDossier(true)}
              onTouchEnd={() => setRevealedDossier(false)}
              onClick={() => setRevealedDossier((prev) => !prev)}
              aria-label={isGeeksforGeeksRoom ? 'Secret DSA term dossier' : 'Secret problem dossier'}
            >
              <div className="dossier-header">
                <p className="dossier-title">TOP SECRET // CLASSIFIED DOSSIER</p>
                <span className="dossier-hold-hint">
                  {revealedDossier ? 'RELEASE TO HIDE 👁' : 'HOLD / CLICK TO REVEAL 👁'}
                </span>
              </div>

              {revealedDossier && secret ? (
                <div className="dossier-revealed">
                  <span
                    className={`role-badge ${
                      secret.role === 'imposter' ? 'role-imposter' : 'role-crew'
                    }`}
                  >
                    {secret.role === 'imposter'
                      ? isGeeksforGeeksRoom ? 'IMPOSTER // DECOY TERM' : 'IMPOSTER // DECOY PROBLEM'
                      : isGeeksforGeeksRoom ? 'CREW // DSA TERM' : 'CREW // REAL PROBLEM'}
                  </span>
                  <h3 className="problem-heading">{secret.title}</h3>
                  <p className="problem-statement">{secret.statement}</p>
                  <p className="role-tactical-tip">
                    {secret.role === 'imposter'
                      ? isClassicMode
                        ? '⚠️ You have a different subject. Blend in with vague clues and do not get exposed.'
                        : isGeeksforGeeksRoom
                          ? '⚠️ You have a decoy DSA term. Blend in with vague clues. Do not get exposed.'
                          : '⚠️ You have a decoy problem. Blend in with vague clues. Do not get exposed.'
                      : isClassicMode
                        ? '✅ Everyone in the crew has this subject. Give hints without making it too obvious to the imposter.'
                        : isGeeksforGeeksRoom
                          ? '✅ Everyone in the crew has this DSA term. Give hints without spoon-feeding the imposter.'
                          : '✅ Everyone in the crew has this problem. Give hints other coders spot without spoon-feeding the imposter.'}
                  </p>
                </div>
              ) : (
                <div className="dossier-masked">
                  <span className="redacted-bar">
                    ████████████████████████████████████████
                  </span>
                  <p className="dossier-hold-hint">Hold down or tap to reveal your role & {isGeeksforGeeksRoom ? 'DSA term' : 'problem'}</p>
                </div>
              )}
            </section>

            {error && <p className="error-message" role="alert">{error}</p>}

            {!isAlive && (
              <div className="spectator-box" role="status">
                👁 <strong>SPECTATOR MODE</strong>: You were eliminated. You can observe the hints and votes.
              </div>
            )}

            {/* 1. HINT PHASE */}
            {room.phase === 'hint' && (
              <section className="phase-panel" aria-labelledby="hint-phase-title">
                <div className="panel-title-row">
                  <h2 id="hint-phase-title" className="panel-title">
                    SUBMIT YOUR CODED HINT
                  </h2>
                </div>

                {isAlive ? (
                  myHint ? (
                    <div className="submitted-box">
                      <strong>HINT TRANSMITTED // STANDING BY</strong>
                      <p className="hint-quote">"{myHint}"</p>
                    </div>
                  ) : (
                    <form className="hint-form" onSubmit={handleSubmitHint}>
                      <div className="hint-input-wrapper">
                        <input
                          className="terminal-input hint-input"
                          maxLength={120}
                          placeholder="e.g. Tracks frequencies with O(1) lookups..."
                          value={hintInput}
                          onChange={(e) => setHintInput(e.target.value)}
                          disabled={busy}
                          autoFocus
                        />
                        <span className="char-counter">{hintInput.length}/120</span>
                      </div>
                      <button
                        className="button button-primary"
                        type="submit"
                        disabled={!hintInput.trim() || busy}
                      >
                        SUBMIT HINT ↗
                      </button>
                    </form>
                  )
                ) : (
                  <p className="field-hint">Alive players are currently composing their hints...</p>
                )}
              </section>
            )}

            {/* 2. DISCUSS PHASE */}
            {room.phase === 'discuss' && (
              <section className="phase-panel" aria-labelledby="discuss-phase-title">
                <div className="panel-title-row">
                  <h2 id="discuss-phase-title" className="panel-title">
                    ANALYZE ALL SUBMITTED HINTS
                  </h2>
                  {isAlive && (
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={handleSkipToVote}
                    >
                      {currentPlayer?.skipToVote ? 'WITHDRAW SKIP VOTE' : 'VOTE TO SKIP →'}
                    </button>
                  )}
                </div>

                <p className="field-hint">
                  Skip to voting: {skipVotes}/{skipVotesNeeded} majority votes.{' '}
                  {currentPlayer?.skipToVote
                    ? 'Your skip vote is in.'
                    : 'A majority of alive players can end discussion early.'}
                </p>

                <div className="hints-grid">
                  {players.map(([uid, player], idx) => {
                    if (player.alive === false) return null
                    return (
                      <div
                        className={`hint-card ${uid === user?.uid ? 'hint-card-self' : ''}`}
                        key={uid}
                      >
                        <div className="hint-card-header">
                          <span
                            className={`player-avatar avatar-${idx % 5}`}
                            aria-hidden="true"
                          >
                            {player.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span>
                            {player.name}
                            {uid === user?.uid && <small> (YOU)</small>}
                          </span>
                        </div>
                        <p className="hint-quote">
                          {player.hint ? `"${player.hint}"` : '— [No hint transmitted] —'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 3. VOTE PHASE */}
            {room.phase === 'vote' && (
              <section className="phase-panel" aria-labelledby="vote-phase-title">
                <div className="panel-title-row">
                  <h2 id="vote-phase-title" className="panel-title">
                    IDENTIFY THE IMPOSTER // CAST YOUR ACCUSATION
                  </h2>
                </div>

                {isAlive ? (
                  myVote ? (
                    <div className="submitted-box">
                      <strong>ACCUSATION RECORDED</strong>
                      <p>
                        Voted for: <strong>{room.players[myVote]?.name ?? myVote}</strong>.
                        Tallying results...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="field-hint">Choose who you believe received the {isClassicMode ? 'different subject' : isGeeksforGeeksRoom ? 'decoy DSA term' : 'decoy problem'}:</p>
                      <div className="vote-grid">
                        {players.map(([uid, player], idx) => {
                          if (uid === user?.uid || player.alive === false) return null
                          return (
                            <button
                              key={uid}
                              className={`vote-candidate-btn ${
                                selectedVoteTarget === uid ? 'selected' : ''
                              }`}
                              type="button"
                              onClick={() => handleCastVote(uid)}
                            >
                              <span
                                className={`player-avatar avatar-${idx % 5}`}
                                aria-hidden="true"
                              >
                                {player.name.slice(0, 1).toUpperCase()}
                              </span>
                              <span>{player.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <p className="field-hint">Voting is currently in progress among alive players...</p>
                )}

                <div className="vote-record" aria-live="polite">
                  <p className="eyebrow">LIVE VOTE RECORD</p>
                  {alivePlayers.map(([uid, player]) => (
                    <p key={uid}>
                      <strong>{player.name}{uid === user?.uid ? ' (YOU)' : ''}</strong>
                      {' → '}
                      {player.vote ? room.players[player.vote]?.name ?? player.vote : 'waiting...'}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* 4. RESULT PHASE */}
            {room.phase === 'result' && (
              <section className="phase-panel" aria-labelledby="result-phase-title">
                <div
                  className={`result-banner ${
                    room.winner === 'crew' ? 'result-crew-win' : 'result-imposter-win'
                  }`}
                >
                  <p className="eyebrow">FINAL DEBRIEF</p>
                  <h2>
                    {room.winner === 'crew'
                      ? 'CREW VICTORY // IMPOSTER ELIMINATED'
                      : 'IMPOSTER VICTORY // INFILTRATION COMPLETE'}
                  </h2>
                  <p>
                    {room.winner === 'crew'
                      ? 'The crew caught the bug in the system!'
                      : 'The imposter survived and blended into the codebase.'}
                  </p>
                </div>

                {room.revealedImposter && (
                  <div className="result-dossier">
                    <p className="eyebrow">THE REVEALED DOSSIER</p>
                    <div className="imposter-reveal-row">
                      <span className="player-avatar avatar-1">
                        {room.revealedImposter.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <strong>{room.revealedImposter.name}</strong> was the <strong>IMPOSTER</strong>.
                      </div>
                    </div>

                    <div className="comparison-table">
                      <div className="comparison-col real">
                        <h4>{isClassicMode ? 'CREW SUBJECT' : isGeeksforGeeksRoom ? 'CREW DSA TERM' : 'CREW PROBLEM'}</h4>
                        <div className="comparison-title">{room.revealedImposter.problemTitle}</div>
                      </div>
                      <div className="comparison-col decoy">
                        <h4>{isClassicMode ? 'IMPOSTER SUBJECT' : isGeeksforGeeksRoom ? 'IMPOSTER DECOY TERM' : 'IMPOSTER DECOY'}</h4>
                        <div className="comparison-title">{room.revealedImposter.decoyTitle}</div>
                      </div>
                    </div>
                  </div>
                )}

                {error && <p className="error-message" role="alert">{error}</p>}

                <div className="lobby-actions">
                  {isPlayerHost ? (
                    <button
                      className="button button-primary start-button"
                      type="button"
                      onClick={handlePlayAgain}
                      disabled={busy}
                    >
                      {busy ? 'RESTORING...' : 'PLAY AGAIN'}
                      <span aria-hidden="true"> ↗</span>
                    </button>
                  ) : (
                    <p className="start-note">Waiting for host to restart lobby...</p>
                  )}
                </div>
              </section>
            )}

            {/* LIVE ROSTER STATUS */}
            <section className="players-panel" aria-labelledby="active-roster-title">
              <div className="panel-heading">
                <h3 id="active-roster-title">Active Roster</h3>
                <span className="minimum-note">
                  {players.filter(([, p]) => p.alive !== false).length} ALIVE
                </span>
              </div>
              <ul className="player-list">
                {players.map(([uid, player], index) => {
                  const isPlayerAlive = player.alive !== false
                  return (
                    <li
                      className={`player-row ${!isPlayerAlive ? 'is-eliminated' : ''}`}
                      key={uid}
                    >
                      <span className={`player-avatar avatar-${index % 5}`} aria-hidden="true">
                        {player.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="player-name">
                        {player.name}
                        {uid === user?.uid && <small> (YOU)</small>}
                        {player.isBot && <small> [BOT]</small>}
                      </span>

                      {/* Status indicator tag */}
                      {!isPlayerAlive ? (
                        <span className="player-status-tag tag-eliminated">ELIMINATED</span>
                      ) : room.phase === 'hint' ? (
                        player.hint ? (
                          <span className="player-status-tag tag-ready">HINT READY ✓</span>
                        ) : (
                          <span className="player-status-tag tag-waiting">COMPOSING...</span>
                        )
                      ) : room.phase === 'vote' ? (
                        player.vote ? (
                          <span className="player-status-tag tag-ready">VOTED ✓</span>
                        ) : (
                          <span className="player-status-tag tag-waiting">DELIBERATING...</span>
                        )
                      ) : null}

                      {room.hostUid === uid && <span className="host-tag">HOST</span>}
                      <span className="connected-indicator" aria-label="Connected" />
                    </li>
                  )
                })}
              </ul>
            </section>

            <button className="text-button leave-button" onClick={leaveRoom}>
              ← Leave room
            </button>
          </section>
        )}
        <footer className="footer-note">
          {isClassicMode ? 'O(SUS) // HINTS, BLUFFS & BAD GUESSES' : 'O(SUS) // ALGORITHMS, ALIBIS & BAD HINTS'}
        </footer>
      </main>
    )
  }

  // LANDING VIEW
  return (
    <>
    <audio ref={splashAudioRef} className="splash-audio" src={splashAudio} loop preload="auto" />
    <main className={`app-shell landing-shell ${introDone ? landingEntering ? 'landing-entering' : '' : 'landing-covered'}`}>
      <header className="topbar">
        <a className="wordmark" href="/">
          <img className="wordmark-mark" src="/mask-logo.png" alt="" aria-hidden="true" />
          O<span>(sus)</span>
        </a>
        <button
          className="mode-toggle"
          type="button"
          role="switch"
          aria-checked={gameMode === 'classic'}
          onClick={() => setGameMode((mode) => mode === 'dsa' ? 'classic' : 'dsa')}
        >
          <span className="mode-toggle-label">GAME MODE</span>
          <span className={`mode-toggle-track ${gameMode === 'classic' ? 'is-classic' : ''}`} aria-hidden="true">
            <span />
          </span>
          <span className="mode-toggle-value">{gameMode === 'classic' ? 'CLASSIC' : 'DSA'}</span>
        </button>
      </header>

      <section className="landing-content" aria-labelledby="game-title">
        <div className="hero-copy">
          <p className="eyebrow">{gameMode === 'classic' ? 'A SOCIAL DEDUCTION GAME FOR EVERYONE' : 'A SOCIAL DEDUCTION GAME FOR CODERS'}</p>
          <h1 id="game-title">
            {gameMode === 'classic' ? <>One subject.<br /></> : <>One problem.<br /></>}
            One imposter<span className="cursor">_</span>
          </h1>
          <p className="lede">
            {gameMode === 'classic'
              ? 'Everyone gets a related everyday subject. Except the imposter. Give hints, read the room, and figure out who got the odd one out.'
              : 'Everyone gets the same DSA problem. Except the imposter. Give hints, read the room, and find the bug in your friend group.'}
          </p>
          <div className="game-facts">
            <span>
              <b>02—10</b> PLAYERS
            </span>
            <span>
              <b>01</b> IMPOSTER
            </span>
            <span>
              <b>∞</b> SUSPICION
            </span>
          </div>
        </div>

        <section className="entry-panel" aria-label="Create or join a game">
          {!firebaseConfigured && (
            <div className="setup-message" role="status">
              <strong>Firebase setup needed</strong>
              <span>
                Replace the sample values in <code>.env.local</code> with your Firebase web app config.
                Enable Anonymous sign-in and deploy the database rules; then restart the dev server.
              </span>
            </div>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          {authStatus === 'error' && firebaseConfigured && (
            <button
              className="text-button retry-button"
              type="button"
              onClick={retryAuthConnection}
            >
              Retry Firebase connection
            </button>
          )}
          <label className="field-label" htmlFor="player-name">
            YOUR CODENAME
          </label>
          <input
            id="player-name"
            className="terminal-input"
            autoComplete="nickname"
            maxLength={20}
            minLength={2}
            placeholder="e.g. bigO_bandit"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <p className="field-hint">2–20 characters. Choose wisely.</p>

          <button
            className="button button-primary create-button"
            type="button"
            onClick={handleCreateRoom}
            disabled={!canEnterRoom}
          >
            {busy ? 'CONNECTING...' : 'CREATE A ROOM'}
            <span aria-hidden="true"> ↗</span>
          </button>

          <section className="club-room-card" aria-labelledby="geeksforgeeks-room-title">
            <p className="eyebrow">CLUB ROOM // FIRST-YEAR FRIENDLY</p>
            <h2 id="geeksforgeeks-room-title">GeeksforGeeks room</h2>
            <p>Practice only Arrays, Strings, Binary Search, and Trees before joining the main O(SUS) rooms.</p>
            <button
              className="button button-secondary create-button"
              type="button"
              onClick={handleCreateGeeksforGeeksRoom}
              disabled={!canEnterRoom}
            >
              {busy ? 'CONNECTING...' : 'CREATE GEEKSFORGEEKS ROOM'}
            </button>
          </section>


          <div className="divider">
            <span>OR JOIN YOUR CREW</span>
          </div>
          <form className="join-form" onSubmit={handleJoinRoom}>
            <label className="field-label" htmlFor="room-code">
              FIVE-LETTER ROOM CODE
            </label>
            <div className="join-row">
              <input
                id="room-code"
                className="terminal-input room-input"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={5}
                placeholder="ABCDE"
                value={roomCodeInput}
                onChange={(event) =>
                  setRoomCodeInput(
                    event.target.value.replace(/[^a-z]/gi, '').toUpperCase(),
                  )
                }
              />
              <button
                className="button button-secondary join-button"
                type="submit"
                disabled={!canEnterRoom || roomCodeInput.length !== 5}
              >
                JOIN
              </button>
            </div>
          </form>
          {!user && authStatus === 'connecting' && (
            <p className="field-hint auth-hint">Connecting anonymously...</p>
          )}
        </section>
      </section>

      <footer className="footer-note">O(SUS) // ALGORITHMS, ALIBIS & BAD HINTS</footer>
    </main>
    {!introStarted && !introDone && (
      <section className="intro-start-screen" aria-label="Start the O(sus) intro">
        <div className="intro-start-content">
          <img className="intro-start-mark" src="/mask-logo.png" alt="" aria-hidden="true" />
          <h1 className="intro-start-title">O<span>(sus)</span></h1>
          <p className="intro-start-tagline">Algorithms, Alibis &amp; Bad Hints</p>
          <button className="button button-primary intro-start-button" type="button" onClick={() => void startIntro()}>
            START
          </button>
          {audioError && <p className="intro-start-error" role="alert">{audioError}</p>}
        </div>
      </section>
    )}
    {introStarted && !introDone && <Splash onComplete={finishIntro} />}
    </>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = 'code' in error && typeof error.code === 'string' ? error.code : ''
    if (code === 'auth/operation-not-allowed') {
      return 'Anonymous sign-in is disabled. Enable it in Firebase Console under Authentication → Sign-in method.'
    }
    if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
      return 'Firebase rejected the API key. Check the web app values in .env.local and restart the dev server.'
    }
    if (code === 'auth/network-request-failed') {
      return 'Could not reach Firebase. Check your internet connection and try again.'
    }
    if (code === 'PERMISSION_DENIED' || code === 'database/permission-denied') {
      return 'Firebase denied this database request. Confirm Anonymous sign-in is enabled and deploy database.rules.json.'
    }
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

export default App
