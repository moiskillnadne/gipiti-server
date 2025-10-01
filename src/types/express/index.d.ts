import type { User } from "../../core/interface/user"

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}
