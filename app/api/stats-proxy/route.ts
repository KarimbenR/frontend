import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Authentication token is required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://medical-backend-gamma2.vercel.app/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the API' },
      { status: 500 }
    );
  }
} 