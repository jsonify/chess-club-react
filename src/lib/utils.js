// src/lib/utils.js

/**
 * Format a date string to MM/dd/yyyy for display
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
}

/**
 * Get the next Wednesday's date
 */
export function getNextWednesday() {
  const today = new Date();
  const day = today.getDay();
  const daysUntilWednesday = (3 + 7 - day) % 7;
  
  const nextWednesday = new Date();
  nextWednesday.setDate(today.getDate() + daysUntilWednesday);
  nextWednesday.setHours(0, 0, 0, 0); // Reset time part to midnight
  
  return nextWednesday;
}

/**
 * Check if date is a Wednesday
 */
export function isWednesday(date) {
  return new Date(date).getDay() === 3;
}

/**
 * Format a date to YYYY-MM-DD for Supabase queries
 */
export function formatDateForDB(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format time to 12-hour format (e.g., 3:30 PM)
 */
export function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/**
 * Take an array and split it into chunks of specified size
 */
export function chunk(array, size) {
  return array.reduce((chunks, item, i) => {
    if (i % size === 0) {
      chunks.push([item]);
    } else {
      chunks[chunks.length - 1].push(item);
    }
    return chunks;
  }, []);
}

/**
 * Calculate student's age based on grade
 * Assuming most 2nd graders are 7-8, etc.
 */
export function getAgeFromGrade(grade) {
  const baseAge = 7; // Age of typical 2nd grader
  const gradeNum = parseInt(grade);
  return baseAge + (gradeNum - 2);
}

/**
 * Sort students by grade and then by name
 */
export function sortStudents(students) {
  return [...students].sort((a, b) => {
    if (a.grade !== b.grade) {
      return parseInt(a.grade) - parseInt(b.grade);
    }
    return a.last_name.localeCompare(b.last_name);
  });
}
