import { useError } from "@/contexts/ErrorContext";
import {
  COIFFEUR_UPDATED_SUBSCRIPTION,
  GET_COIFFEURS,
} from "@/hooks/useCoiffeurUpdatedSubscription";
import { setHandleApolloError } from "@/lib/apolloClient";
import ICoiffeur from "@/types/Coiffeur";
import { useQuery, useSubscription } from "@apollo/client";
import moment from "moment";
import { useEffect, useState } from "react";
import Select from "react-select"; // Ensure this is the correct import for your Select component

const CoiffeursListComponent = () => {
  const { loading, error, data } = useQuery(GET_COIFFEURS);
  const [coiffeurs, setCoiffeurs] = useState<ICoiffeur[]>([]);
  const { setError } = useError();

  useEffect(() => {
    setHandleApolloError(setError);
  }, [setError]);
  useSubscription(COIFFEUR_UPDATED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      // console.log("Subscription data received:", subscriptionData); // This should log incoming subscription data
      const { coiffeurUpdated } = subscriptionData.data;
      updateCoiffeurInList(coiffeurUpdated.coiffeur);
    },
  });

  useEffect(() => {
    if (data && data.coiffeurs) {
      setCoiffeurs(data.coiffeurs);
    }
  }, [data]);

  const updateCoiffeurInList = (updatedCoiffeur: ICoiffeur) => {
    // Check if the updated coiffeur is already in the list
    const index = coiffeurs.findIndex((c) => c.id === updatedCoiffeur.id);

    if (index > -1) {
      // Coiffeur exists, update it
      const updatedCoiffeurs = [...coiffeurs];
      updatedCoiffeurs[index] = updatedCoiffeur;
      setCoiffeurs(updatedCoiffeurs);
    } else {
      // Coiffeur is new, add it to the list
      setCoiffeurs([...coiffeurs, updatedCoiffeur]);
    }
  };

  const serviceOptions = [
    { value: "cut", label: "Cut (15 min)", duration: 1 },
    { value: "cutAndBarber", label: "Cut + Barber (30 min)", duration: 2 },
  ];

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <div>
      <Select
        options={serviceOptions}
        className="mb-4"
        isClearable // Allows users to clear the selected value
        // You may want to handle onChange and onInputChange depending on your requirements
      />
      {coiffeurs.map((coiffeur) => (
        <div key={coiffeur.id}>
          <h3>
            {coiffeur.nom} {coiffeur.prenom} (id: {coiffeur.id})
          </h3>
          {coiffeur.joursTravail.map((jour) => (
            <div key={`${jour.date}`}>
              <h4>{moment(Number(jour.date)).format("MMMM Do YYYY")}</h4>
              {jour.slots.map((slot, index) => (
                <div key={index}>
                  {moment()
                    .startOf("day")
                    .add(slot.slotNumber * 15, "minutes")
                    .format("HH:mm")}
                  -{" "}
                  {slot.name
                    ? `Booked by ${slot.name} - Number: ${slot.phoneNumber} (${slot.email})`
                    : "Available"}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CoiffeursListComponent;
