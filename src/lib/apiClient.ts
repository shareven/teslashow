// API客户端工具，自动添加认证token

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('teslashow_token');
    }
    return null;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request(url: string, options: ApiClientOptions = {}): Promise<Response> {
    const { method = 'GET', headers = {}, body } = options;

    const config: RequestInit = {
      method,
      headers: {
        ...this.getAuthHeaders(),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    // 如果返回401或403，说明认证失败，清除本地token并跳转到登录页
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('teslashow_token');
        // 避免在登录页面重复重定向
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return response;
  }

  async get(url: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(url, { method: 'GET', headers });
  }

  async post(url: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(url, { method: 'POST', body, headers });
  }

  async put(url: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.request(url, { method: 'PUT', body, headers });
  }

  async delete(url: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(url, { method: 'DELETE', headers });
  }
}

// 导出单例实例
export const apiClient = new ApiClient();

// 导出默认实例
export default apiClient;