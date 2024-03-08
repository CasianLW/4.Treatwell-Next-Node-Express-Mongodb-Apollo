import { gql, useMutation } from "@apollo/client";

const CANCEL_RESERVATION_MUTATION = gql`
  mutation CancelReservation(
    $coiffeurId: ID!
    $date: String!
    $reservationId: ID!
    $email: String!
  ) {
    cancelReservation(
      coiffeurId: $coiffeurId
      date: $date
      reservationId: $reservationId
      email: $email
    ) {
      id
      joursTravail {
        date
        slots {
          slotNumber
          name
          phoneNumber
          email
          reservationId
        }
      }
    }
  }
`;

export const useCancelReservation = () => {
  const [cancelReservation, { data, loading, error }] = useMutation(
    CANCEL_RESERVATION_MUTATION
  );
  return { cancelReservation, data, loading, error };
};
