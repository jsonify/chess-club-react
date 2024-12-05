// src/lib/utils.js

/**
 * Format a date string to MM/dd/yyyy in Pacific Time
 */
export function formatDate(date) {
  if (!date) return '';
  
  try {
    // Ensure we're working with a Date object
    const parsedDate = new Date(date);
    
    // Format in Pacific Time
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }).format(parsedDate);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
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
  const pacificDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  }));
  return pacificDate.getDay() === 3;
}

/**
 * Convert a date to Pacific Time and return YYYY-MM-DD format for database
 */
export function formatDateForDB(date) {
  // Create date object in Pacific Time
  const pacificDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  }));
  
  // Get year, month, day in Pacific Time
  const year = pacificDate.getFullYear();
  const month = String(pacificDate.getMonth() + 1).padStart(2, '0');
  const day = String(pacificDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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

// Add function to get current Pacific time date
export function getPacificDate() {
  return new Date(new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  }));
}

// Only return the next valid club date if needed
export function getNextClubDate() {
  const pacificDate = getPacificDate();
  if (isWednesday(pacificDate)) {
    return pacificDate;
  }
  return null; // Don't suggest a future date
}

export function getNextSessionDate() {
  // Create date object in Pacific Time
  const now = new Date(new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  }));
  
  // Get day of week (0 = Sunday, 3 = Wednesday)
  const currentDay = now.getDay();
  
  // Calculate days until next Wednesday
  // If today is Wednesday and before 4:30pm PT, next session is today
  // Otherwise, find next Wednesday
  let daysToAdd;
  if (currentDay === 3) { // Wednesday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour < 16 || (currentHour === 16 && currentMinute < 30)) {
      daysToAdd = 0; // Today is the session
    } else {
      daysToAdd = 7; // Next Wednesday
    }
  } else {
    daysToAdd = (3 - currentDay + 7) % 7; // Days until next Wednesday
  }
  
  // Create next session date
  const nextSession = new Date(now);
  nextSession.setDate(now.getDate() + daysToAdd);
  
  // Set time to 3:30 PM
  nextSession.setHours(15, 30, 0, 0);
  
  return nextSession;
}

// Also update the isWednesday function to be more precise about club hours
export function isDuringClubHours(date) {
  const pacificDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  }));
  
  // Must be Wednesday
  if (pacificDate.getDay() !== 3) return false;
  
  const hour = pacificDate.getHours();
  const minute = pacificDate.getMinutes();
  
  // Club hours: 3:30 PM to 4:30 PM PT
  return (hour === 15 && minute >= 30) || // After 3:30 PM
         (hour === 16 && minute <= 30);   // Before 4:30 PM
}