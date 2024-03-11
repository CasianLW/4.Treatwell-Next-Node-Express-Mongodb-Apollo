import Image from "next/image";
import BookingComponent from "@/components/BookingComponent";
import CoiffeursListComponent from "@/components/CoiffeursListComponent";
import { useState } from "react";
import { ISlot } from "@/types/Coiffeur";

export default function Home() {
  interface IFormDataCoiffeur {
    coiffeurId: string;
    date: Date;
    slots: ISlot[];
  }

  const initialSlot: ISlot = {
    slotNumber: 1, // Default value, change as needed
    name: "",
    phoneNumber: "",
    email: "",
  };

  const [formDataCoiffeur, setFormDataCoiffeur] = useState<IFormDataCoiffeur>({
    coiffeurId: "",
    date: new Date(),
    slots: [initialSlot], // Start with one empty slot
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    slotIndex?: number
  ) => {
    let value: any = e.target.value;

    if (field === "date") {
      // Convert date string back to Date object
      value = new Date(value);
      setFormDataCoiffeur((prev) => ({ ...prev, [field]: value }));
    } else if (typeof slotIndex === "number") {
      // We're updating a slot's information
      if (field === "slotNumber") {
        // Convert the slot number to an integer and ensure it's within the valid range
        value = parseSlotNumber(value);
      }
      const updatedSlots = formDataCoiffeur.slots.map((slot, index) => {
        if (index === slotIndex) {
          return { ...slot, [field]: value }; // Update the specific slot field
        }
        return slot;
      });
      setFormDataCoiffeur((prev) => ({ ...prev, slots: updatedSlots }));
    } else {
      // Update coiffeurId or any other non-slot related field
      setFormDataCoiffeur((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Keep the parseSlotNumber function definition outside of the Home function to avoid re-creating it on every render
  const parseSlotNumber = (inputValue: string) => {
    const number = parseInt(inputValue, 10);
    // Assume slots per day is limited from 1 to 32 (8 hours by 15 minutes)
    if (Number.isNaN(number) || number < 1) {
      return 1;
    } else if (number > 32) {
      return 32;
    }
    return number;
  };

  // Check if all required form data is provided
  const isFormValid =
    formDataCoiffeur.coiffeurId &&
    formDataCoiffeur.slots.every(
      (slot) => slot.name && slot.phoneNumber && slot.email
    );

  return (
    <div>
      <div>Content here</div>

      <form>
        <label htmlFor="coiffeurId">Coiffeur ID:</label>
        <input
          id="coiffeurId"
          type="text"
          value={formDataCoiffeur.coiffeurId}
          onChange={(e) => handleInputChange(e, "coiffeurId")}
        />

        <label htmlFor="date">Date:</label>
        <input
          id="date"
          type="date"
          // value={formDataCoiffeur.date.toISOString().substring(0, 10)}
          value={
            formDataCoiffeur.date
              ? formDataCoiffeur.date.toISOString().substring(0, 10)
              : ""
          }
          onChange={(e) => handleInputChange(e, "date")}
        />
        {/* ... other input elements ... */}
        {formDataCoiffeur.slots.map((slot, index) => (
          <div key={index}>
            <label>Slot {index + 1}:</label>
            <input
              type="number"
              placeholder="Slot Number"
              value={slot.slotNumber}
              onChange={(e) => handleInputChange(e, "slotNumber", index)}
              min="1"
              max="32"
            />
            <input
              type="text"
              placeholder="Name"
              value={slot.name}
              onChange={(e) => handleInputChange(e, "name", index)}
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={slot.phoneNumber}
              onChange={(e) => handleInputChange(e, "phoneNumber", index)}
            />
            <input
              type="email"
              placeholder="Email"
              value={slot.email}
              onChange={(e) => handleInputChange(e, "email", index)}
            />
          </div>
        ))}
      </form>

      {isFormValid && (
        <BookingComponent
          date={formDataCoiffeur.date}
          coiffeurId={formDataCoiffeur.coiffeurId}
          slots={formDataCoiffeur.slots}
        />
      )}

      <h2>Coiffeurs list</h2>
      <CoiffeursListComponent />
    </div>
  );
}
