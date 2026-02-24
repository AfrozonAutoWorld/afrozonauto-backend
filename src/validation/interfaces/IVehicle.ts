export interface AutoDevResponse<T> {
    data?: T;
    error?: {
      message: string;
      code: string;
    };
  }