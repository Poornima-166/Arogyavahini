export function calculateDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (
    lat1 === undefined || lat1 === null || isNaN(lat1) ||
    lon1 === undefined || lon1 === null || isNaN(lon1) ||
    lat2 === undefined || lat2 === null || isNaN(lat2) ||
    lon2 === undefined || lon2 === null || isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10;
}

export function determinePriority(emergencyType: string = '', notes: string = ''): 'CRITICAL' | 'HIGH' | 'NORMAL' {
  const text = `${emergencyType} ${notes}`.toLowerCase();
  if (
    text.includes('cardiac') ||
    text.includes('heart') ||
    text.includes('stroke') ||
    text.includes('severe') ||
    text.includes('unconscious') ||
    text.includes('bleeding') ||
    text.includes('trauma') ||
    text.includes('accident') ||
    text.includes('code red')
  ) {
    return 'CRITICAL';
  }
  if (
    text.includes('respiratory') ||
    text.includes('breathing') ||
    text.includes('fracture') ||
    text.includes('fall') ||
    text.includes('burn') ||
    text.includes('maternity') ||
    text.includes('labor') ||
    text.includes('code yellow')
  ) {
    return 'HIGH';
  }
  return 'NORMAL';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTimeAgo(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'Recently';
  }
}
