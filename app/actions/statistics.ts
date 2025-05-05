'use server'

type StatisticsResponse = {
  totalSubmissions: number;
  demographics: {
    bySex: Record<string, number>;
    byMaritalState: Record<string, number>;
    byService: Record<string, number>;
    sexByMaritalState: Record<string, Record<string, number>>;
    sexByService: Record<string, Record<string, number>>;
    maritalStateByService: Record<string, Record<string, number>>;
  };
  questions: Array<{
    questionId: string;
    questionText: string;
    responseBySex: Record<string, Record<string, number>>;
    responseByMaritalState: Record<string, Record<string, number>>;
    responseByService: Record<string, Record<string, number>>;
  }>;
};

export async function fetchStatistics(accessToken: string): Promise<StatisticsResponse> {
  try {
    const res = await fetch('https://medical-backend-gamma2.vercel.app/api/submissions/detailed-stats', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
} 