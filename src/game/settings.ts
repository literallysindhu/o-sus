import type { Difficulty } from './difficulty'

export interface RoomSettings {
  difficulty: Difficulty
  maxRounds: number
  hintSeconds: number
  discussSeconds: number
  voteSeconds: number
}

export const ALLOWED_DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'] as const
export const ALLOWED_MAX_ROUNDS = [1, 2, 3, 4, 5] as const
export const ALLOWED_HINT_SECONDS = [15, 30, 45, 60] as const
export const ALLOWED_DISCUSS_SECONDS = [30, 60, 90, 120, 180] as const
export const ALLOWED_VOTE_SECONDS = [15, 30, 45] as const

export const DEFAULT_SETTINGS: RoomSettings = {
  difficulty: 'easy',
  maxRounds: 3,
  hintSeconds: 45,
  discussSeconds: 60,
  voteSeconds: 30,
}
