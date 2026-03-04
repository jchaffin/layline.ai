import path from "node:path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface Problem {
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  tags: string[];
  testCases: { input: string; expected: string; isHidden: boolean }[];
  starterCode: Record<string, string>;
  hints: string[];
}

const problems: Problem[] = [
  // ── Arrays ──────────────────────────────────────────────────────────
  {
    title: "Two Sum",
    slug: "two-sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

You may assume each input has exactly one solution, and you may not use the same element twice. Return the answer in any order.

**Example 1:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 9
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9`,
    difficulty: "easy",
    tags: ["arrays", "hash-map"],
    testCases: [
      { input: "[2,7,11,15]\n9", expected: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expected: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expected: "[0,1]", isHidden: false },
      { input: "[1,5,3,7,2]\n9", expected: "[1,3]", isHidden: true },
    ],
    starterCode: {
      python: `def two_sum(nums: list[int], target: int) -> list[int]:\n    pass`,
      javascript: `function twoSum(nums, target) {\n  \n}`,
    },
    hints: [
      "A brute force approach checks every pair — O(n^2). Can you do better?",
      "Use a hash map to store values you've seen and their indices.",
      "For each number, check if target - number exists in the map.",
    ],
  },
  {
    title: "Kth Largest Element in an Array",
    slug: "kth-largest-element",
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\`th largest element in the array.

Note that it is the kth largest element in sorted order, not the kth distinct element.

**Example 1:**
\`\`\`
Input: nums = [3,2,1,5,6,4], k = 2
Output: 5
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [3,2,3,1,2,4,5,5,6], k = 4
Output: 4
\`\`\`

**Constraints:**
- 1 <= k <= nums.length <= 10^5`,
    difficulty: "medium",
    tags: ["arrays", "sorting", "heap"],
    testCases: [
      { input: "[3,2,1,5,6,4]\n2", expected: "5", isHidden: false },
      { input: "[3,2,3,1,2,4,5,5,6]\n4", expected: "4", isHidden: false },
      { input: "[1]\n1", expected: "1", isHidden: false },
      { input: "[7,6,5,4,3,2,1]\n5", expected: "3", isHidden: true },
    ],
    starterCode: {
      python: `def find_kth_largest(nums: list[int], k: int) -> int:\n    pass`,
      javascript: `function findKthLargest(nums, k) {\n  \n}`,
    },
    hints: [
      "Sorting gives O(n log n). Can you do better?",
      "A min-heap of size k gives O(n log k).",
      "Quickselect gives average O(n) using partitioning.",
    ],
  },
  {
    title: "Merge Sorted Arrays",
    slug: "merge-sorted-arrays",
    description: `Given two sorted integer arrays \`nums1\` and \`nums2\`, merge them into a single sorted array and return it.

**Example 1:**
\`\`\`
Input: nums1 = [1,2,3], nums2 = [2,5,6]
Output: [1,2,2,3,5,6]
\`\`\`

**Example 2:**
\`\`\`
Input: nums1 = [1], nums2 = []
Output: [1]
\`\`\`

**Constraints:**
- 0 <= nums1.length, nums2.length <= 200`,
    difficulty: "easy",
    tags: ["arrays", "two-pointers"],
    testCases: [
      { input: "[1,2,3]\n[2,5,6]", expected: "[1,2,2,3,5,6]", isHidden: false },
      { input: "[1]\n[]", expected: "[1]", isHidden: false },
      { input: "[]\n[1]", expected: "[1]", isHidden: false },
      { input: "[4,5,6]\n[1,2,3]", expected: "[1,2,3,4,5,6]", isHidden: true },
    ],
    starterCode: {
      python: `def merge(nums1: list[int], nums2: list[int]) -> list[int]:\n    pass`,
      javascript: `function merge(nums1, nums2) {\n  \n}`,
    },
    hints: [
      "Use two pointers, one for each array.",
      "Compare elements at each pointer and push the smaller one.",
      "Don't forget to handle remaining elements when one array is exhausted.",
    ],
  },
  {
    title: "Product of Array Except Self",
    slug: "product-except-self",
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all elements of \`nums\` except \`nums[i]\`.

You must solve it without using division and in O(n) time.

**Example 1:**
\`\`\`
Input: nums = [1,2,3,4]
Output: [24,12,8,6]
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [-1,1,0,-3,3]
Output: [0,0,9,0,0]
\`\`\``,
    difficulty: "medium",
    tags: ["arrays", "prefix-sum"],
    testCases: [
      { input: "[1,2,3,4]", expected: "[24,12,8,6]", isHidden: false },
      { input: "[-1,1,0,-3,3]", expected: "[0,0,9,0,0]", isHidden: false },
      { input: "[2,3]", expected: "[3,2]", isHidden: false },
      { input: "[1,1,1,1]", expected: "[1,1,1,1]", isHidden: true },
    ],
    starterCode: {
      python: `def product_except_self(nums: list[int]) -> list[int]:\n    pass`,
      javascript: `function productExceptSelf(nums) {\n  \n}`,
    },
    hints: [
      "Think about prefix and suffix products.",
      "First pass: compute prefix products. Second pass: multiply by suffix.",
      "You can do it in O(1) extra space by reusing the output array.",
    ],
  },

  // ── Strings ─────────────────────────────────────────────────────────
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-no-repeat",
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

**Example 1:**
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: "abc"
\`\`\`

**Example 2:**
\`\`\`
Input: s = "bbbbb"
Output: 1
\`\`\`

**Example 3:**
\`\`\`
Input: s = "pwwkew"
Output: 3
Explanation: "wke"
\`\`\``,
    difficulty: "medium",
    tags: ["strings", "sliding-window", "hash-map"],
    testCases: [
      { input: "abcabcbb", expected: "3", isHidden: false },
      { input: "bbbbb", expected: "1", isHidden: false },
      { input: "pwwkew", expected: "3", isHidden: false },
      { input: "", expected: "0", isHidden: true },
      { input: "abcdef", expected: "6", isHidden: true },
    ],
    starterCode: {
      python: `def length_of_longest_substring(s: str) -> int:\n    pass`,
      javascript: `function lengthOfLongestSubstring(s) {\n  \n}`,
    },
    hints: [
      "Use a sliding window with two pointers.",
      "Use a set or map to track characters in the current window.",
      "When you find a duplicate, shrink the window from the left.",
    ],
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is valid.

A string is valid if:
1. Open brackets are closed by the same type.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket.

**Example 1:**
\`\`\`
Input: s = "()"
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

**Example 3:**
\`\`\`
Input: s = "(]"
Output: false
\`\`\``,
    difficulty: "easy",
    tags: ["strings", "stack"],
    testCases: [
      { input: "()", expected: "true", isHidden: false },
      { input: "()[]{}", expected: "true", isHidden: false },
      { input: "(]", expected: "false", isHidden: false },
      { input: "([)]", expected: "false", isHidden: true },
      { input: "{[]}", expected: "true", isHidden: true },
    ],
    starterCode: {
      python: `def is_valid(s: str) -> bool:\n    pass`,
      javascript: `function isValid(s) {\n  \n}`,
    },
    hints: [
      "Use a stack.",
      "Push opening brackets. For closing brackets, check the top of the stack.",
      "At the end, the stack should be empty.",
    ],
  },
  {
    title: "Group Anagrams",
    slug: "group-anagrams",
    description: `Given an array of strings \`strs\`, group the anagrams together. You can return the answer in any order.

**Example:**
\`\`\`
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
\`\`\`

**Constraints:**
- 1 <= strs.length <= 10^4
- 0 <= strs[i].length <= 100`,
    difficulty: "medium",
    tags: ["strings", "hash-map", "sorting"],
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expected: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
      { input: '[""]', expected: '[[""]]', isHidden: false },
      { input: '["a"]', expected: '[["a"]]', isHidden: false },
    ],
    starterCode: {
      python: `def group_anagrams(strs: list[str]) -> list[list[str]]:\n    pass`,
      javascript: `function groupAnagrams(strs) {\n  \n}`,
    },
    hints: [
      "Two strings are anagrams if they have the same sorted characters.",
      "Use sorted string as the hash map key.",
      "Alternatively, use character frequency counts as the key.",
    ],
  },

  // ── Linked Lists ────────────────────────────────────────────────────
  {
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    description: `Given the head of a singly linked list, reverse the list and return the reversed list.

**Example:**
\`\`\`
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

**Constraints:**
- 0 <= Number of nodes <= 5000

**Follow-up:** Can you solve it iteratively and recursively?`,
    difficulty: "easy",
    tags: ["linked-list"],
    testCases: [
      { input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]", isHidden: false },
      { input: "[1,2]", expected: "[2,1]", isHidden: false },
      { input: "[]", expected: "[]", isHidden: false },
    ],
    starterCode: {
      python: `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head: ListNode) -> ListNode:\n    pass`,
      javascript: `function reverseList(head) {\n  \n}`,
    },
    hints: [
      "Use three pointers: prev, current, next.",
      "At each step, reverse the current node's pointer.",
      "For recursion, the base case is when head is null or head.next is null.",
    ],
  },
  {
    title: "Detect Cycle in Linked List",
    slug: "linked-list-cycle",
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

A cycle exists if some node can be reached again by following \`next\` pointers.

Return \`true\` if there is a cycle, \`false\` otherwise.

**Example:**
\`\`\`
Input: head = [3,2,0,-4], pos = 1
Output: true
Explanation: Tail connects to node at index 1.
\`\`\`

**Follow-up:** Can you solve it using O(1) memory?`,
    difficulty: "easy",
    tags: ["linked-list", "two-pointers"],
    testCases: [
      { input: "[3,2,0,-4]\n1", expected: "true", isHidden: false },
      { input: "[1,2]\n0", expected: "true", isHidden: false },
      { input: "[1]\n-1", expected: "false", isHidden: false },
    ],
    starterCode: {
      python: `def has_cycle(head) -> bool:\n    pass`,
      javascript: `function hasCycle(head) {\n  \n}`,
    },
    hints: [
      "A hash set can detect revisited nodes in O(n) space.",
      "Floyd's tortoise and hare algorithm uses O(1) space.",
      "Slow pointer moves 1 step, fast pointer moves 2 steps. If they meet, there's a cycle.",
    ],
  },
  {
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    description: `Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.

**Example:**
\`\`\`
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
\`\`\`

**Constraints:**
- Both lists are sorted in non-decreasing order.`,
    difficulty: "easy",
    tags: ["linked-list"],
    testCases: [
      { input: "[1,2,4]\n[1,3,4]", expected: "[1,1,2,3,4,4]", isHidden: false },
      { input: "[]\n[]", expected: "[]", isHidden: false },
      { input: "[]\n[0]", expected: "[0]", isHidden: false },
    ],
    starterCode: {
      python: `def merge_two_lists(list1, list2):\n    pass`,
      javascript: `function mergeTwoLists(list1, list2) {\n  \n}`,
    },
    hints: [
      "Use a dummy head node to simplify edge cases.",
      "Compare the heads of both lists and advance the smaller one.",
      "Append the remaining list when one is exhausted.",
    ],
  },

  // ── Trees ───────────────────────────────────────────────────────────
  {
    title: "Maximum Depth of Binary Tree",
    slug: "max-depth-binary-tree",
    description: `Given the root of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

**Example:**
\`\`\`
Input: root = [3,9,20,null,null,15,7]
Output: 3
\`\`\``,
    difficulty: "easy",
    tags: ["trees", "recursion", "bfs"],
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expected: "3", isHidden: false },
      { input: "[1,null,2]", expected: "2", isHidden: false },
      { input: "[]", expected: "0", isHidden: false },
    ],
    starterCode: {
      python: `def max_depth(root) -> int:\n    pass`,
      javascript: `function maxDepth(root) {\n  \n}`,
    },
    hints: [
      "Recursion: depth = 1 + max(depth(left), depth(right)).",
      "Base case: null node returns 0.",
      "BFS alternative: count the number of levels.",
    ],
  },
  {
    title: "Validate Binary Search Tree",
    slug: "validate-bst",
    description: `Given the root of a binary tree, determine if it is a valid binary search tree (BST).

A valid BST is defined as:
- The left subtree of a node contains only nodes with keys less than the node's key.
- The right subtree contains only nodes with keys greater than the node's key.
- Both subtrees must also be valid BSTs.

**Example 1:**
\`\`\`
Input: root = [2,1,3]
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: root = [5,1,4,null,null,3,6]
Output: false
Explanation: The root's right child is 4, which is less than 5.
\`\`\``,
    difficulty: "medium",
    tags: ["trees", "recursion", "bst"],
    testCases: [
      { input: "[2,1,3]", expected: "true", isHidden: false },
      { input: "[5,1,4,null,null,3,6]", expected: "false", isHidden: false },
      { input: "[1]", expected: "true", isHidden: false },
      { input: "[5,4,6,null,null,3,7]", expected: "false", isHidden: true },
    ],
    starterCode: {
      python: `def is_valid_bst(root) -> bool:\n    pass`,
      javascript: `function isValidBST(root) {\n  \n}`,
    },
    hints: [
      "Pass min/max bounds down through recursion.",
      "Each node must be within (min, max). Left children narrow max, right children narrow min.",
      "An in-order traversal of a valid BST produces a strictly increasing sequence.",
    ],
  },
  {
    title: "Binary Tree Level Order Traversal",
    slug: "level-order-traversal",
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).

**Example:**
\`\`\`
Input: root = [3,9,20,null,null,15,7]
Output: [[3],[9,20],[15,7]]
\`\`\``,
    difficulty: "medium",
    tags: ["trees", "bfs"],
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expected: "[[3],[9,20],[15,7]]", isHidden: false },
      { input: "[1]", expected: "[[1]]", isHidden: false },
      { input: "[]", expected: "[]", isHidden: false },
    ],
    starterCode: {
      python: `def level_order(root) -> list[list[int]]:\n    pass`,
      javascript: `function levelOrder(root) {\n  \n}`,
    },
    hints: [
      "Use BFS with a queue.",
      "Process all nodes at the current level before moving to the next.",
      "Track the number of nodes at each level to know when to start a new subarray.",
    ],
  },
  {
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    description: `Given the root of a binary tree, invert the tree (mirror it) and return its root.

**Example:**
\`\`\`
Input: root = [4,2,7,1,3,6,9]
Output: [4,7,2,9,6,3,1]
\`\`\``,
    difficulty: "easy",
    tags: ["trees", "recursion"],
    testCases: [
      { input: "[4,2,7,1,3,6,9]", expected: "[4,7,2,9,6,3,1]", isHidden: false },
      { input: "[2,1,3]", expected: "[2,3,1]", isHidden: false },
      { input: "[]", expected: "[]", isHidden: false },
    ],
    starterCode: {
      python: `def invert_tree(root):\n    pass`,
      javascript: `function invertTree(root) {\n  \n}`,
    },
    hints: [
      "Swap left and right children of every node.",
      "Recurse on both subtrees after swapping.",
      "Base case: null node returns null.",
    ],
  },

  // ── Graphs ──────────────────────────────────────────────────────────
  {
    title: "Number of Islands",
    slug: "number-of-islands",
    description: `Given an m x n 2D binary grid \`grid\` which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

**Example 1:**
\`\`\`
Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1
\`\`\`

**Example 2:**
\`\`\`
Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3
\`\`\``,
    difficulty: "medium",
    tags: ["graphs", "bfs", "dfs"],
    testCases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expected: "1", isHidden: false },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expected: "3", isHidden: false },
      { input: '[["0"]]', expected: "0", isHidden: true },
    ],
    starterCode: {
      python: `def num_islands(grid: list[list[str]]) -> int:\n    pass`,
      javascript: `function numIslands(grid) {\n  \n}`,
    },
    hints: [
      "Iterate through the grid. When you find a '1', increment count and flood-fill.",
      "Use DFS or BFS to mark all connected '1's as visited.",
      "You can mark visited cells by changing '1' to '0' in-place.",
    ],
  },
  {
    title: "Course Schedule",
    slug: "course-schedule",
    description: `There are \`numCourses\` courses labeled from 0 to numCourses-1. You are given an array \`prerequisites\` where \`prerequisites[i] = [a, b]\` means you must take course \`b\` before course \`a\`.

Return \`true\` if you can finish all courses, \`false\` otherwise.

**Example 1:**
\`\`\`
Input: numCourses = 2, prerequisites = [[1,0]]
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
Explanation: Circular dependency.
\`\`\``,
    difficulty: "medium",
    tags: ["graphs", "topological-sort"],
    testCases: [
      { input: "2\n[[1,0]]", expected: "true", isHidden: false },
      { input: "2\n[[1,0],[0,1]]", expected: "false", isHidden: false },
      { input: "1\n[]", expected: "true", isHidden: false },
      { input: "4\n[[1,0],[2,1],[3,2]]", expected: "true", isHidden: true },
    ],
    starterCode: {
      python: `def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:\n    pass`,
      javascript: `function canFinish(numCourses, prerequisites) {\n  \n}`,
    },
    hints: [
      "This is cycle detection in a directed graph.",
      "Build an adjacency list and use DFS with three states: unvisited, visiting, visited.",
      "Alternatively, use Kahn's algorithm (BFS with in-degree tracking).",
    ],
  },

  // ── Dynamic Programming ─────────────────────────────────────────────
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?

**Example 1:**
\`\`\`
Input: n = 2
Output: 2
Explanation: 1+1 or 2.
\`\`\`

**Example 2:**
\`\`\`
Input: n = 3
Output: 3
Explanation: 1+1+1, 1+2, or 2+1.
\`\`\``,
    difficulty: "easy",
    tags: ["dp"],
    testCases: [
      { input: "2", expected: "2", isHidden: false },
      { input: "3", expected: "3", isHidden: false },
      { input: "5", expected: "8", isHidden: false },
      { input: "10", expected: "89", isHidden: true },
    ],
    starterCode: {
      python: `def climb_stairs(n: int) -> int:\n    pass`,
      javascript: `function climbStairs(n) {\n  \n}`,
    },
    hints: [
      "This is the Fibonacci sequence.",
      "dp[i] = dp[i-1] + dp[i-2].",
      "You only need the last two values, so O(1) space is possible.",
    ],
  },
  {
    title: "Coin Change",
    slug: "coin-change",
    description: `Given an array of coin denominations \`coins\` and a total \`amount\`, return the fewest number of coins needed to make up that amount. If it's not possible, return -1.

**Example 1:**
\`\`\`
Input: coins = [1,5,10,25], amount = 30
Output: 2
Explanation: 25 + 5 = 30
\`\`\`

**Example 2:**
\`\`\`
Input: coins = [2], amount = 3
Output: -1
\`\`\``,
    difficulty: "medium",
    tags: ["dp"],
    testCases: [
      { input: "[1,5,10,25]\n30", expected: "2", isHidden: false },
      { input: "[2]\n3", expected: "-1", isHidden: false },
      { input: "[1]\n0", expected: "0", isHidden: false },
      { input: "[1,2,5]\n11", expected: "3", isHidden: true },
    ],
    starterCode: {
      python: `def coin_change(coins: list[int], amount: int) -> int:\n    pass`,
      javascript: `function coinChange(coins, amount) {\n  \n}`,
    },
    hints: [
      "Use bottom-up DP. dp[i] = min coins to make amount i.",
      "For each amount, try every coin and take the minimum.",
      "Initialize dp[0] = 0, everything else = infinity.",
    ],
  },
  {
    title: "Longest Increasing Subsequence",
    slug: "longest-increasing-subsequence",
    description: `Given an integer array \`nums\`, return the length of the longest strictly increasing subsequence.

**Example 1:**
\`\`\`
Input: nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: [2,3,7,101]
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [0,1,0,3,2,3]
Output: 4
\`\`\`

**Follow-up:** Can you solve it in O(n log n)?`,
    difficulty: "medium",
    tags: ["dp", "binary-search"],
    testCases: [
      { input: "[10,9,2,5,3,7,101,18]", expected: "4", isHidden: false },
      { input: "[0,1,0,3,2,3]", expected: "4", isHidden: false },
      { input: "[7,7,7,7]", expected: "1", isHidden: false },
      { input: "[1,3,6,7,9,4,10,5,6]", expected: "6", isHidden: true },
    ],
    starterCode: {
      python: `def length_of_lis(nums: list[int]) -> int:\n    pass`,
      javascript: `function lengthOfLIS(nums) {\n  \n}`,
    },
    hints: [
      "O(n^2) DP: dp[i] = length of LIS ending at index i.",
      "For each i, check all j < i where nums[j] < nums[i].",
      "O(n log n): maintain a tails array and use binary search.",
    ],
  },

  // ── Design ──────────────────────────────────────────────────────────
  {
    title: "LRU Cache",
    slug: "lru-cache",
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the \`LRUCache\` class:
- \`LRUCache(capacity)\`: Initialize with positive size capacity.
- \`get(key)\`: Return the value if the key exists, otherwise return -1.
- \`put(key, value)\`: Update or insert. When the cache reaches capacity, evict the least recently used key.

Both operations must run in O(1) average time.

**Example:**
\`\`\`
LRUCache cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);       // returns 1
cache.put(3, 3);    // evicts key 2
cache.get(2);       // returns -1
cache.put(4, 4);    // evicts key 1
cache.get(1);       // returns -1
cache.get(3);       // returns 3
cache.get(4);       // returns 4
\`\`\``,
    difficulty: "medium",
    tags: ["design", "hash-map", "linked-list"],
    testCases: [
      { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', expected: "[null,null,null,1,null,-1,null,-1,3,4]", isHidden: false },
    ],
    starterCode: {
      python: `class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass`,
      javascript: `class LRUCache {\n  constructor(capacity) {\n    \n  }\n\n  get(key) {\n    \n  }\n\n  put(key, value) {\n    \n  }\n}`,
    },
    hints: [
      "Combine a hash map with a doubly linked list.",
      "Hash map gives O(1) lookup. Linked list gives O(1) insertion/removal for ordering.",
      "On access, move the node to the front. On eviction, remove from the tail.",
    ],
  },
  {
    title: "Min Stack",
    slug: "min-stack",
    description: `Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

Implement the \`MinStack\` class:
- \`push(val)\`: Push element val onto the stack.
- \`pop()\`: Remove the element on the top of the stack.
- \`top()\`: Get the top element of the stack.
- \`getMin()\`: Retrieve the minimum element in the stack.

All operations must be O(1).

**Example:**
\`\`\`
MinStack minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
minStack.getMin(); // returns -3
minStack.pop();
minStack.top();    // returns 0
minStack.getMin(); // returns -2
\`\`\``,
    difficulty: "medium",
    tags: ["design", "stack"],
    testCases: [
      { input: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]', expected: "[null,null,null,null,-3,null,0,-2]", isHidden: false },
    ],
    starterCode: {
      python: `class MinStack:\n    def __init__(self):\n        pass\n\n    def push(self, val: int) -> None:\n        pass\n\n    def pop(self) -> None:\n        pass\n\n    def top(self) -> int:\n        pass\n\n    def get_min(self) -> int:\n        pass`,
      javascript: `class MinStack {\n  constructor() {\n    \n  }\n\n  push(val) {\n    \n  }\n\n  pop() {\n    \n  }\n\n  top() {\n    \n  }\n\n  getMin() {\n    \n  }\n}`,
    },
    hints: [
      "Use two stacks: one for values, one for tracking minimums.",
      "The min stack stores the minimum at each level of the main stack.",
      "When popping, pop from both stacks.",
    ],
  },
  // ── Hard / Project-Style ─────────────────────────────────────────
  {
    title: "Build a Snake Game",
    slug: "snake-game",
    description: `Implement a simplified Snake game engine.

The game is played on a grid of size \`width x height\`. The snake starts at position \`(0, 0)\` heading right, with a length of 1. Food appears at given positions in sequence.

Implement the \`SnakeGame\` class:
- \`SnakeGame(width, height, food)\`: Initialize with grid dimensions and a list of food positions \`[[row, col], ...]\`.
- \`move(direction) -> int\`: Move the snake in the given direction (\`"U"\`, \`"D"\`, \`"L"\`, \`"R"\`). Return the current score (number of food eaten). Return \`-1\` if the game is over (snake hits wall or itself).

**Rules:**
- When the snake eats food, it grows by 1 and the next food appears.
- The snake moves by adding a new head and removing the tail (unless it just ate).
- The snake cannot reverse direction.

**Example:**
\`\`\`
game = SnakeGame(3, 2, [[1,2],[0,1]])
game.move("R") -> 0   # (0,1)
game.move("D") -> 0   # (1,1)
game.move("R") -> 1   # (1,2) ate food
game.move("U") -> 1   # (0,2)
game.move("L") -> 2   # (0,1) ate food
game.move("U") -> -1  # hit wall
\`\`\``,
    difficulty: "hard",
    tags: ["design", "arrays", "simulation"],
    testCases: [
      {
        input: '["SnakeGame","move","move","move","move","move","move"]\n[[3,2,[[1,2],[0,1]]],["R"],["D"],["R"],["U"],["L"],["U"]]',
        expected: "[null,0,0,1,1,2,-1]",
        isHidden: false,
      },
    ],
    starterCode: {
      python: `class SnakeGame:\n    def __init__(self, width: int, height: int, food: list[list[int]]):\n        pass\n\n    def move(self, direction: str) -> int:\n        pass`,
      javascript: `class SnakeGame {\n  constructor(width, height, food) {\n    \n  }\n\n  move(direction) {\n    \n  }\n}`,
    },
    hints: [
      "Use a deque to represent the snake body. Head is the front, tail is the back.",
      "Use a set of occupied positions for O(1) collision detection.",
      "When moving: compute new head, check wall/self collision, check food, then update body.",
    ],
  },
  {
    title: "Implement a Text Editor with Undo/Redo",
    slug: "text-editor-undo-redo",
    description: `Design a simple text editor that supports the following operations:

- \`insert(text)\`: Insert text at the current cursor position.
- \`delete(k)\`: Delete the last \`k\` characters before the cursor.
- \`moveCursor(position)\`: Move cursor to a specific position (0-indexed).
- \`undo()\`: Undo the last insert or delete operation.
- \`redo()\`: Redo the last undone operation.
- \`getText()\`: Return the current full text.

**Example:**
\`\`\`
editor = TextEditor()
editor.insert("hello")        # "hello", cursor at 5
editor.insert(" world")       # "hello world", cursor at 11
editor.delete(6)              # "hello", cursor at 5
editor.undo()                 # "hello world", cursor at 11
editor.undo()                 # "hello", cursor at 5
editor.redo()                 # "hello world", cursor at 11
editor.getText()              # "hello world"
\`\`\`

**Constraints:**
- All operations should be efficient.
- Undo/redo should handle any sequence of operations.
- Performing a new insert/delete after undo clears the redo stack.`,
    difficulty: "hard",
    tags: ["design", "stack", "strings"],
    testCases: [
      {
        input: '["TextEditor","insert","insert","delete","undo","undo","redo","getText"]\n[[],["hello"],[" world"],[6],[],[],[],[]]',
        expected: '[null,null,null,null,null,null,null,"hello world"]',
        isHidden: false,
      },
    ],
    starterCode: {
      python: `class TextEditor:\n    def __init__(self):\n        pass\n\n    def insert(self, text: str) -> None:\n        pass\n\n    def delete(self, k: int) -> None:\n        pass\n\n    def move_cursor(self, position: int) -> None:\n        pass\n\n    def undo(self) -> None:\n        pass\n\n    def redo(self) -> None:\n        pass\n\n    def get_text(self) -> str:\n        pass`,
      javascript: `class TextEditor {\n  constructor() {\n    \n  }\n\n  insert(text) {\n    \n  }\n\n  delete(k) {\n    \n  }\n\n  moveCursor(position) {\n    \n  }\n\n  undo() {\n    \n  }\n\n  redo() {\n    \n  }\n\n  getText() {\n    \n  }\n}`,
    },
    hints: [
      "Use the Command pattern: store each operation as an object with execute/undo methods.",
      "Maintain an undo stack and a redo stack.",
      "On new operation: push to undo stack, clear redo stack.",
    ],
  },
  {
    title: "Build a Task Scheduler",
    slug: "task-scheduler",
    description: `Given a list of tasks represented by characters and a cooldown period \`n\`, return the minimum number of intervals the CPU needs to finish all tasks.

Each interval is 1 unit. The same task must wait at least \`n\` intervals before it can run again. The CPU can be idle during cooldown.

**Example 1:**
\`\`\`
Input: tasks = ["A","A","A","B","B","B"], n = 2
Output: 8
Explanation: A -> B -> idle -> A -> B -> idle -> A -> B
\`\`\`

**Example 2:**
\`\`\`
Input: tasks = ["A","A","A","B","B","B"], n = 0
Output: 6
Explanation: No cooldown needed.
\`\`\`

**Example 3:**
\`\`\`
Input: tasks = ["A","A","A","A","A","A","B","C","D","E","F","G"], n = 2
Output: 16
\`\`\`

**Constraints:**
- 1 <= tasks.length <= 10^4
- 0 <= n <= 100`,
    difficulty: "medium",
    tags: ["arrays", "heap", "greedy"],
    testCases: [
      { input: '["A","A","A","B","B","B"]\n2', expected: "8", isHidden: false },
      { input: '["A","A","A","B","B","B"]\n0', expected: "6", isHidden: false },
      { input: '["A","A","A","A","A","A","B","C","D","E","F","G"]\n2', expected: "16", isHidden: false },
      { input: '["A"]\n2', expected: "1", isHidden: true },
    ],
    starterCode: {
      python: `def least_interval(tasks: list[str], n: int) -> int:\n    pass`,
      javascript: `function leastInterval(tasks, n) {\n  \n}`,
    },
    hints: [
      "Count the frequency of each task. The most frequent task dominates the schedule.",
      "Formula approach: (maxFreq - 1) * (n + 1) + countOfMaxFreqTasks.",
      "Take the max of the formula result and the total number of tasks.",
    ],
  },
  {
    title: "Design a Rate Limiter",
    slug: "rate-limiter",
    description: `Design a rate limiter that allows at most \`maxRequests\` requests per \`windowSize\` seconds for each unique client.

Implement the \`RateLimiter\` class:
- \`RateLimiter(maxRequests, windowSize)\`: Initialize with the max requests allowed and the time window in seconds.
- \`allowRequest(clientId, timestamp) -> bool\`: Return \`true\` if the request is allowed, \`false\` if rate limited.

**Example:**
\`\`\`
limiter = RateLimiter(3, 10)  # 3 requests per 10 seconds
limiter.allowRequest("user1", 1)   # true
limiter.allowRequest("user1", 2)   # true
limiter.allowRequest("user1", 3)   # true
limiter.allowRequest("user1", 4)   # false (3 requests in window)
limiter.allowRequest("user2", 4)   # true (different client)
limiter.allowRequest("user1", 12)  # true (request at t=1 expired)
\`\`\`

**Constraints:**
- Timestamps are given in non-decreasing order.
- Design for efficient memory usage with many clients.`,
    difficulty: "hard",
    tags: ["design", "hash-map", "sliding-window"],
    testCases: [
      {
        input: '["RateLimiter","allowRequest","allowRequest","allowRequest","allowRequest","allowRequest","allowRequest"]\n[[3,10],["user1",1],["user1",2],["user1",3],["user1",4],["user2",4],["user1",12]]',
        expected: "[null,true,true,true,false,true,true]",
        isHidden: false,
      },
    ],
    starterCode: {
      python: `class RateLimiter:\n    def __init__(self, max_requests: int, window_size: int):\n        pass\n\n    def allow_request(self, client_id: str, timestamp: int) -> bool:\n        pass`,
      javascript: `class RateLimiter {\n  constructor(maxRequests, windowSize) {\n    \n  }\n\n  allowRequest(clientId, timestamp) {\n    \n  }\n}`,
    },
    hints: [
      "Use a sliding window log: store timestamps of requests per client.",
      "For each request, remove timestamps outside the window, then check count.",
      "A deque per client gives efficient removal of expired timestamps.",
    ],
  },
  {
    title: "Serialize and Deserialize Binary Tree",
    slug: "serialize-deserialize-tree",
    description: `Design an algorithm to serialize and deserialize a binary tree.

Serialization is converting a tree to a string. Deserialization is reconstructing the tree from the string.

Implement:
- \`serialize(root) -> str\`: Encode a tree to a single string.
- \`deserialize(data) -> TreeNode\`: Decode your string back to a tree.

**Example:**
\`\`\`
Input: root = [1,2,3,null,null,4,5]
serialize(root) -> "1,2,null,null,3,4,null,null,5,null,null"
deserialize("1,2,null,null,3,4,null,null,5,null,null") -> [1,2,3,null,null,4,5]
\`\`\`

**Constraints:**
- The number of nodes is in the range [0, 10^4].
- -1000 <= Node.val <= 1000`,
    difficulty: "hard",
    tags: ["trees", "recursion", "design"],
    testCases: [
      { input: "[1,2,3,null,null,4,5]", expected: "[1,2,3,null,null,4,5]", isHidden: false },
      { input: "[]", expected: "[]", isHidden: false },
      { input: "[1]", expected: "[1]", isHidden: true },
    ],
    starterCode: {
      python: `class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef serialize(root) -> str:\n    pass\n\ndef deserialize(data) -> TreeNode:\n    pass`,
      javascript: `function serialize(root) {\n  \n}\n\nfunction deserialize(data) {\n  \n}`,
    },
    hints: [
      "Use preorder traversal for serialization, marking null nodes explicitly.",
      "Split the serialized string by delimiter and use a queue/iterator to rebuild.",
      "BFS (level-order) also works — serialize level by level, skip nulls at the end.",
    ],
  },
  {
    title: "Implement a Key-Value Store with Expiry",
    slug: "kv-store-expiry",
    description: `Design an in-memory key-value store that supports setting keys with optional expiration times.

Implement the \`KVStore\` class:
- \`set(key, value, ttl=None)\`: Set a key to a value. If \`ttl\` (time-to-live in seconds) is provided, the key expires after \`ttl\` seconds from the current timestamp.
- \`get(key, timestamp) -> value | None\`: Return the value if the key exists and hasn't expired at the given timestamp. Return \`None\` otherwise.
- \`delete(key)\`: Remove a key.
- \`cleanup(timestamp)\`: Remove all expired keys as of the given timestamp.

**Example:**
\`\`\`
store = KVStore()
store.set("a", "hello", ttl=10, timestamp=1)
store.get("a", 5)      # "hello"
store.get("a", 12)     # None (expired)
store.set("b", "world", timestamp=1)
store.get("b", 100)    # "world" (no expiry)
store.delete("b")
store.get("b", 100)    # None
\`\`\``,
    difficulty: "hard",
    tags: ["design", "hash-map"],
    testCases: [
      {
        input: '["KVStore","set","get","get","set","get","delete","get"]\n[[],["a","hello",10,1],["a",5],["a",12],["b","world",null,1],["b",100],["b"],["b",100]]',
        expected: '[null,null,"hello",null,null,"world",null,null]',
        isHidden: false,
      },
    ],
    starterCode: {
      python: `class KVStore:\n    def __init__(self):\n        pass\n\n    def set(self, key: str, value, ttl=None, timestamp=0) -> None:\n        pass\n\n    def get(self, key: str, timestamp=0):\n        pass\n\n    def delete(self, key: str) -> None:\n        pass\n\n    def cleanup(self, timestamp=0) -> None:\n        pass`,
      javascript: `class KVStore {\n  constructor() {\n    \n  }\n\n  set(key, value, ttl = null, timestamp = 0) {\n    \n  }\n\n  get(key, timestamp = 0) {\n    \n  }\n\n  delete(key) {\n    \n  }\n\n  cleanup(timestamp = 0) {\n    \n  }\n}`,
    },
    hints: [
      "Store each entry as { value, expiresAt } where expiresAt = timestamp + ttl (or Infinity if no TTL).",
      "On get, check if the current timestamp exceeds expiresAt.",
      "For cleanup, iterate and remove expired entries, or use a sorted structure for efficient batch removal.",
    ],
  },
  {
    title: "Build a Pong Game Engine",
    slug: "pong-game",
    description: `Implement the game logic for a simplified Pong game.

The game is played on a \`width x height\` field. There are two paddles (left at x=0, right at x=width-1) and a ball.

Implement the \`PongGame\` class:
- \`PongGame(width, height, paddleSize)\`: Initialize the field. Both paddles start centered vertically. The ball starts at the center moving toward the right paddle at a 45-degree angle.
- \`movePaddle(player, direction) -> None\`: Move paddle for \`player\` (1=left, 2=right) in \`direction\` ("U" or "D") by 1 unit. Paddles cannot move off the field.
- \`tick() -> dict\`: Advance the game by one step. The ball moves 1 unit in both x and y per tick. Return a status dict:
  - \`{"status": "playing", "ball": [x, y], "score": [p1, p2]}\` if the game continues
  - \`{"status": "score", "scorer": 1 or 2, ...}\` if a player scores (ball passes a paddle)

**Ball physics:**
- The ball bounces off the top and bottom walls (y direction reverses).
- The ball bounces off a paddle if the paddle covers the ball's y position (x direction reverses).
- If the ball reaches x=0 or x=width-1 and the paddle does NOT cover it, the opposing player scores.

**Example:**
\`\`\`
game = PongGame(20, 10, 3)  # 20x10 field, paddles are 3 units tall
game.tick()                  # ball moves, returns status
game.movePaddle(2, "U")      # right player moves paddle up
game.tick()                  # ball continues
# ... eventually a player scores
\`\`\`

**Constraints:**
- Paddle positions are the TOP of the paddle (extends downward by paddleSize).
- Ball starts at (width//2, height//2) moving with velocity (1, 1).`,
    difficulty: "hard",
    tags: ["design", "simulation", "arrays"],
    testCases: [
      {
        input: '["PongGame","tick","tick","tick","movePaddle","tick"]\n[[10,6,2],[],[],[],[2,"U"],[]]',
        expected: '[null,{"status":"playing","ball":[6,4],"score":[0,0]},{"status":"playing","ball":[7,5],"score":[0,0]},{"status":"playing","ball":[8,4],"score":[0,0]},null,{"status":"playing","ball":[7,3],"score":[0,0]}]',
        isHidden: false,
      },
    ],
    starterCode: {
      python: `class PongGame:\n    def __init__(self, width: int, height: int, paddle_size: int):\n        pass\n\n    def move_paddle(self, player: int, direction: str) -> None:\n        pass\n\n    def tick(self) -> dict:\n        pass`,
      javascript: `class PongGame {\n  constructor(width, height, paddleSize) {\n    \n  }\n\n  movePaddle(player, direction) {\n    \n  }\n\n  tick() {\n    \n  }\n}`,
    },
    hints: [
      "Track ball position (x, y) and velocity (dx, dy). Each tick: x += dx, y += dy.",
      "Wall bounce: if y <= 0 or y >= height-1, reverse dy. Paddle bounce: if x reaches 0 or width-1 and paddle covers y, reverse dx.",
      "Paddle is an array or range [topY, topY + paddleSize). Check if ball.y falls within that range on collision.",
    ],
  },
];

async function main() {
  console.log(`Seeding ${problems.length} coding problems...`);

  for (const p of problems) {
    await prisma.codingProblem.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        tags: p.tags,
        testCases: p.testCases,
        starterCode: p.starterCode,
        hints: p.hints,
      },
      create: p,
    });
    console.log(`  ✓ ${p.title}`);
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
