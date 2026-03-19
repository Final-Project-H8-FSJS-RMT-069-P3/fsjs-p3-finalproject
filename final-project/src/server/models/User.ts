import { ObjectId, WithId } from "mongodb";
import { getDB } from "../config/mongodb";
import { comparePassword, hashPassword } from "../helpers/bcrypt";
import { signToken } from "../helpers/jwt";
import { NotFoundError, UnauthorizedError } from "../helpers/CustomError";



export interface IUser {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    role: "user" | "psychiatrist";
    phoneNumber: string;
    address: string;
    psychiatristInfo?: {
        certificate: string;
        experience: number;
        scheduleDays: string[];
        scheduleTimes: string[];
    };
}


export default class User {
    static async getCollection() {
        const db = await getDB();
        const collection = db.collection<IUser>("users");
        return collection;
    }

    static async register(user: IUser): Promise<string> {
        const collection = await this.getCollection();
        user.password = hashPassword(user.password);
        const result = await collection.insertOne(user);
        return "User registered successfully";
    }

    static async getUserById(id: string): Promise<WithId<IUser> | null> {
        const collection = await this.getCollection();
        const user = await collection.findOne({ _id: new ObjectId(id) });
        return user;
    }

    static async getUserByEmail(email: string): Promise<WithId<IUser> | null> {
        const collection = await this.getCollection();
        const user = await collection.findOne({ email });
        return user;
    }

    static async login(input: Pick<IUser, "email" | "password">): Promise<string> {
        const collection = await this.getCollection();
        const user = await collection.findOne({ email: input.email });
        if (!user) {
            throw new NotFoundError("User not found");
        }
        const isPasswordValid = comparePassword(input.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid password");
        }
        const payload = {
            _id: user._id,
            email: user.email,
            role: user.role
        };
        const token = signToken(payload);
        return token;
    }
}