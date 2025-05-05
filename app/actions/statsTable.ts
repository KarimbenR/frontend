'use server'

export async function fetchTableStats(accessToken: string) {
  try {
    const res = await fetch('https://medical-backend-gamma2.vercel.app/api/stats', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch statistics table data: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching statistics table data:', error);
    throw error;
  }
} 