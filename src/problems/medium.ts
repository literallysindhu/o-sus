import type { ProblemPair } from './types'

export const MEDIUM_PROBLEMS: ProblemPair[] = [
  {
    // LRU Cache / LFU Cache
    problem: {
      title: 'Forgetful Fridge',
      statement: 'Design a cache with a fixed capacity that evicts the least recently used item when full. get and put must run in O(1).',
    },
    decoy: {
      title: 'Picky Fridge',
      statement: 'Design a cache with a fixed capacity that evicts the least frequently used item when full. get and put must run in O(1).',
    },
  },
  {
    // Merge Intervals / Insert Interval
    problem: {
      title: 'Meeting Mashup',
      statement: 'Given a list of intervals, merge all overlapping ones and return the non-overlapping result.',
    },
    decoy: {
      title: 'Squeeze In One More',
      statement: 'Given a sorted list of non-overlapping intervals and a new interval, insert it and merge any overlaps.',
    },
  },
  {
    // Kth Largest Element / Top K Frequent Elements
    problem: {
      title: 'Podium Picker',
      statement: 'Given an array of numbers and an integer k, find the kth largest element.',
    },
    decoy: {
      title: 'Hype Leaderboard',
      statement: 'Given an array of numbers and an integer k, return the k most frequent elements.',
    },
  },
  {
    // Longest Substring Without Repeating Characters / Longest Repeating Character Replacement
    problem: {
      title: 'Snack Streak, No Repeats',
      statement: 'Given a string, find the length of the longest substring that has no repeated characters.',
    },
    decoy: {
      title: 'Snack Streak, Cheat Swaps',
      statement: 'Given a string and k, find the longest substring that can become a single repeated letter after at most k replacements.',
    },
  },
  {
    // Number of Islands / Max Area of Island
    problem: {
      title: 'Island Headcount',
      statement: 'Given a grid of land and water, count how many separate islands there are.',
    },
    decoy: {
      title: 'Biggest Island Bragging',
      statement: 'Given a grid of land and water, find the area of the largest island.',
    },
  },
  {
    // Coin Change / Combination Sum
    problem: {
      title: 'Piggy Bank Panic',
      statement: 'Given coin denominations and a target amount, find the fewest coins needed to make that amount.',
    },
    decoy: {
      title: 'Piggy Bank Recipes',
      statement: 'Given distinct numbers and a target, list every combination of them (reuse allowed) that sums to the target.',
    },
  },
  {
    // Binary Tree Level Order Traversal / Zigzag Level Order Traversal
    problem: {
      title: 'Tree Floor Tour',
      statement: 'Given a binary tree, return its node values level by level from left to right.',
    },
    decoy: {
      title: 'Dizzy Tree Floor Tour',
      statement: 'Given a binary tree, return its node values level by level, alternating direction on each level.',
    },
  },
  {
    // Daily Temperatures / Next Greater Element II
    problem: {
      title: 'Weather Waiter',
      statement: 'Given daily temperatures, return for each day how many days you must wait for a warmer one.',
    },
    decoy: {
      title: 'Weather Waiter on a Carousel',
      statement: 'Given a circular array, return for each element the next greater element, wrapping around the end.',
    },
  },
]