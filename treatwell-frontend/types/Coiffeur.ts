export interface ISlot {
  slotNumber: number;
  name?: string;
  phoneNumber?: string;
  email?: string;
  reservationId?: string;
}

export interface IWorkingDay {
  dayOfWeek: string;
  morningSlots: number[];
  afternoonSlots: number[];
}

export interface IDay {
  date: Date | number | string;
  slots: ISlot[];
}

interface ICoiffeur extends Document {
  id: string;
  nom: string;
  prenom: string;
  urlImage: string;
  joursTravail: IDay[];
  workingDays: IWorkingDay[];
}

export default ICoiffeur;
