import { ObjectId } from "mongodb";
import { IUser } from "./User";
import { IFormBrief } from "./FormBrief";



export interface IBooking {
    _id: ObjectId;
    userId: ObjectId;
    user?: IUser;
    staffId: ObjectId;
    staff?: IUser;
    formBriefId: ObjectId;
    formBrief?: IFormBrief;
    date: Date;
    sessionDuration: number;
    isPaid: boolean;
    isDone: boolean;
    videoCallUrl: string;
    amount: number;
}