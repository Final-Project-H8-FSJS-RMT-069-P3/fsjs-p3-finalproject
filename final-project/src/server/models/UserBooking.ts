import { ObjectId } from "mongodb";
import User, { IUser } from "./User";
import { IFormBrief } from "./FormBrief";
import { getDB } from "../config/mongodb";
import { NotFoundError } from "../helpers/CustomError";



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

export default class UserBooking {
    static async getCollection() {
        const db = await getDB();
        const collection = db.collection<IBooking>("userBookings");
        return collection;
    }

    static async create(booking: IBooking): Promise<string> {
        const collection = await this.getCollection();
        await collection.insertOne(booking);
        return "Booking created successfully";
    }

    static async getBookingsByUserId(userId: string): Promise<IBooking[]> {
        const collection = await this.getCollection();
        const user = await User.getUserById(userId);
        if (!user) {
                    throw new NotFoundError("User not found");
                }
        const bookings = await collection.aggregate([
            { $match: { userId: user._id } },
            { $lookup: {
                from: "users",
                localField: "staffId",
                foreignField: "_id",
                as: "staff"
            }},
            { $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }},
            { $lookup: {
                from: "formBriefs",
                localField: "formBriefId",
                foreignField: "_id",
                as: "formBrief"
            }},
                { $unwind: "$staff" },
                { $unwind: "$user" },
                { $unwind: "$formBrief" }
        ]).toArray() as IBooking[];
        return bookings;
    }

        static async getBookingsByStaffId(staffId: string): Promise<IBooking[]> {
        const collection = await this.getCollection();
        const staff = await User.getUserById(staffId);
        if (!staff) {
                    throw new NotFoundError("Staff not found");
                }
        const bookings = await collection.aggregate([
            { $match: { staffId: staff._id } },
            { $lookup: {
                from: "users",
                localField: "staffId",
                foreignField: "_id",
                as: "staff"
            }},
            { $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }},
            { $lookup: {
                from: "formBriefs",
                localField: "formBriefId",
                foreignField: "_id",
                as: "formBrief"
            }},
                { $unwind: "$staff" },
                { $unwind: "$user" },
                { $unwind: "$formBrief" }
        ]).toArray() as IBooking[];
        return bookings;
    }

    static async updateBookingStatus(bookingId: string, isDone: boolean): Promise<string> {
        const collection = await this.getCollection();
        const result = await collection.updateOne(
            { _id: new ObjectId(bookingId) },
            { $set: { isDone } }
        );
        if (result.modifiedCount === 0) {
            throw new NotFoundError("Booking not found");
        }
        return "Booking status updated successfully";
    }

    static async updateBookingPaymentStatus(bookingId: string, isPaid: boolean): Promise<string> {
        const collection = await this.getCollection();
        const result = await collection.updateOne(
            { _id: new ObjectId(bookingId) },
            { $set: { isPaid } }
        );
        if (result.modifiedCount === 0) {
            throw new NotFoundError("Booking not found");
        }
        return "Booking payment status updated successfully";
    }
}