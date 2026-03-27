// Example page.tsx
import { Metadata } from "next";
import BookingForm from "../../components/BookingForm";

export const metadata: Metadata = {
  title: "Booking Form",
  description: "Book your appointment",
}

export default function BookPage() {
  const doctorId = "663b8e4f1a2b3c4d5e6f7890"; //masih di hard code ya 

  return (
    <div>
      <h1>Book an Appointment</h1>
      <BookingForm staffId={doctorId} />
    </div>
  );
}