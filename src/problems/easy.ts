import type { ProblemPair } from './types'

export const EASY_PROBLEMS: ProblemPair[] = [
  {
    problem: {
      title: 'Two Sum',
      statement:
        'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Assume exactly one solution exists.',
    },
    decoy: {
      title: '3Sum',
      statement:
        'Given an integer array, return all unique triplets that sum to zero. The solution set must not contain duplicate triplets.',
    },
  },
  {
    problem: {
      title: 'Valid Parentheses',
      statement:
        'Given a string containing only \"(\", \")\", \"{\", \"}\", \"[\" and \"]\", determine if the input string is valid — every open bracket must be closed in the correct order.',
    },
    decoy: {
      title: 'Generate Parentheses',
      statement:
        'Given n pairs of parentheses, generate all combinations of well-formed parentheses and return them as a list of strings.',
    },
  },
  {
    problem: {
      title: 'Reverse Linked List',
      statement:
        'Given the head of a singly linked list, reverse the list and return the new head. Solve it iteratively and recursively.',
    },
    decoy: {
      title: 'Reverse Linked List II',
      statement:
        'Given the head of a singly linked list and two integers left and right, reverse the nodes from position left to position right in one pass.',
    },
  },
  {
    problem: {
      title: 'Binary Search',
      statement:
        'Given a sorted array of distinct integers and a target value, return the index of the target. If not found, return -1. Must run in O(log n) time.',
    },
    decoy: {
      title: 'Search Insert Position',
      statement:
        'Given a sorted array and a target value, return the index if found. If not, return the index where it would be inserted to keep the array sorted.',
    },
  },
  {
    problem: {
      title: 'Climbing Stairs',
      statement:
        'You can climb 1 or 2 steps at a time. Given n steps, count the number of distinct ways you can reach the top.',
    },
    decoy: {
      title: 'Min Cost Climbing Stairs',
      statement:
        'Each step on a staircase has a cost. You can start from step 0 or step 1. Pay the cost and climb 1 or 2 steps. Find the minimum cost to reach the top.',
    },
  },
  {
    problem: {
      title: 'Maximum Subarray',
      statement:
        "Given an integer array, find the contiguous subarray with the largest sum and return that sum. Kadane's algorithm applies here.",
    },
    decoy: {
      title: 'Maximum Product Subarray',
      statement:
        'Given an integer array, find the contiguous subarray with the largest product and return that product. Negative numbers can flip the sign.',
    },
  },
  {
    problem: {
      title: 'Best Time to Buy and Sell Stock',
      statement:
        'Given an array of prices where prices[i] is the price on day i, find the max profit from a single buy-then-sell transaction.',
    },
    decoy: {
      title: 'Best Time to Buy and Sell Stock II',
      statement:
        'Given an array of daily prices, find the maximum profit by buying and selling on multiple days. You can hold at most one share at a time.',
    },
  },
  {
    problem: {
      title: 'Merge Two Sorted Lists',
      statement:
        'Given the heads of two sorted linked lists, merge them into one sorted list by splicing together the nodes of the two lists.',
    },
    decoy: {
      title: 'Merge k Sorted Lists',
      statement:
        'Given an array of k linked lists, each sorted in ascending order, merge all of them into one sorted linked list and return its head.',
    },
  },
  {
    problem: {
      title: 'Single Number',
      statement:
        'Every element in an array appears twice except one. Find that element. Your solution must be O(n) time and O(1) space using bitwise XOR.',
    },
    decoy: {
      title: 'Missing Number',
      statement:
        'Given an array containing n distinct numbers in the range [0, n], return the one number missing from the range.',
    },
  },
  {
    problem: {
      title: 'Contains Duplicate',
      statement:
        'Given an integer array, return true if any value appears at least twice, or false if all elements are distinct.',
    },
    decoy: {
      title: 'Find All Duplicates in an Array',
      statement:
        'Given an integer array of length n where elements are in range [1, n], return a list of all elements that appear twice.',
    },
  },
]
