'use server'

export async function fetchCustomStats(accessToken: string) {
  try {
    const res = await fetch('https://medical-backend-gamma2.vercel.app/api/global-custom', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch custom statistics data: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching custom statistics data:', error);
    throw error;
  }
} 