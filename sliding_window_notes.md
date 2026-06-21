# Sliding Window Tutorial for Beginners

## What is Sliding Window?

Imagine you have a line of toys on the floor. You want to look at only 3 toys at a time.
You make a window (like a picture frame) that shows exactly 3 toys.
Then you slide this window one toy to the right.
Now you see the next 3 toys.
You keep sliding until you reach the end.

In programming, we have an array (like a line of numbers).
We create a "window" that covers a certain number of elements (like 3 elements).
We slide this window from left to right, one step at a time.

## Why was Sliding Window Invented?

Sometimes we need to check every possible group of consecutive elements in an array.
For example:
- Find the maximum sum of any 3 consecutive numbers
- Find the longest substring without repeating characters

If we use a normal loop and check every possible group one by one, it becomes very slow.
This is called the "Brute Force" approach.

## Why Normal Loops Become Slow (Brute Force Problem)

Let's say we have an array of 1000 numbers and we want to check every group of 5 consecutive numbers.

With brute force:
- We start at index 0: check elements 0,1,2,3,4
- Then index 1: check elements 1,2,3,4,5
- Then index 2: check elements 2,3,4,5,6
- And so on...

For each starting index, we look at 5 elements.
So for 1000 elements, we do about 1000 * 5 = 5000 operations.

If the group size was 100, we'd do 1000 * 100 = 100,000 operations.
As the array gets bigger and the group size gets bigger, this becomes very slow.

## The Optimization Idea

Notice that when we move from one group to the next, we lose one element on the left and gain one element on the right.

Example: Array [1,2,3,4,5,6], group size 3
- First group: [1,2,3] (sum = 6)
- Second group: [2,3,4] (sum = 9)
  - We lost the 1 (leftmost) and gained the 4 (rightmost)
  - Instead of adding 2+3+4 again, we can do: 6 - 1 + 4 = 9

This is the key idea of sliding window: we reuse the previous calculation by removing the left element and adding the right element.

Now let's learn the patterns.

## Pattern 1: Fixed Size Window

When the problem asks for something about a fixed number of consecutive elements.

Examples:
- Maximum Sum Subarray of Size K
- Average of Subarray Size K

How to identify:
- The problem mentions a specific number K (like "size 3", "K consecutive")
- We need to find something (max, min, average, etc.) for all subarrays of size K

When to use:
- When you need to check all contiguous subarrays of a fixed length
- When the window size is given and doesn't change

When NOT to use:
- When the window size can change (like finding longest substring without repeating characters)

Let's do an example together.

Suppose we have array [2, 1, 5, 1, 3, 2] and K=3.
We want to find the maximum sum of any 3 consecutive elements.

What would be the brute force approach?
Wait for your answer...