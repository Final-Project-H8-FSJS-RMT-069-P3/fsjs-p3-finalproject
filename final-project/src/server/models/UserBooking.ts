import { ObjectId } from "mongodb";
import { getDB } from "../config/mongodb";

export interface IUserBooking {
  _id?: ObjectId;
  userId: ObjectId;
  staffId: ObjectId;
  formBriefId?: ObjectId | null;
  date: Date;
  sessionDuration: number;
  amount: number;
  type: "videocall" | "chat-only" | "offline";
  videoCallUrl?: string | null;
  isPaid: boolean;
  isDone: boolean;
  createdAt: Date;
}

export type BookingWithRelations = IUserBooking & {
  user?: {
    _id: ObjectId;
    name?: string;
    email?: string;
  };
  staff?: {
    _id: ObjectId;
    name?: string;
    email?: string;
  };
};

const toObjectId = (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid ObjectId");
  }

  return new ObjectId(id);
};

export default class UserBooking {
  static async getCollection() {
    const db = await getDB();
    return db.collection<IUserBooking>("UserBookings");
  }

  static async getBookingsByUserId(userId: string): Promise<BookingWithRelations[]> {
    const collection = await this.getCollection();

    return collection
      .aggregate<BookingWithRelations>([
        { $match: { userId: toObjectId(userId) } },
        {
          $lookup: {
            from: "Users",
            localField: "staffId",
            foreignField: "_id",
            as: "staff",
          },
        },
        {
          $addFields: {
            staff: { $arrayElemAt: ["$staff", 0] },
          },
        },
        { $sort: { date: -1 } },
      ])
      .toArray();
  }

  static async getBookingsByStaffId(staffId: string): Promise<BookingWithRelations[]> {
    const collection = await this.getCollection();

    return collection
      .aggregate<BookingWithRelations>([
        { $match: { staffId: toObjectId(staffId) } },
        {
          $lookup: {
            from: "Users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] },
          },
        },
        { $sort: { date: -1 } },
      ])
      .toArray();
  }

  static async updateBookingPaymentStatus(
    bookingId: string,
    isPaid: boolean,
  ) {
    const collection = await this.getCollection();

    const result = await collection.updateOne(
      { _id: toObjectId(bookingId) },
      {
        $set: {
          isPaid,
        },
      },
    );

    return result;
  }
}
