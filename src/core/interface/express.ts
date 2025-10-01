import type { Request, Response} from 'express'

export interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

export interface ResponseWithUser extends Response {
  user: {
    id: string;
  };
}