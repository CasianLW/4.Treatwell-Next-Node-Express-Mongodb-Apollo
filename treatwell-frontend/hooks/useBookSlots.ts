import { gql, useMutation } from "@apollo/client";

const BOOK_SLOTS_MUTATION = gql`
  mutation BookSlots($coiffeurId: ID!, $date: String!, $slots: [SlotInput!]!) {
    bookSlots(coiffeurId: $coiffeurId, date: $date, slots: $slots) {
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

export const useBookSlots = () => {
  const [bookSlots, { data, loading, error }] =
    useMutation(BOOK_SLOTS_MUTATION);
  return { bookSlots, data, loading, error };
};
