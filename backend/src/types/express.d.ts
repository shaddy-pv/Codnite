// Extend Express Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        userId: string;
      };
    }
  }
}

export {};
