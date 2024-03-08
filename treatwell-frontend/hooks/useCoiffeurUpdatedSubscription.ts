import { gql, useSubscription } from "@apollo/client";
import ICoiffeur from "@/types/Coiffeur";

const COIFFEUR_UPDATED_SUBSCRIPTION = gql`
  subscription OnCoiffeurUpdated {
    coiffeurUpdated {
      coiffeurId
      updateType
      coiffeur {
        id
        nom
        prenom
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
  }
`;

interface CoiffeurUpdatePayload {
  coiffeurUpdated: {
    coiffeurId: string;
    updateType: string;
    coiffeur: ICoiffeur;
  };
}

export const useCoiffeurUpdatedSubscription = (
  onUpdate: (payload: CoiffeurUpdatePayload) => void
) => {
  useSubscription<CoiffeurUpdatePayload>(COIFFEUR_UPDATED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData && subscriptionData.data) {
        onUpdate(subscriptionData.data);
      }
    },
  });
};
