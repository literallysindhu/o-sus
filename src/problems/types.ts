export interface ProblemItem {
  title: string
  statement: string
}

export interface ProblemPair {
  problem: ProblemItem
  decoy: ProblemItem
}
