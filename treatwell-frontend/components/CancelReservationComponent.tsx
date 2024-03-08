import { useCancelReservation } from "@/hooks/useCancelReservation";

const CancelReservationComponent = () => {
  const { cancelReservation, data, loading, error } = useCancelReservation();

  const handleCancel = () => {
    cancelReservation({
      variables: {
        coiffeurId: "yourCoiffeurId",
        date: "2023-01-01", // example date
        reservationId: "yourReservationId",
        email: "john@example.com",
      },
    });
  };

  if (loading) return <p>Cancelling reservation...</p>;
  if (error) return <p>Error cancelling reservation :(</p>;

  return (
    <div>
      <button onClick={handleCancel}>Cancel Reservation</button>
      {/* Display cancellation confirmation or other UI elements */}
    </div>
  );
};

export default CancelReservationComponent;
