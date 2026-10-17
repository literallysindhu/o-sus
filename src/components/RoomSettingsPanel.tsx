import { useState } from 'react'
import {
  DIFFICULTIES,
  type Difficulty,
} from '../game/difficulty'
import type { GameMode } from '../firebase'
import {
  ALLOWED_MAX_ROUNDS,
  ALLOWED_HINT_SECONDS,
  ALLOWED_DISCUSS_SECONDS,
  ALLOWED_VOTE_SECONDS,
  type RoomSettings,
} from '../game/settings'

interface RoomSettingsPanelProps {
  settings: RoomSettings
  onChange?: (next: RoomSettings) => void
  readOnly?: boolean
  isCollapsible?: boolean
  initialOpen?: boolean
  gameMode?: GameMode
}

export function RoomSettingsPanel({
  settings,
  onChange,
  readOnly = false,
  isCollapsible = false,
  initialOpen = false,
  gameMode = 'dsa',
}: RoomSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const modeDifficulties = gameMode === 'classic'
    ? [
        { id: 'easy' as const, label: 'Easygoing', tagline: 'Familiar subjects and easy clues.' },
        { id: 'medium' as const, label: 'Social Sleuth', tagline: 'A few good guesses needed.' },
        { id: 'hard' as const, label: 'Master of Misdirection', tagline: 'Subtle subjects. Choose every clue carefully.' },
      ]
    : DIFFICULTIES

  const activeDifficulty =
    modeDifficulties.find((d) => d.id === settings.difficulty) ?? modeDifficulties[0]

  function updateDifficulty(difficulty: Difficulty) {
    if (readOnly || !onChange) return
    onChange({ ...settings, difficulty })
  }

  function updateField<K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) {
    if (readOnly || !onChange) return
    onChange({ ...settings, [key]: value })
  }

  // Read-only presentation for non-hosts in the lobby
  if (readOnly) {
    return (
      <section className="settings-summary-panel" aria-label="Room Settings (Host controlled)">
        <div className="settings-summary-header">
          <span className="eyebrow">MISSION PARAMETERS</span>
          <span className="readonly-badge">HOST CONTROLLED</span>
        </div>
        <div className="settings-summary-content">
          <div className="summary-item summary-item-highlight">
            <span className="summary-label">DIFFICULTY</span>
            <strong className="summary-value">{activeDifficulty.label}</strong>
            <span className="summary-tagline">"{activeDifficulty.tagline}"</span>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">ROUNDS</span>
              <span className="summary-value">{settings.maxRounds} max</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">HINT TIMER</span>
              <span className="summary-value">{settings.hintSeconds}s</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">DISCUSS TIMER</span>
              <span className="summary-value">{settings.discussSeconds}s</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">VOTE TIMER</span>
              <span className="summary-value">{settings.voteSeconds}s</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const content = (
    <div className="settings-controls-wrapper">
      {/* 1. Difficulty Level Cards */}
      <fieldset className="settings-group">
        <legend className="settings-legend">
          {gameMode === 'classic' ? 'DIFFICULTY LEVEL // SUBJECTS' : 'DIFFICULTY LEVEL // TOPIC DIFFICULTY'}
        </legend>
        <div className="difficulty-cards-grid" role="radiogroup" aria-label="Difficulty level">
          {modeDifficulties.map((diff) => {
            const isSelected = settings.difficulty === diff.id
            return (
              <button
                key={diff.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`difficulty-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => updateDifficulty(diff.id)}
              >
                <div className="difficulty-card-header">
                  <span className="difficulty-label">{diff.label}</span>
                  <span className="selection-dot" aria-hidden="true" />
                </div>
                <p className="difficulty-tagline">"{diff.tagline}"</p>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* 2. Max Rounds Segmented Control */}
      <fieldset className="settings-group">
        <legend className="settings-legend">MAX NUMBER OF ROUNDS</legend>
        <div
          className="segmented-control"
          role="radiogroup"
          aria-label="Max number of rounds"
        >
          {ALLOWED_MAX_ROUNDS.map((rounds) => {
            const isSelected = settings.maxRounds === rounds
            return (
              <button
                key={rounds}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`segmented-button ${isSelected ? 'is-selected' : ''}`}
                onClick={() => updateField('maxRounds', rounds)}
              >
                {rounds} {rounds === 1 ? 'Round' : 'Rounds'}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* 3. Phase Timer Segmented Controls */}
      <div className="timers-grid">
        <fieldset className="settings-group">
          <legend className="settings-legend">HINT TIME</legend>
          <div
            className="segmented-control"
            role="radiogroup"
            aria-label="Hint timer in seconds"
          >
            {ALLOWED_HINT_SECONDS.map((sec) => {
              const isSelected = settings.hintSeconds === sec
              return (
                <button
                  key={sec}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`segmented-button ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => updateField('hintSeconds', sec)}
                >
                  {sec}s
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="settings-group">
          <legend className="settings-legend">DISCUSSION TIME</legend>
          <div
            className="segmented-control"
            role="radiogroup"
            aria-label="Discussion timer in seconds"
          >
            {ALLOWED_DISCUSS_SECONDS.map((sec) => {
              const isSelected = settings.discussSeconds === sec
              return (
                <button
                  key={sec}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`segmented-button ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => updateField('discussSeconds', sec)}
                >
                  {sec}s
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="settings-group">
          <legend className="settings-legend">VOTE TIME</legend>
          <div
            className="segmented-control"
            role="radiogroup"
            aria-label="Vote timer in seconds"
          >
            {ALLOWED_VOTE_SECONDS.map((sec) => {
              const isSelected = settings.voteSeconds === sec
              return (
                <button
                  key={sec}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`segmented-button ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => updateField('voteSeconds', sec)}
                >
                  {sec}s
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>
    </div>
  )

  if (isCollapsible) {
    return (
      <section className="collapsible-settings-panel" aria-label="Room configuration">
        <button
          type="button"
          className="settings-toggle-button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
        >
          <span className="toggle-left">
            <span className="gear-icon" aria-hidden="true">⚙</span>
            <span className="toggle-title">CUSTOMIZE ROOM SETTINGS</span>
            <span className="toggle-summary">
              {activeDifficulty.label} • {settings.maxRounds}R • {settings.discussSeconds}s discuss
            </span>
          </span>
          <span className="toggle-indicator" aria-hidden="true">
            {isOpen ? '▲ HIDE' : '▼ CONFIGURE'}
          </span>
        </button>

        {isOpen && <div className="collapsible-settings-body">{content}</div>}
      </section>
    )
  }

  return (
    <section className="settings-editor-panel" aria-label="Room configuration">
      <div className="panel-heading">
        <span className="eyebrow">ROOM SETTINGS</span>
        <span className="minimum-note">HOST CONTROLLED · BEFORE START</span>
      </div>
      {content}
    </section>
  )
}
