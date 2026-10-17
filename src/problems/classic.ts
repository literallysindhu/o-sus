import type { Difficulty } from '../game/difficulty'
import type { ProblemPair } from './types'

// Everyday subjects keep the classic mode playable without any coding knowledge.
export const CLASSIC_PROBLEMS: ProblemPair[] = [
  { problem: { title: 'Coffee', statement: 'Describe this everyday drink without naming it.' }, decoy: { title: 'Tea', statement: 'Describe this everyday drink without naming it.' } },
  { problem: { title: 'Beach', statement: 'Describe this kind of place without naming it.' }, decoy: { title: 'Swimming pool', statement: 'Describe this kind of place without naming it.' } },
  { problem: { title: 'Bicycle', statement: 'Describe this way to get around without naming it.' }, decoy: { title: 'Motorcycle', statement: 'Describe this way to get around without naming it.' } },
  { problem: { title: 'Pizza', statement: 'Describe this popular meal without naming it.' }, decoy: { title: 'Burger', statement: 'Describe this popular meal without naming it.' } },
  { problem: { title: 'Cinema', statement: 'Describe this place people go for entertainment without naming it.' }, decoy: { title: 'Theatre', statement: 'Describe this place people go for entertainment without naming it.' } },
  { problem: { title: 'Dog', statement: 'Describe this familiar animal without naming it.' }, decoy: { title: 'Cat', statement: 'Describe this familiar animal without naming it.' } },
  { problem: { title: 'Airplane', statement: 'Describe this kind of transport without naming it.' }, decoy: { title: 'Train', statement: 'Describe this kind of transport without naming it.' } },
  { problem: { title: 'Rain', statement: 'Describe this kind of weather without naming it.' }, decoy: { title: 'Snow', statement: 'Describe this kind of weather without naming it.' } },
  { problem: { title: 'Guitar', statement: 'Describe this musical instrument without naming it.' }, decoy: { title: 'Piano', statement: 'Describe this musical instrument without naming it.' } },
  { problem: { title: 'Camping', statement: 'Describe this kind of holiday without naming it.' }, decoy: { title: 'Road trip', statement: 'Describe this kind of holiday without naming it.' } },
  { problem: { title: 'Pancakes', statement: 'Describe this breakfast food without naming it.' }, decoy: { title: 'Waffles', statement: 'Describe this breakfast food without naming it.' } },
  { problem: { title: 'Library', statement: 'Describe this public place without naming it.' }, decoy: { title: 'Bookstore', statement: 'Describe this public place without naming it.' } },
]

export function getClassicBank(difficulty: Difficulty): ProblemPair[] {
  const difficultyIndex = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2
  return CLASSIC_PROBLEMS.slice(difficultyIndex * 4, difficultyIndex * 4 + 4)
}
