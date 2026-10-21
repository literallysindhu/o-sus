import type { ProblemPair } from './types'

/**
 * A deliberately small, first-year-friendly DSA vocabulary bank for the club
 * room. These are concepts to learn and talk about, never coding problems.
 */
export const GEEKSFORGEEKS_PROBLEMS: ProblemPair[] = [
  {
    problem: { title: 'Array', statement: 'An ordered collection of values stored under one name.' },
    decoy: { title: 'Array Index', statement: 'The numbered position used to access a value in an array.' },
  },
  {
    problem: { title: 'Array Traversal', statement: 'Visiting each element of an array, usually from beginning to end.' },
    decoy: { title: 'Array Length', statement: 'The total number of elements stored in an array.' },
  },
  {
    problem: { title: 'String', statement: 'A sequence of characters, such as a word or a sentence.' },
    decoy: { title: 'Character', statement: 'One individual symbol inside a string, such as a letter or digit.' },
  },
  {
    problem: { title: 'Substring', statement: 'A continuous slice of characters taken from a string.' },
    decoy: { title: 'String Length', statement: 'The number of characters in a string.' },
  },
  {
    problem: { title: 'Binary Search', statement: 'A search method that repeatedly halves a sorted collection.' },
    decoy: { title: 'Sorted Array', statement: 'An array whose values are arranged in increasing or decreasing order.' },
  },
  {
    problem: { title: 'Midpoint', statement: 'The middle position checked during a binary-search step.' },
    decoy: { title: 'Search Range', statement: 'The current left-to-right portion of a sorted array being searched.' },
  },
  {
    problem: { title: 'Tree Node', statement: 'A single item in a tree that can connect to other items.' },
    decoy: { title: 'Leaf Node', statement: 'A tree node with no children.' },
  },
  {
    problem: { title: 'Root Node', statement: 'The topmost node in a tree, where the structure begins.' },
    decoy: { title: 'Tree Traversal', statement: 'A systematic way to visit every node in a tree.' },
  },
]
