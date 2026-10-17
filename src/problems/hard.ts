import type { ProblemPair } from './types'

export const HARD_PROBLEMS: ProblemPair[] = [
  {
    // Median of Two Sorted Arrays / Merge k Sorted Lists
    problem: {
      title: 'Median Showdown',
      statement: 'Given two sorted arrays, find the median of all their elements combined in O(log(m+n)) time.',
    },
    decoy: {
      title: 'Merge the Mob',
      statement: 'Given k sorted linked lists, merge them into one sorted linked list.',
    },
  },
  {
    // Trapping Rain Water / Container With Most Water
    problem: {
      title: 'Puddle Collector',
      statement: 'Given bar heights, compute how much rain water is trapped between the bars after it rains.',
    },
    decoy: {
      title: 'Biggest Bathtub',
      statement: 'Given bar heights, pick two bars that together hold the most water.',
    },
  },
  {
    // Minimum Window Substring / Permutation in String
    problem: {
      title: 'Shortest Snack Window',
      statement: 'Given strings s and t, find the smallest window of s that contains every character of t.',
    },
    decoy: {
      title: 'Hidden Anagram Hunt',
      statement: 'Given strings s and t, check whether s contains any permutation of t as a substring.',
    },
  },
  {
    // Word Ladder / Alien Dictionary
    problem: {
      title: 'Word Hopscotch',
      statement: 'Given two words and a dictionary, find the shortest chain of one-letter changes from one word to the other.',
    },
    decoy: {
      title: 'Alien Alphabet Gossip',
      statement: 'Given a list of words sorted in an unknown alphabet, recover the order of that alphabet.',
    },
  },
  {
    // N-Queens / Sudoku Solver
    problem: {
      title: 'Royal Seating Drama',
      statement: 'Place n queens on an n by n board so that no two queens attack each other, and return all arrangements.',
    },
    decoy: {
      title: 'Number Jigsaw Meltdown',
      statement: 'Fill a partially completed 9 by 9 Sudoku grid so every row, column and box has the digits 1 to 9.',
    },
  },
  {
    // Edit Distance / Longest Common Subsequence
    problem: {
      title: 'Typo Surgeon',
      statement: 'Given two words, find the minimum number of insert, delete or replace operations to turn one into the other.',
    },
    decoy: {
      title: 'Twin Strings Overlap',
      statement: 'Given two strings, find the length of the longest subsequence that appears in both.',
    },
  },
  {
    // Serialize and Deserialize Binary Tree / Construct Tree from Preorder and Inorder
    problem: {
      title: 'Tree Zip File',
      statement: 'Design a way to turn a binary tree into a string and rebuild the exact same tree from that string.',
    },
    decoy: {
      title: 'Tree Rebuild From Clues',
      statement: 'Given the preorder and inorder traversals of a binary tree, reconstruct the tree.',
    },
  },
  {
    // Largest Rectangle in Histogram / Maximal Rectangle
    problem: {
      title: 'Skyline Block Stacker',
      statement: 'Given the heights of bars in a histogram, find the area of the largest rectangle inside it.',
    },
    decoy: {
      title: 'Skyline Block Stacker in a Grid',
      statement: 'Given a binary matrix of 0s and 1s, find the area of the largest rectangle containing only 1s.',
    },
  },
]