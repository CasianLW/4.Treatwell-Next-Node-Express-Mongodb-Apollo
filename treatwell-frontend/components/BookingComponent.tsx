import React from "react";
import { useBookSlots } from "@/hooks/useBookSlots";

const BookingComponent = () => {
  const { bookSlots, data, loading, error } = useBookSlots();

  const handleBookSlots = () => {
    bookSlots({
      variables: {
        coiffeurId: "65e8fb76fe5f9f0740253a42",
        date: "2023-01-01", // Example date
        slots: [
          {
            slotNumber: 1,
            name: "John Doe",
            phoneNumber: "123456789",
            email: "john@example.com",
          },
          // Add more slots as needed
        ],
      },
    });
  };

  if (loading) return <p>Booking slots...</p>;
  if (error) return <p>Error booking slots: {error.message}</p>;

  return (
    <div>
      <button onClick={handleBookSlots}>Book Slots</button>
      {data && <p>Booking successful!</p>}
      {/* You can expand this section to display more booking information */}
    </div>
  );
};

export default BookingComponent;
