import React, { useState, useEffect } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import ICoiffeur, { IDay } from "@/types/Coiffeur";
import {
  GET_COIFFEURS,
  COIFFEUR_UPDATED_SUBSCRIPTION,
} from "@/hooks/useCoiffeurUpdatedSubscription";
import { useError } from "@/contexts/ErrorContext";
import { setHandleApolloError } from "@/lib/apolloClient";
import Image from "next/image";
import "moment/locale/fr"; // Import French locale
import { fr } from "date-fns/locale/fr";
import BookSlotModal from "./book-slot-modal";
moment.locale("fr"); // Set the locale globally

const frCustom = fr; // Set the custom locale to French

const CoiffeursListComponent = () => {
  const { loading, error, data } = useQuery(GET_COIFFEURS);
  const [coiffeurs, setCoiffeurs] = useState<ICoiffeur[]>([]);
  const [selectedService, setSelectedService] = useState<{
    value: string;
    label: string;
    duration: number;
  }>({ value: "cut", label: "Cut (15 min)", duration: 1 });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [maxHeights, setMaxHeights] = useState<{ [key: string]: string }>({}); // State to manage max heights for each coiffeur

  const [slotsSelected, setSlotsSelected] = useState<number[]>([]);
  const [coiffeurSelected, setCoiffeurSelected] = useState<ICoiffeur | null>();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { setError } = useError();

  useEffect(() => {
    setHandleApolloError(setError);
  }, [setError]);

  useSubscription(COIFFEUR_UPDATED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      const { coiffeurUpdated } = subscriptionData.data;
      updateCoiffeurInList(coiffeurUpdated.coiffeur);
    },
  });

  // useEffect(() => {
  //   if (data && data.coiffeurs) {
  //     setCoiffeurs(data.coiffeurs);
  //   }
  // }, [data]);

  useEffect(() => {
    if (data && data.coiffeurs) {
      setCoiffeurs(data.coiffeurs);
      // Initialize max heights state with default values (240px) for each coiffeur
      const initialMaxHeights: { [key: string]: string } = {};
      data.coiffeurs.forEach((coiffeur: ICoiffeur) => {
        initialMaxHeights[coiffeur.id] = "240px";
      });
      setMaxHeights(initialMaxHeights);
    }
  }, [data]);

  const updateCoiffeurInList = (updatedCoiffeur: ICoiffeur) => {
    const index = coiffeurs.findIndex((c) => c.id === updatedCoiffeur.id);
    if (index > -1) {
      const updatedCoiffeurs = [...coiffeurs];
      updatedCoiffeurs[index] = updatedCoiffeur;
      setCoiffeurs(updatedCoiffeurs);
    } else {
      setCoiffeurs([...coiffeurs, updatedCoiffeur]);
    }
  };

  const serviceOptions = [
    { value: "cut", label: "Cut (15 min)", duration: 1 },
    { value: "cutAndBarber", label: "Cut + Barber (30 min)", duration: 2 },
  ];

  const reservateModal = (slots: number[], coiffeur: ICoiffeur) => {
    setCoiffeurSelected(coiffeur);
    setSlotsSelected(slots);
    setIsModalOpen(true);
    // Open modal here
    // Pass the slots to the modal for reservation
  };

  const isSlotInWorkingHours = (
    coiffeur: ICoiffeur,
    slotNumber: number
  ): boolean => {
    // Get the current moment in time
    const currentTime = moment()
      .startOf("day")
      .add((slotNumber - 1) * 15, "minutes");

    // Check if the slot is within the morning program (9:00 - 13:00)
    const isMorningSlot = currentTime.isBetween(
      moment().startOf("day").add(9, "hours"),
      moment().startOf("day").add(13, "hours"),
      undefined,
      "[]"
    );

    // Check if the slot is within the afternoon program (14:00 - 18:00)
    const isAfternoonSlot = currentTime.isBetween(
      moment().startOf("day").add(14, "hours"),
      moment().startOf("day").add(18, "hours"),
      undefined,
      "[]"
    );

    // Determine if the slot is in working hours based on the coiffeur's working days configuration
    const dayOfWeek = currentTime.format("dddd").toLowerCase();
    const workingDay = coiffeur.workingDays.find(
      (day) => day.dayOfWeek.toLowerCase() === dayOfWeek
    );
    if (!workingDay) return false;

    // Check if the slot is within the morning or afternoon slots defined by the coiffeur's working days
    return (
      (isMorningSlot && workingDay.morningSlots.includes(slotNumber)) ||
      (isAfternoonSlot && workingDay.afternoonSlots.includes(slotNumber - 16)) // Adjusted for afternoon slots
    );
  };

  const getSlotStatus = (
    coiffeur: ICoiffeur,
    slotNumber: number,
    selectedDay: IDay | undefined
  ): string => {
    if (!isSlotInWorkingHours(coiffeur, slotNumber)) return "bg-gray-800"; // Dark gray for out of working hours
    if (
      selectedDay &&
      selectedDay.slots.some((slot) => slot.slotNumber === slotNumber)
    )
      return "bg-red-500"; // Soft red for booked slots
    return "bg-green-500"; // Soft green for available slots
  };

  const generateSlots = (
    coiffeur: ICoiffeur,
    selectedDate: Date
  ): [JSX.Element[], JSX.Element[]] => {
    const morningSlots: JSX.Element[] = [];
    const afternoonSlots: JSX.Element[] = [];

    const dayOfWeek = moment(selectedDate).format("dddd").toLowerCase();
    const workingDay = coiffeur.workingDays.find(
      (day) => day.dayOfWeek.toLowerCase() === dayOfWeek
    );
    const dayBookings = coiffeur.joursTravail.find((day) =>
      moment(Number(day.date)).isSame(selectedDate, "day")
    );

    const slotIncrement = selectedService.duration;

    const createSlotButton = (slotNumber: number) => {
      let isInWorkingHours = false;
      let isBooked = false;

      let isMorningSlot = false;

      if (workingDay) {
        isMorningSlot = slotNumber <= 16;
        const isAfternoonSlot = slotNumber > 16 && slotNumber <= 32;

        isInWorkingHours =
          (isMorningSlot && workingDay.morningSlots.includes(slotNumber)) ||
          (isAfternoonSlot &&
            workingDay.afternoonSlots.includes(slotNumber - 16));

        isBooked =
          (dayBookings &&
            dayBookings.slots.some((slot) => slot.slotNumber === slotNumber)) ||
          false;

        if (selectedService.duration === 2) {
          isBooked =
            isBooked ||
            dayBookings?.slots.some(
              (slot) =>
                slot.slotNumber === slotNumber ||
                slot.slotNumber === slotNumber - 1
            ) ||
            false;
        }
      }

      const slotStyle = {
        // padding: "8px",
        // margin: "4px",
        backgroundColor: isInWorkingHours
          ? isBooked
            ? "red"
            : "green"
          : "darkgray",
        cursor: isInWorkingHours && !isBooked ? "pointer" : "not-allowed",
        opacity: isInWorkingHours ? 1 : 0.4,
      };

      const startTime = moment()
        .startOf("day")
        .add(isMorningSlot ? 9 : 10, "hours")
        .add((slotNumber - 1) * 15, "minutes");

      const slotNumbers = isInWorkingHours
        ? Array.from({ length: slotIncrement }, (_, i) => slotNumber + i)
        : [slotNumber];

      const handleSlotClick =
        isInWorkingHours && !isBooked
          ? () => reservateModal(slotNumbers, coiffeur)
          : undefined;

      return (
        <button
          className=" w-16 py-2 "
          key={slotNumber}
          style={slotStyle}
          onClick={handleSlotClick}
          disabled={!isInWorkingHours}
        >
          {startTime.format("HH:mm")}
        </button>
      );
    };

    for (let slotNumber = 1; slotNumber <= 32; slotNumber += slotIncrement) {
      const slotButton = createSlotButton(slotNumber);
      if (slotNumber <= 16) {
        morningSlots.push(slotButton);
      } else {
        afternoonSlots.push(slotButton);
      }
    }

    return [morningSlots, afternoonSlots];
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <div>
      <BookSlotModal
        coiffeur={coiffeurSelected ?? null}
        date={selectedDate}
        slots={slotsSelected}
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
      />
      <div className="flex  gap-2 float-start">
        <div className="w-full">
          <p>Select a service</p>{" "}
          <Select
            options={serviceOptions}
            className="mb-4 max-w-[300px] w-full"
            // isClearable
            defaultValue={serviceOptions[0]}
            onChange={(option) =>
              setSelectedService(option || serviceOptions[0])
            }
          />
        </div>
        <div className="w-full text-left flex flex-col ">
          <span className="text-left">Select a date:</span>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            dateFormat="dd/MM/yyyy"
            className="mb-4 pl-1"
            locale={frCustom}
            calendarStartDay={1}
            weekLabel="S"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 w-full">
        {coiffeurs.map((coiffeur) => (
          <div key={coiffeur.id} className="pb-6  place-self-center mb-auto">
            <h3>
              {coiffeur.nom} {coiffeur.prenom}
            </h3>
            <Image
              style={{ maxWidth: "12rem" }}
              layout="responsive"
              src={coiffeur.urlImage}
              alt={`Image of ${coiffeur.nom} ${coiffeur.prenom}`}
              width={200}
              height={400}
            />
            <h4 className="mt-4 text-center font-semibold text-lg underline">
              Horaires
            </h4>
            <div
              className={`h-[240px] ${
                maxHeights[coiffeur.id] === "240px"
                  ? "overflow-clip"
                  : "overflow-visible"
              }`}
            >
              <div
                className="grid grid-cols-2 gap-4 m-auto bg-white bg-opacity-95 pb-2 w-fit relative"
                style={{
                  maxHeight: maxHeights[coiffeur.id],
                  transition: "max-height 0.01s ease-in-out",
                  zIndex: maxHeights[coiffeur.id] === "240px" ? 0 : 10,
                }}
              >
                <div className="flex-wrap place-items-center  grid grid-cols-16 gap-2 ">
                  <p className="text-center font-bold w-fit">Matin</p>
                  {generateSlots(coiffeur, selectedDate)[0]}
                </div>
                <div className="flex-wrap place-items-center grid grid-cols-16 gap-2">
                  <p className="text-center font-bold">Aprés-midi</p>
                  {generateSlots(coiffeur, selectedDate)[1]}
                </div>
                <div
                  className={`absolute inset-x-0 flex justify-center z-20 ${
                    maxHeights[coiffeur.id] === "240px"
                      ? " bottom-2 "
                      : " bottom-[-12px] "
                  }`}
                >
                  <button
                    className="bg-blue-400 px-4 hover:bg-blue-600 text-white"
                    onClick={() =>
                      setMaxHeights((prevMaxHeights) => ({
                        ...prevMaxHeights,
                        [coiffeur.id]:
                          prevMaxHeights[coiffeur.id] === "240px"
                            ? "fit-content"
                            : "240px",
                      }))
                    }
                  >
                    {maxHeights[coiffeur.id] === "240px"
                      ? "Voir plus"
                      : "Voir moins"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoiffeursListComponent;
