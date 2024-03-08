// src/hooks/useAddSlots.ts

import { gql, useMutation } from "@apollo/client";

const ADD_SLOTS_MUTATION = gql`
  mutation AddSlots($coiffeurId: ID!, $date: String!, $slots: [Int]!) {
    updateSlots(coiffeurId: $coiffeurId, date: $date, slots: $slots) {
      id
      joursTravail {
        date
        slots
      }
    }
  }
`;

interface AddSlotsVars {
  coiffeurId: string;
  date: string;
  slots: number[];
}

export function useAddSlots() {
  const [addSlotsMutation, { data, loading, error }] = useMutation<
    { updateSlots: any },
    AddSlotsVars
  >(ADD_SLOTS_MUTATION);

  const addSlots = (coiffeurId: string, date: string, slots: number[]) => {
    addSlotsMutation({
      variables: { coiffeurId, date, slots },
    });
  };

  return {
    addSlots,
    data,
    loading,
    error,
  };
}
