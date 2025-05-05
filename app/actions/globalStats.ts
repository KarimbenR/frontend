'use server'

export async function fetchGlobalStats(accessToken: string) {
  try {
    const res = await fetch('https://medical-backend-gamma2.vercel.app/api/global', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch global statistics data: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching global statistics data:', error);
    throw error;
  }
} 