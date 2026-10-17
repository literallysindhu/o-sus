import type { ProblemPair } from '../problems/types'
import { EASY_PROBLEMS } from '../problems/easy'
import { MEDIUM_PROBLEMS } from '../problems/medium'
import { HARD_PROBLEMS } from '../problems/hard'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyOption {
  readonly id: Difficulty
  readonly label: string
  readonly tagline: string
}

export const DIFFICULTIES: readonly DifficultyOption[] = [
  {
    id: 'easy',
    label: 'Amateur Hour',
    tagline: 'Arrays? I barely know her.',
  },
  {
    id: 'medium',
    label: 'Mid-Level Menace',
    tagline: 'Dangerous with a whiteboard.',
  },
  {
    id: 'hard',
    label: 'Oh You Think You Know DSA?',
    tagline: 'Bring snacks. And therapy.',
  },
] as const

export function getBank(id: Difficulty): ProblemPair[] {
  switch (id) {
    case 'easy':
      return EASY_PROBLEMS
    case 'medium':
      return MEDIUM_PROBLEMS
    case 'hard':
      return HARD_PROBLEMS
    default:
      return EASY_PROBLEMS
  }
}
