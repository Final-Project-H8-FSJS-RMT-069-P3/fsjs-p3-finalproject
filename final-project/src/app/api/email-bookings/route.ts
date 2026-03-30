import { sendDoctorBookingNotification } from "../../../server/helpers/resendEmail";
import UserModel from "../../../server/models/User";
import BookingModel from "../../../server/models/UserBooking";
import type { Model, Document, Types } from "mongoose";

interface IUserDoc extends Document {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface IBookingDoc extends Document {
  _id: Types.ObjectId;
  doctorId: string;
  patientId: string;
  date: string | Date;
  time: string;
  notes?: string;
  priceTier?: string;
}

const User = UserModel as unknown as Model<IUserDoc>;
const Booking = BookingModel as unknown as Model<IBookingDoc>;

export async function POST(req: Request) {
  const { doctorId, patientId, date, time, notes } = await req.json();

  if (!doctorId || !patientId || !date || !time) {
    return new Response(
      JSON.stringify({ message: "Missing required fields" }),
      {
        status: 400,
      },
    );
  }

  const doctor = await User.findById(doctorId);
  const patient = await User.findById(patientId);

  if (!doctor || !patient) {
    return new Response(
      JSON.stringify({ message: "Doctor or patient not found" }),
      {
        status: 404,
      },
    );
  }

  const booking = await Booking.create({
    doctorId,
    patientId,
    date: date,
    time: time,
    notes: notes,
  });

  try {
    await sendDoctorBookingNotification({
      doctorEmail: doctor.email || "", // Ensure string
      doctorName: doctor.name,
      patientName: patient.name || "Unknown",
      patientPhone: patient.phone || "-",
      patientAddress: patient.address || "-",
      bookingDate: (booking.date || date).toString(),
      bookingTime: booking.time || time,
      priceTier: booking.priceTier || "Standard",
      notes: booking.notes || notes,
    });
  } catch (e) {
    console.error("Failed to send booking email:", e);
  }

  return new Response(JSON.stringify({ message: "Booking successful" }), {
    status: 200,
  });
}
