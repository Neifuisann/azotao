// Real API service for authentication
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

// Generic fetch helper with error handling
async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // For non-JSON responses or empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true } as T;
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data as T;
  } catch (error) {
    console.error(`API error for ${url}:`, error);
    throw error;
  }
}

export const api = {
  login: async (email: string, password: string): Promise<{ success: boolean; data?: AuthUser; error?: string }> => {
    try {
      const data = await fetchAPI<{ success: boolean; data: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      return { 
        success: true, 
        data: data.data
      };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred during login' 
      };
    }
  },
  
  signup: async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Sending signup request for:', email);
      await fetchAPI<{ success: boolean }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred during signup' 
      };
    }
  },
  
  getUser: async (id: string): Promise<{ success: boolean; data?: AuthUser; error?: string }> => {
    try {
      const data = await fetchAPI<{ success: boolean; data: AuthUser }>(`/api/auth/user?id=${id}`);
      
      return { 
        success: true, 
        data: data.data
      };
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred fetching user' 
      };
    }
  },
  
  // Health check to verify API connectivity
  healthCheck: async (): Promise<boolean> => {
    try {
      await fetchAPI<{ status: string }>('/api/health');
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}; 