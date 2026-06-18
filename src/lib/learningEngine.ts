// TOUR IT AI Learning & Improvement Engine
// Handles: User Memory, Crowd Intelligence, Trip History Logs, and Adaptive Prompt Generation

export interface SuggestedTripLog {
  id: string;
  destination: string;
  budget: string;
  duration: number;
  vibes: string[];
  suggestedActivities: string[];
  userRating: number; // Trip-level rating (1-5 stars)
  likedActivities: string[];
  dislikedActivities: string[];
  timestamp: number;
}

export interface UserPreferences {
  preferredBudgetRange: string[];
  preferredVibes: string[];
  similarTravelerVibe: string;
}

// Key-value store for mutated dynamic ratings & reviews
export interface CrowdOverride {
  likesCountOffset: number;
  ratingValueOffset: number;
  reviewsCountOffset: number;
}

// Read saved trips from history
export function getSavedTrips(): SuggestedTripLog[] {
  try {
    const raw = localStorage.getItem('tourit_saved_trips');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading saved trips:', e);
    return [];
  }
}

// Save a trip to history
export function logTripFeedback(trip: Omit<SuggestedTripLog, 'id' | 'timestamp'>): SuggestedTripLog {
  const trips = getSavedTrips();
  const newTrip: SuggestedTripLog = {
    ...trip,
    id: 'trip_' + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
  trips.unshift(newTrip);
  localStorage.setItem('tourit_saved_trips', JSON.stringify(trips));
  
  // Backport liked/disliked activities into overall user memory
  trip.likedActivities.forEach(name => saveActivityLikeState(name, true));
  trip.dislikedActivities.forEach(name => saveActivityLikeState(name, false));

  return newTrip;
}

// Read liked activities
export function getLikedActivities(): string[] {
  try {
    const raw = localStorage.getItem('tourit_liked_activities');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Read disliked activities
export function getDislikedActivities(): string[] {
  try {
    const raw = localStorage.getItem('tourit_disliked_activities');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Save/Toggle Activity Like State
export function saveActivityLikeState(activityName: string, isLike: boolean | null) {
  let liked = getLikedActivities();
  let disliked = getDislikedActivities();

  // Reset first
  liked = liked.filter(name => name !== activityName);
  disliked = disliked.filter(name => name !== activityName);

  if (isLike === true) {
    liked.push(activityName);
    updateCrowdPreference(activityName, 1, 0.1);
  } else if (isLike === false) {
    disliked.push(activityName);
    updateCrowdPreference(activityName, -1, -0.15);
  }

  localStorage.setItem('tourit_liked_activities', JSON.stringify(liked));
  localStorage.setItem('tourit_disliked_activities', JSON.stringify(disliked));

  // Trigger custom event for reactivity across other components
  window.dispatchEvent(new Event('tourit_memory_updated'));
}

// Simulated Live Adaptive Crowd Intelligence Cache
export function getCrowdOverrides(): Record<string, CrowdOverride> {
  try {
    const raw = localStorage.getItem('tourit_crowd_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function updateCrowdPreference(activityName: string, likesDelta: number, ratingDelta: number) {
  const overrides = getCrowdOverrides();
  const current = overrides[activityName] || { likesCountOffset: 0, ratingValueOffset: 0, reviewsCountOffset: 0 };
  
  current.likesCountOffset += likesDelta;
  current.ratingValueOffset = Math.max(-1.5, Math.min(1.5, current.ratingValueOffset + ratingDelta));
  // Increment review counter for live feeling
  current.reviewsCountOffset += 1;

  overrides[activityName] = current;
  localStorage.setItem('tourit_crowd_overrides', JSON.stringify(overrides));
}

// Retrieve adaptive recommendations based on user history context
export function getUserMemoryContext(): string {
  const trips = getSavedTrips();
  const liked = getLikedActivities();
  const disliked = getDislikedActivities();

  if (trips.length === 0 && liked.length === 0 && disliked.length === 0) {
    return '';
  }

  // Count preferences
  const budgets: Record<string, number> = {};
  const vibes: Record<string, number> = {};
  const destinations: string[] = [];

  trips.forEach(t => {
    if (t.budget) budgets[t.budget] = (budgets[t.budget] || 0) + 1;
    t.vibes.forEach(v => {
      vibes[v] = (vibes[v] || 0) + 1;
    });
    if (t.destination && !destinations.includes(t.destination)) {
      destinations.push(t.destination);
    }
  });

  const topBudget = Object.entries(budgets).sort((a,b) => b[1] - a[1])[0]?.[0];
  const topVibes = Object.entries(vibes).sort((a,b) => b[1] - a[1]).slice(0, 3).map(v => v[0]);

  let summary = `\n═══════════════════════════════════════\n🧠 USER MEMORY & PAST TRIP PERSONALIZATION (CRITICAL)\n═══════════════════════════════════════\n`;
  summary += `You MUST personalize recommendations with the following historical user insights:\n`;
  if (topBudget) {
    summary += `- Preferred Budget Bracket: ${topBudget.toUpperCase()} (Prioritize activity costs that match this tier)\n`;
  }
  if (topVibes.length > 0) {
    summary += `- Top Visited Travel Styles/Vibes: ${topVibes.join(', ')}\n`;
  }
  if (destinations.length > 0) {
    summary += `- Frequently Visited Destinations: ${destinations.join(', ')}\n`;
  }
  if (liked.length > 0) {
    summary += `- Highly Rated & Previously Liked Places: ${liked.slice(0, 10).join(', ')} (Incorporate similar vibes, genres, or adjacent locations)\n`;
  }
  if (disliked.length > 0) {
    summary += `- DISLIKED & Rejected Places: ${disliked.slice(0, 10).join(', ')} (Strictly AVOID recommending these or places highly similar to them)\n`;
  }
  
  summary += `Ensure that your travel advice seamlessly shifts and adapts towards these parameters where applicable.\n`;
  return summary;
}
