import { ObjectId } from "mongodb";
import User, { IUser } from "./User";
import { getDB } from "../config/mongodb";
import { NotFoundError } from "../helpers/CustomError";



export interface IFormBrief {
    _id: ObjectId;
    userId: ObjectId;
    user?: IUser;
    brief: string;
    result: string;
    createdAt: Date;
}


export default class FormBrief {
    static async getCollection() {
        const db = await getDB();
        const collection = db.collection<IFormBrief>("formBriefs");
        return collection;
    }

    static async create(formBrief: IFormBrief): Promise<string> {
        const collection = await this.getCollection();
        await collection.insertOne(formBrief);
        return "Form brief created successfully";
    }

    static async getFormBriefByUserId(userId: string): Promise<IFormBrief[]> {
        const collection = await this.getCollection();
        const user = await User.getUserById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }
        // const formBriefs = await collection.find({ userId: user._id }).toArray();
        // return formBriefs;
        const formBriefs = await collection.aggregate([
            { $match: { userId: user._id } },
            { $lookup: {
                from: "Users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" }
        ]).toArray() as IFormBrief[];
        return formBriefs;

    }
}