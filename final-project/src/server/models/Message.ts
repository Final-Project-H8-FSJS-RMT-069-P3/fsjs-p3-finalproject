import { ObjectId } from "mongodb";
import { IUser } from "./User";



export interface IRoom {
    _id: ObjectId;
    roomName: string;
    userId: ObjectId;
    user?: IUser;
    staffId: ObjectId;
    staff?: IUser;
}

export interface IMessage {
    _id: ObjectId;
    roomId: ObjectId;
    room?: IRoom;
    senderId: ObjectId;
    sender?: IUser;
    text: string;
    createdAt: Date;
}