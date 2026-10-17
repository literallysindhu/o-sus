import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import shushVideo from '../assets/shush-video.mp4'

type SplashBeat = 'boot' | 'reveal' | 'shush' | 'tagline' | 'exit'

interface SplashProps {
  onComplete: () => void
}

const timeline: Array<{ at: number; action: SplashBeat | 'complete' }> = [
  { at: 0, action: 'boot' },
  { at: 3200, action: 'reveal' },
  { at: 6200, action: 'shush' },
  { at: 7800, action: 'tagline' },
  { at: 8900, action: 'exit' },
  { at: 9700, action: 'complete' },
]

const bootLines = [
  { text: '> initializing sus_detector...', width: '34ch' },
  { text: '> loading problem_bank.........OK', width: '36ch' },
  { text: '> scanning lobby for imposters..', width: '35ch' },
  { text: '> WARNING: 1 imposter detected', width: '33ch' },
]

export function Splash({ onComplete }: SplashProps) {
  const [beat, setBeat] = useState<SplashBeat>('boot')
  const beatRef = useRef<SplashBeat>('boot')
  const timersRef = useRef<number[]>([])
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const complete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
  }, [])

  const skipToExit = useCallback(() => {
    if (beatRef.current === 'exit' || completedRef.current) return
    clearTimers()
    beatRef.current = 'exit'
    setBeat('exit')
    timersRef.current.push(window.setTimeout(complete, 800))
  }, [clearTimers, complete])

  useEffect(() => {
    timeline.forEach(({ at, action }) => {
      timersRef.current.push(window.setTimeout(() => {
        if (action === 'complete') {
          complete()
          return
        }
        beatRef.current = action
        setBeat(action)
      }, at))
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape' || event.key.length === 1) {
        event.preventDefault()
        skipToExit()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      clearTimers()
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [clearTimers, complete, skipToExit])

  return (
    <div
      className={`splash-overlay splash-${beat}`}
      role="presentation"
      onClick={skipToExit}
      aria-hidden="true"
    >
      <div className="splash-vignette" />
      <div className={`splash-content ${beat === 'shush' ? 'splash-content-shush' : ''}`}>
        {beat === 'boot' && (
          <div className="splash-terminal">
            <span className="splash-cursor" />
            {bootLines.map((line, index) => (
              <div
                className={`splash-line ${index === bootLines.length - 1 ? 'splash-warning' : ''}`}
                key={line.text}
                style={{ '--line-delay': `${0.15 + index * 0.55}s`, '--line-width': line.width } as CSSProperties}
              >
                {line.text}
              </div>
            ))}
          </div>
        )}

        {beat === 'shush' && (
          <div className="splash-shush-scene">
            <video
              className="splash-shush-image"
              src={shushVideo}
              autoPlay
              playsInline
              preload="auto"
              aria-label="Close-up shushing video"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget
                video.currentTime = Math.max(0, video.duration - 1.5)
                void video.play().catch(() => undefined)
              }}
              onTimeUpdate={(event) => {
                const video = event.currentTarget
                if (video.currentTime >= video.duration - 0.08) video.pause()
              }}
            />
          </div>
        )}

        {(beat === 'reveal' || beat === 'tagline' || beat === 'exit') && (
          <div className={`splash-brand ${beat === 'reveal' ? 'splash-brand-revealing' : ''}`}>
            <div className="splash-notation-stack" aria-label="O(sus)">
              {['O(1)', 'O(log n)', 'O(n)', 'O(n^2)', 'O(sus)'].map((notation, index) => (
                <span
                  className={`splash-notation ${index === 4 ? 'splash-final-notation' : ''}`}
                  data-text={notation}
                  key={notation}
                  style={{ '--notation-index': index, '--notation-delay': `${index * 0.3}s` } as CSSProperties}
                >
                  {index === 4 ? <><span>O(</span><span className="splash-sus">sus</span><span>)</span></> : notation}
                </span>
              ))}
            </div>
            {beat === 'tagline' || beat === 'exit' ? (
              <p className="splash-tagline">Algorithms, Alibis &amp; Bad Hints</p>
            ) : null}
          </div>
        )}
      </div>
      {beat !== 'exit' && <p className="splash-skip-hint">PRESS ANY KEY TO SKIP</p>}
    </div>
  )
}
