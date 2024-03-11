import { gql, useMutation } from "@apollo/client";
import { GET_COIFFEURS } from "./useCoiffeurUpdatedSubscription";
import ICoiffeur from "@/types/Coiffeur";

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
  // const [bookSlots, { data, loading, error }] =
  //   useMutation(BOOK_SLOTS_MUTATION);
  // return { bookSlots, data, loading, error };

  const [bookSlots, { data, loading, error }] = useMutation(
    BOOK_SLOTS_MUTATION,
    {
      update(cache, { data: { bookSlots } }) {
        // Attempt to read the query from the cache
        const cacheData = cache.readQuery<{ coiffeurs: ICoiffeur[] }>({
          query: GET_COIFFEURS,
        });

        // Ensure we have data to work with
        if (cacheData) {
          const { coiffeurs } = cacheData;

          // Find and update the coiffeur data with the new slots
          const updatedCoiffeurs = coiffeurs.map((coiffeur) => {
            if (coiffeur.id === bookSlots.id) {
              return { ...coiffeur, joursTravail: bookSlots.joursTravail };
            }
            return coiffeur;
          });

          // Write the updated coiffeurs list back to the cache
          cache.writeQuery({
            query: GET_COIFFEURS,
            data: { coiffeurs: updatedCoiffeurs },
          });
        }
      },
    }
  );

  return { bookSlots, data, loading, error };
};
