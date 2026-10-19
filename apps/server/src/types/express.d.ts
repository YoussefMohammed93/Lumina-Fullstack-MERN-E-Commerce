import type { IUser } from "../models/user.model.js";
declare global { namespace Express { interface Request { user?: IUser & { _id: import("mongoose").Types.ObjectId }; sessionId?: string; csrfToken?: string; } } }
export {};
