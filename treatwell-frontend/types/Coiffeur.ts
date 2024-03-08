interface ISlot {
  slotNumber: number;
  name?: string;
  phoneNumber?: string;
  email?: string;
  reservationId: string;
}

interface IDay {
  date: Date;
  slots: ISlot[];
}

interface ICoiffeur extends Document {
  nom: string;
  prenom: string;
  urlImage: string;
  joursTravail: IDay[];
}

export default ICoiffeur;
