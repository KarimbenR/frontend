'use server'

type ApiResponse = {
  error?: boolean;
  message?: string;
  data?: any;
};

export async function fetchQuestions(accessToken: string): Promise<ApiResponse> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header only for authenticated users
    if (accessToken !== 'public_access') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch('https://medical-backend-gamma2.vercel.app/api/questions', {
      headers,
      cache: 'force-cache'
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        error: true,
        message: data.message || 'Failed to fetch questions',
      };
    }

    return {
      error: false,
      data
    };
  } catch (error) {
    console.error('Error fetching questions:', error);
    return {
      error: true,
      message: 'Network error while fetching questions'
    };
  }
}

export async function fetchResponses(accessToken: string): Promise<ApiResponse> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header only for authenticated users
    if (accessToken !== 'public_access') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch('https://medical-backend-gamma2.vercel.app/api/responses', {
      headers,
      cache: 'force-cache'
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        error: true,
        message: data.message || 'Failed to fetch responses',
      };
    }

    return {
      error: false,
      data
    };
  } catch (error) {
    console.error('Error fetching responses:', error);
    return {
      error: true,
      message: 'Network error while fetching responses'
    };
  }
}

type SubmissionData = {
  age: number;
  sex: string;
  state: string;
  nbChilds: number;
  expYears: number;
  service: string;
  expYearsC: number;
  answers: Array<{
    questionId: string;
    responseId: string;
  }>;
};

export async function submitQuiz(accessToken: string, data: SubmissionData): Promise<ApiResponse> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header only for authenticated users
    if (accessToken !== 'public_access') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch('https://medical-backend-gamma2.vercel.app/api/submissions', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      return {
        error: true,
        message: responseData.message || 'Failed to submit quiz',
      };
    }

    return {
      error: false,
      data: responseData
    };
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return {
      error: true,
      message: 'Network error while submitting quiz'
    };
  }
} 