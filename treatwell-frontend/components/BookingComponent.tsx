import React, { FC, useState } from "react";
import { useBookSlots } from "@/hooks/useBookSlots";
import { ISlot } from "@/types/Coiffeur";
import moment from "moment";

type BookingProps = {
  date: Date;
  coiffeurId: string;
  slots: ISlot[];
};

const BookingComponent: FC<BookingProps> = ({ coiffeurId, date, slots }) => {
  const { bookSlots, data, loading } = useBookSlots();
  const [errorMessage, setErrorMessage] = useState("");

  const handleBookSlots = () => {
    setErrorMessage(""); // Reset error message before trying to book slots
    bookSlots({
      variables: {
        coiffeurId: coiffeurId,
        date: moment(date).format("YYYY-MM-DD"),
        slots: slots,
      },
    }).catch((error) => {
      // Handle error here if bookSlots fails
      setErrorMessage(error.message);
      setTimeout(() => {
        setErrorMessage(""); // Hide error message after 5 seconds
      }, 5000);
    });
  };

  return (
    <div>
      <button onClick={handleBookSlots}>Book Slots</button>
      {loading && <p>Booking slots...</p>}
      {data && <p>Booking successful!</p>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default BookingComponent;
