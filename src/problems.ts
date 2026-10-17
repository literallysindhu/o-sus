export interface ProblemItem {
  title: string
  statement: string
}

export interface ProblemPair {
  problem: ProblemItem
  decoy: ProblemItem
}

export const PROBLEMS: ProblemPair[] = [
  {
    problem: {
      title: 'Two Sum',
      statement: 'Find two indices in an array such that their values add up to a specific target.',
    },
    decoy: {
      title: '3Sum',
      statement: 'Find all unique triplets in an array that give a sum of zero.',
    },
  },
  {
    problem: {
      title: 'LRU Cache',
      statement: 'Design a data structure that evicts the least recently used key when capacity is exceeded.',
    },
    decoy: {
      title: 'LFU Cache',
      statement: 'Design a data structure that evicts the least frequently used key when capacity is exceeded.',
    },
  },
  {
    problem: {
      title: 'Valid Parentheses',
      statement: 'Determine if an input string with brackets "()[]{}" is closed in the correct order.',
    },
    decoy: {
      title: 'Generate Parentheses',
      statement: 'Generate all combinations of well-formed parentheses given n pairs of brackets.',
    },
  },
  {
    problem: {
      title: 'Binary Search',
      statement: 'Search for a target value within a sorted array in O(log n) runtime.',
    },
    decoy: {
      title: 'Search in Rotated Sorted Array',
      statement: 'Search for a target value in a sorted array that has been rotated at an unknown pivot.',
    },
  },
  {
    problem: {
      title: 'Merge Two Sorted Lists',
      statement: 'Merge two sorted linked lists into one single sorted list and return its head.',
    },
    decoy: {
      title: 'Merge k Sorted Lists',
      statement: 'Merge k sorted linked lists and return it as one combined sorted list.',
    },
  },
  {
    problem: {
      title: 'Longest Substring Without Repeating Characters',
      statement: 'Find the length of the longest contiguous substring without any duplicate characters.',
    },
    decoy: {
      title: 'Longest Repeating Character Replacement',
      statement: 'Find the longest substring of same letters achievable after replacing at most k characters.',
    },
  },
  {
    problem: {
      title: 'Coin Change',
      statement: 'Find the fewest number of coins needed to make up a given monetary amount.',
    },
    decoy: {
      title: 'Coin Change II',
      statement: 'Compute the number of distinct combinations that sum up to a target amount using unlimited coins.',
    },
  },
  {
    problem: {
      title: 'Best Time to Buy and Sell Stock',
      statement: 'Find the maximum single-transaction profit from buying and later selling a stock.',
    },
    decoy: {
      title: 'Best Time to Buy and Sell Stock II',
      statement: 'Find the maximum total profit from executing as many non-overlapping stock trades as desired.',
    },
  },
  {
    problem: {
      title: 'Maximum Subarray',
      statement: 'Find the contiguous subarray within an array of numbers that has the largest sum.',
    },
    decoy: {
      title: 'Maximum Product Subarray',
      statement: 'Find a contiguous non-empty subarray within an array of numbers that has the largest product.',
    },
  },
  {
    problem: {
      title: 'Climbing Stairs',
      statement: 'Count how many distinct ways you can climb n stairs taking 1 or 2 steps each time.',
    },
    decoy: {
      title: 'Min Cost Climbing Stairs',
      statement: 'Find the minimum cost to reach the top of a staircase where each step has a designated fee.',
    },
  },
  {
    problem: {
      title: 'Number of Islands',
      statement: 'Count the number of 4-directionally connected components of "1"s in a 2D binary grid.',
    },
    decoy: {
      title: 'Max Area of Island',
      statement: 'Find the maximum area of a single connected component of "1"s in a 2D binary grid.',
    },
  },
  {
    problem: {
      title: 'Course Schedule',
      statement: 'Determine whether you can finish all courses given prerequisite directed dependencies.',
    },
    decoy: {
      title: 'Course Schedule II',
      statement: 'Return a valid topological course ordering to finish all courses given prerequisites.',
    },
  },
  {
    problem: {
      title: 'House Robber',
      statement: 'Determine the maximum loot you can rob along a street without hitting two adjacent houses.',
    },
    decoy: {
      title: 'House Robber II',
      statement: 'Determine the maximum loot you can rob from houses arranged in a circle without hitting adjacent houses.',
    },
  },
  {
    problem: {
      title: 'Kth Largest Element in an Array',
      statement: 'Find the kth largest element in an unsorted array without completely sorting it.',
    },
    decoy: {
      title: 'Top K Frequent Elements',
      statement: 'Given an integer array and an integer k, return the k most frequent elements in any order.',
    },
  },
  {
    problem: {
      title: 'Word Break',
      statement: 'Determine if a string can be segmented into a space-separated sequence of dictionary words.',
    },
    decoy: {
      title: 'Word Break II',
      statement: 'Construct all valid sentences where each token is an exact word from the dictionary.',
    },
  },
  {
    problem: {
      title: 'Rotting Oranges',
      statement: 'Find the minimum minutes required until no fresh orange remains using multi-source BFS.',
    },
    decoy: {
      title: 'Walls and Gates',
      statement: 'Fill each empty room with the shortest distance to its nearest gate in a 2D grid.',
    },
  },
  {
    problem: {
      title: 'Invert Binary Tree',
      statement: 'Invert a binary tree by swapping the left and right children of every node.',
    },
    decoy: {
      title: 'Symmetric Tree',
      statement: 'Check whether a binary tree is a mirror reflection of itself around its root center.',
    },
  },
  {
    problem: {
      title: 'Valid Palindrome',
      statement: 'Determine if a string is a palindrome after converting to lowercase and stripping non-alphanumeric chars.',
    },
    decoy: {
      title: 'Valid Palindrome II',
      statement: 'Determine if a string can form a valid palindrome after deleting at most one character.',
    },
  },
  {
    problem: {
      title: 'Subarray Sum Equals K',
      statement: 'Find the total count of continuous subarrays whose elements sum up to a target value k.',
    },
    decoy: {
      title: 'Continuous Subarray Sum',
      statement: 'Check if an array contains a continuous subarray of length at least 2 whose sum is a multiple of k.',
    },
  },
  {
    problem: {
      title: 'Decode Ways',
      statement: 'Count the number of ways to decode a numerical string where 1 to 26 map to A through Z.',
    },
    decoy: {
      title: 'Decode String',
      statement: 'Decode an encoded string where patterns like k[encoded_string] are expanded k times.',
    },
  },
]
