import { Habit } from '../types';
import { getTodayDateString, addDays, getDatesInRange } from './dateHelpers';

export function getMockHabits(): Habit[] {
  const today = getTodayDateString();
  const startDate = addDays(today, -29); // 30 days including today
  const allDates = getDatesInRange(startDate, today);

  // 1. Morning Meditation: A highly consistent habit (~83% completion rate)
  const meditationHistory: Record<string, boolean> = {};
  allDates.forEach((date, index) => {
    // Highly consistent but missed occasionally (e.g. weekends, index % 7 === 0 or index % 11 === 0)
    const dayOfWeek = new Date(date + "T00:00:00").getDay();
    const missed = (dayOfWeek === 0 && index > 15) || (index % 12 === 0);
    meditationHistory[date] = !missed;
  });

  // 2. LeetCode Practice: A highly volatile habit (~46% completion rate, changes back and forth frequently)
  const leetCodeHistory: Record<string, boolean> = {};
  allDates.forEach((date, index) => {
    // Explicitly toggle back and forth every 1 or 2 days to make it the "Most Volatile"
    // e.g., patterns like T, F, T, T, F, F, T, F...
    let completed = false;
    if (index % 3 === 0) {
      completed = true;
    } else if (index % 3 === 1) {
      completed = index % 2 === 0;
    } else {
      completed = false;
    }
    leetCodeHistory[date] = completed;
  });

  // 3. Gym Workout: Consistent streaks then a long slump and a recovery (~60% completion rate)
  const gymHistory: Record<string, boolean> = {};
  allDates.forEach((date, index) => {
    // Days 0-10: Streak of completions
    // Days 11-18: Slump (injury or lazy) - all missed
    // Days 19-29: Regular rhythm (Mon, Wed, Fri, Sat)
    const dayOfWeek = new Date(date + "T00:00:00").getDay(); // 0 is Sunday, 1 is Monday, etc.
    if (index <= 10) {
      gymHistory[date] = index % 4 !== 0; // mostly completed
    } else if (index > 10 && index <= 18) {
      gymHistory[date] = false; // slump
    } else {
      // Mon (1), Wed (3), Fri (5), Sat (6)
      gymHistory[date] = [1, 3, 5, 6].includes(dayOfWeek);
    }
  });

  // 4. Read 10 Pages: Decent completion (~70% completion rate) with a 6-day streak
  const readingHistory: Record<string, boolean> = {};
  allDates.forEach((date, index) => {
    const dayOfWeek = new Date(date + "T00:00:00").getDay();
    // Misses on Sundays and every other Tuesday
    const isSunday = dayOfWeek === 0;
    const isAlternatingTuesday = dayOfWeek === 2 && Math.floor(index / 7) % 2 === 0;
    readingHistory[date] = !(isSunday || isAlternatingTuesday);
  });

  return [
    {
      id: 'meditation',
      name: '15 Min Zen Meditation',
      category: 'Health',
      frequency: 'Daily',
      createdDate: startDate,
      history: meditationHistory,
    },
    {
      id: 'leetcode',
      name: 'Solve 1 LeetCode Problem',
      category: 'Learning',
      frequency: 'Daily',
      createdDate: startDate,
      history: leetCodeHistory,
    },
    {
      id: 'gym',
      name: 'Gym Strength Workout',
      category: 'Health',
      frequency: 'Daily',
      createdDate: startDate,
      history: gymHistory,
    },
    {
      id: 'reading',
      name: 'Read 10 Pages of Non-Fiction',
      category: 'Learning',
      frequency: 'Daily',
      createdDate: startDate,
      history: readingHistory,
    },
  ];
}
