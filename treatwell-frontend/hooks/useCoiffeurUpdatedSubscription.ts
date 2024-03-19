import { gql, useSubscription } from "@apollo/client";
import ICoiffeur from "@/types/Coiffeur";

export const workingDays = `
  workingDays {
    dayOfWeek
    morningSlots
    afternoonSlots
  }
`;

export const GET_COIFFEURS = gql`
  query {
    coiffeurs {
      id
      nom
      prenom
      urlImage
      ${workingDays}
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

export const COIFFEUR_UPDATED_SUBSCRIPTION = gql`
  subscription OnCoiffeurUpdated {
    coiffeurUpdated {
      coiffeurId
      updateType
      coiffeur {
        id
        nom
        urlImage
        prenom
        ${workingDays}
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

// export const useCoiffeurUpdatedSubscription = (
//   onUpdate: (payload: CoiffeurUpdatePayload) => void
// ) => {
//   useSubscription<CoiffeurUpdatePayload>(COIFFEUR_UPDATED_SUBSCRIPTION, {
//     onSubscriptionData: ({ subscriptionData }) => {
//       if (subscriptionData && subscriptionData.data) {
//         onUpdate(subscriptionData.data);
//       }
//     },
//   });
// };

export const useCoiffeurUpdatedSubscription = (
  onUpdate: (payload: CoiffeurUpdatePayload) => void
) => {
  useSubscription<CoiffeurUpdatePayload>(COIFFEUR_UPDATED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      // console.log("Subscription data received:", subscriptionData);
      if (subscriptionData && subscriptionData.data) {
        // console.log("Updating client with new data...");
        onUpdate(subscriptionData.data);
      }
    },
  });
};
