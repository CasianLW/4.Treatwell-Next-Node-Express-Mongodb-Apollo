import React, { FC, useState, useEffect } from "react";
import BookingComponent from "./BookingComponent";
import ICoiffeur, { ISlot } from "@/types/Coiffeur";
import { formatDate, translateSlotsToHours } from "@/helpers/format-values";

interface BookSlotModalProps {
  date: Date;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  slots: number[];
  coiffeur: ICoiffeur | null;
}

interface IFormDataCoiffeur {
  coiffeurId: string;
  slots: ISlot[];
}

const BookSlotModal: FC<BookSlotModalProps> = ({
  date,
  isOpen,
  setIsOpen,
  slots,
  coiffeur,
}) => {
  const [formDataCoiffeur, setFormDataCoiffeur] = useState<IFormDataCoiffeur>({
    coiffeurId: coiffeur?.id ?? "",
    slots: slots.map((slotNumber) => ({
      slotNumber,
      name: "",
      phoneNumber: "",
      email: "",
    })),
  });

  useEffect(() => {
    // Update slots and coiffeurId if the `slots` or `coiffeur` prop changes
    setFormDataCoiffeur((prev) => ({
      ...prev,
      coiffeurId: coiffeur?.id ?? "",
      slots: slots.map((slotNumber) => ({
        slotNumber,
        name: "",
        phoneNumber: "",
        email: "",
      })),
    }));
  }, [slots, coiffeur]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value;
    const updatedSlots = formDataCoiffeur.slots.map((slot) => ({
      ...slot,
      [field]: value, // Update the field for all slots
    }));
    setFormDataCoiffeur((prev) => ({ ...prev, slots: updatedSlots }));
  };

  if (!isOpen) return null; // Don't render the modal if isOpen is false

  return (
    <div className="fixed z-50 inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center">
          <div className="block">
            <h3 className="text-xl font-medium">Book Reservation</h3>
            <span>With: {coiffeur?.nom}</span>
            <br />

            <span className="font-semibold">
              {formatDate(date)} at{" "}
              <span className="underline">{translateSlotsToHours(slots)}</span>
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Email"
            onChange={(e) => handleInputChange(e, "email")}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Phone Number"
            onChange={(e) => handleInputChange(e, "phoneNumber")}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Name"
            onChange={(e) => handleInputChange(e, "name")}
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={() => {
              console.log(date, formDataCoiffeur);
            }}
          >
            Log infos
          </button>
          <BookingComponent
            date={date}
            coiffeurId={formDataCoiffeur.coiffeurId}
            slots={formDataCoiffeur.slots}
          />
        </div>
      </div>
    </div>
  );
};

export default BookSlotModal;
