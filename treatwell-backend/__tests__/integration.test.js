const { createTestClient } = require("apollo-server-testing");
const { ApolloServer, gql } = require("apollo-server-express");
const mongoose = require("mongoose");
const { typeDefs, resolvers, formatDateToYYYYMMDD } = require("../server"); // Ensure these are correctly imported from your Apollo Server setup
const Coiffeur = require("../models/Coiffeur");

// function formatDateToYYYYMMDD(date) {
//   if (!(date instanceof Date)) {
//     throw new TypeError("Provided input is not a Date object.");
//   }

//   const year = date.getFullYear();
//   const month = (date.getMonth() + 1).toString().padStart(2, "0"); // +1 because getMonth() returns 0-11
//   const day = date.getDate().toString().padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Creating a coiffeur with pre-defined slots for testing

  await Coiffeur.deleteMany({});

  createdCoiffeur = await Coiffeur.create({
    nom: "Test",
    prenom: "Coiffeur",
    urlImage: "http://example.com/image.jpg",
    joursTravail: [
      {
        date: formatDateToYYYYMMDD(new Date()),
        slots: [
          {
            slotNumber: 1,
            name: "Client Name",
            phoneNumber: "123456789",
            email: "client@example.com",
            reservationId: new mongoose.Types.ObjectId().toString(),
          },
          {
            slotNumber: 2,
            name: "Another Client",
            phoneNumber: "987654321",
            email: "another@example.com",
            reservationId: new mongoose.Types.ObjectId().toString(),
          },
        ],
      },
      {
        date: "2024-03-20T18:54:08.604+00:00",
        slots: [
          {
            slotNumber: 1,
            name: "Client Name",
            phoneNumber: "123456789",
            email: "client@example.com",
            reservationId: new mongoose.Types.ObjectId().toString(),
          },
          {
            slotNumber: 2,
            name: "Another Client",
            phoneNumber: "987654321",
            email: "another@example.com",
            reservationId: new mongoose.Types.ObjectId().toString(),
          },
        ],
      },
    ],
    workingDays: [
      {
        dayOfWeek: "Lundi",
        morningSlots: [1, 2, 3],
        afternoonSlots: [4, 5, 6],
      },
      {
        dayOfWeek: "Mardi",
        morningSlots: [1, 2, 3],
        afternoonSlots: [4, 5, 6],
      },
      {
        dayOfWeek: "Mercredi",
        morningSlots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        afternoonSlots: [4, 5, 6],
      },
      {
        dayOfWeek: "Jeudi",
        morningSlots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        afternoonSlots: [4, 5, 6],
      },
      {
        dayOfWeek: "Samedi",
        morningSlots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        afternoonSlots: [4, 5, 6],
      },
      {
        dayOfWeek: "Dimanche",
        morningSlots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        afternoonSlots: [4, 5, 6],
      },
    ],
  });
});

// afterEach(async () => {
//   await Coiffeur.deleteMany({});
// });

afterAll(async () => {
  await mongoose.disconnect();
});

describe("GraphQL Integration Tests", () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({
      /* your context here */
    }),
  });

  const { query, mutate } = createTestClient(server);

  //1. Fetch list of coiffeurs
  test("Fetch list of coiffeurs", async () => {
    const GET_COIFFEURS = gql`
      query {
        coiffeurs {
          id
          nom
          prenom
          urlImage
        }
      }
    `;

    const { data, errors } = await query({ query: GET_COIFFEURS });

    expect(errors).toBeUndefined();
    expect(Array.isArray(data.coiffeurs)).toBe(true);
    expect(data.coiffeurs.length).toBeGreaterThan(0);
    expect(data.coiffeurs[0].nom).toEqual("Test");
  });

  test("Add a new coiffeur", async () => {
    const ADD_COIFFEUR = gql`
      mutation AddCoiffeur(
        $nom: String!
        $prenom: String!
        $urlImage: String!
        $joursTravail: [DayInput!]
        $workingDays: [WorkingDayInput!]
      ) {
        addCoiffeur(
          nom: $nom
          prenom: $prenom
          urlImage: $urlImage
          joursTravail: $joursTravail
          workingDays: $workingDays
        ) {
          id
          nom
          prenom
          urlImage
        }
      }
    `;

    const coiffeurVars = {
      nom: "New",
      prenom: "Coiffeur",
      urlImage: "http://example.com/new.jpg",
      joursTravail: [
        {
          date: formatDateToYYYYMMDD(new Date()),
          slots: [
            {
              slotNumber: 1,
              name: "Client Test",
              phoneNumber: "123456789",
              email: "test@example.com",
            },
          ],
        },
      ],
      workingDays: [
        {
          dayOfWeek: "Lundi",
          morningSlots: [1, 2, 3],
          afternoonSlots: [4, 5, 6],
        },
      ],
    };
    const { data, errors } = await mutate({
      mutation: ADD_COIFFEUR,
      variables: coiffeurVars,
    });

    expect(errors).toBeUndefined();
    expect(data.addCoiffeur.nom).toEqual(coiffeurVars.nom);
    expect(data.addCoiffeur.prenom).toEqual(coiffeurVars.prenom);

    const coiffeur = await Coiffeur.findOne({ nom: coiffeurVars.nom });
    expect(coiffeur).toBeTruthy();
    expect(coiffeur.prenom).toEqual(coiffeurVars.prenom);
  });

  // 2. Book Slots
  // Test booking slots for a coiffeur, ensuring that the slots are correctly added to the `joursTravail` array.

  test("Book slots for a coiffeur", async () => {
    const BOOK_SLOTS = gql`
      mutation BookSlots(
        $coiffeurId: ID!
        $date: String!
        $slots: [SlotInput!]!
      ) {
        bookSlots(coiffeurId: $coiffeurId, date: $date, slots: $slots) {
          id
          joursTravail {
            date
            slots {
              slotNumber
              name
            }
          }
        }
      }
    `;

    const slotsVars = {
      coiffeurId: createdCoiffeur.id,
      date: formatDateToYYYYMMDD(new Date()),
      slots: [
        {
          slotNumber: 3,
          name: "New Client",
          phoneNumber: "1010101010",
          email: "newclient@example.com",
        },
      ],
    };

    const { data, errors } = await mutate({
      mutation: BOOK_SLOTS,
      variables: slotsVars,
    });

    expect(errors).toBeUndefined();
    expect(data.bookSlots.joursTravail[0].slots).toContainEqual(
      expect.objectContaining({
        slotNumber: 3,
        name: "New Client",
      })
    );
  });

  //3. Cancel Reservation
  // Test the cancellation of a reservation, verifying the slot is correctly removed from the `joursTravail` array.
  test("Cancel a reservation", async () => {
    // Choose a date that exactly matches one of the dates set up in beforeAll
    const cancellationDate = formatDateToYYYYMMDD(new Date());
    // const cancellationDate = "2024-03-20";
    const dayForCancellation = createdCoiffeur.joursTravail.find((day) =>
      day.date.toISOString().startsWith(cancellationDate)
    );

    if (!dayForCancellation) {
      throw new Error(
        `Test setup error: No jourTravail entry found for date ${cancellationDate}`
      );
    }

    const slotToCancel = dayForCancellation.slots.find(
      (slot) => slot.email === "client@example.com"
    );
    if (!slotToCancel) {
      throw new Error(
        "Test setup error: No slot found with the specified email for cancellation"
      );
    }

    const CANCEL_RESERVATION = gql`
      mutation CancelReservation(
        $coiffeurId: ID!
        $date: String!
        $reservationId: ID!
        $email: String!
      ) {
        cancelReservation(
          coiffeurId: $coiffeurId
          date: $date
          reservationId: $reservationId
          email: $email
        ) {
          id
          joursTravail {
            date
            slots {
              slotNumber
              name
              reservationId
              email
            }
          }
        }
      }
    `;

    const cancelVars = {
      //   coiffeurId: createdCoiffeur.id.toString(),
      coiffeurId: createdCoiffeur.id,
      date: cancellationDate,
      reservationId: slotToCancel.reservationId,
      email: slotToCancel.email,
    };

    const { data, errors } = await mutate({
      mutation: CANCEL_RESERVATION,
      variables: cancelVars,
    });

    expect(errors).toBeUndefined();
    expect(
      data.cancelReservation.joursTravail.some(
        (day) =>
          day.date &&
          day.slots.every(
            (slot) => slot.reservationId !== cancelVars.reservationId
          )
      )
    ).toBe(true);
  });

  test("Attempt to override an existing slot", async () => {
    const dateForBooking = formatDateToYYYYMMDD(new Date());

    //existing slot in createdCoiffeur
    const slotToOverride = {
      slotNumber: 2,
      name: "Client Name",
      phoneNumber: "123456789",
      email: "client@example.com",
    };

    const BOOK_SLOTS = gql`
      mutation BookSlots(
        $coiffeurId: ID!
        $date: String!
        $slots: [SlotInput!]!
      ) {
        bookSlots(coiffeurId: $coiffeurId, date: $date, slots: $slots) {
          id
          joursTravail {
            date
            slots {
              slotNumber
              name
              phoneNumber
              email
            }
          }
        }
      }
    `;

    const bookingVars = {
      coiffeurId: createdCoiffeur.id,
      date: dateForBooking,
      slots: [slotToOverride],
    };

    const { data, errors } = await mutate({
      mutation: BOOK_SLOTS,
      variables: bookingVars,
    });

    // Expecting an error because the slot is already booked
    expect(errors).toBeDefined();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("already booked.");
    // option., expect(errors[0].message).toContain("Slot number 1 is already booked.");
  });

  test("Attempt to book a slot with missing values", async () => {
    const BOOK_SLOTS = gql`
      mutation BookSlots(
        $coiffeurId: ID!
        $date: String!
        $slots: [SlotInput!]!
      ) {
        bookSlots(coiffeurId: $coiffeurId, date: $date, slots: $slots) {
          id
          joursTravail {
            date
            slots {
              slotNumber
              name
            }
          }
        }
      }
    `;

    const bookingVars = {
      // coiffeurId and date are intentionally omitted to test missing values
      slots: [
        {
          slotNumber: 1,
          name: "Test Missing Values",
          // phoneNumber and email are missing
        },
      ],
    };

    const { errors } = await mutate({
      mutation: BOOK_SLOTS,
      variables: bookingVars,
    });

    expect(errors).toBeDefined();
  });
  test("Attempt to cancel a reservation with missing values", async () => {
    const CANCEL_RESERVATION = gql`
      mutation CancelReservation(
        $coiffeurId: ID!
        $date: String!
        $reservationId: ID!
        $email: String!
      ) {
        cancelReservation(
          coiffeurId: $coiffeurId
          date: $date
          reservationId: $reservationId
          email: $email
        ) {
          id
        }
      }
    `;

    // Missing coiffeurId, date, and email
    const cancelVars = {
      reservationId: "some-random-id",
    };

    const { errors } = await mutate({
      mutation: CANCEL_RESERVATION,
      variables: cancelVars,
    });

    expect(errors).toBeDefined();
  });
  test("Attempt to create a coiffeur with missing values", async () => {
    const ADD_COIFFEUR = gql`
      mutation AddCoiffeur(
        $nom: String!
        $prenom: String!
        $urlImage: String!
      ) {
        addCoiffeur(nom: $nom, prenom: $prenom, urlImage: $urlImage) {
          id
          nom
          prenom
          urlImage
        }
      }
    `;

    // Missing prenom and urlImage
    const coiffeurVars = {
      nom: "Incomplete Coiffeur",
    };

    const { errors } = await mutate({
      mutation: ADD_COIFFEUR,
      variables: coiffeurVars,
    });

    expect(errors).toBeDefined();
  });
  test("Attempt to update a coiffeur with missing values", async () => {
    const UPDATE_COIFFEUR = gql`
      mutation UpdateCoiffeur(
        $id: ID!
        $nom: String!
        $prenom: String!
        $urlImage: String!
      ) {
        updateCoiffeur(
          id: $id
          nom: $nom
          prenom: $prenom
          urlImage: $urlImage
        ) {
          id
          nom
          prenom
          urlImage
        }
      }
    `;

    // Assuming you have a coiffeur's id to update
    const coiffeurUpdateVars = {
      id: "some-coiffeur-id",
      // Missing nom, prenom, and urlImage
    };

    const { errors } = await mutate({
      mutation: UPDATE_COIFFEUR,
      variables: coiffeurUpdateVars,
    });

    expect(errors).toBeDefined();
  });

  //  Invalid Date Format for Booking and Cancellation
  // Booking with Invalid Date Format
  test("Book slot with invalid date format", async () => {
    const BOOK_SLOTS = gql`
      mutation BookSlots(
        $coiffeurId: ID!
        $date: String!
        $slots: [SlotInput!]!
      ) {
        bookSlots(coiffeurId: $coiffeurId, date: $date, slots: $slots) {
          id
          joursTravail {
            date
            slots {
              slotNumber
              name
            }
          }
        }
      }
    `;

    const bookingVars = {
      coiffeurId: createdCoiffeur.id,
      date: "invalid-date-format",
      slots: [
        {
          slotNumber: 3,
          name: "New Client",
          phoneNumber: "1010101010",
          email: "newclient@example.com",
        },
      ],
    };

    const { errors } = await mutate({
      mutation: BOOK_SLOTS,
      variables: bookingVars,
    });
    expect(errors).toBeDefined();
    expect(errors[0].message).toContain("Invalid date format");
  });
  //   Cancellation with Invalid Date Format
  test("Cancel reservation with invalid date format", async () => {
    const CANCEL_RESERVATION = gql`
      mutation CancelReservation(
        $coiffeurId: ID!
        $date: String!
        $reservationId: ID!
        $email: String!
      ) {
        cancelReservation(
          coiffeurId: $coiffeurId
          date: $date
          reservationId: $reservationId
          email: $email
        ) {
          id
        }
      }
    `;

    const cancelVars = {
      coiffeurId: createdCoiffeur.id,
      date: "invalid-date",
      reservationId: "some-reservation-id",
      email: "email@example.com",
    };

    const { errors } = await mutate({
      mutation: CANCEL_RESERVATION,
      variables: cancelVars,
    });
    expect(errors).toBeDefined();
    expect(errors[0].message).toContain("Failed to cancel reservation");
  });
  //   Booking a Slot Without Mandatory Information
  //   Missing coiffeurId
  test("Book slot without coiffeurId", async () => {
    const BOOK_SLOTS = gql`
      mutation BookSlots(
        $coiffeurId: ID!
        $date: String!
        $slots: [SlotInput!]!
      ) {
        bookSlots(coiffeurId: $coiffeurId, date: $date, slots: $slots) {
          id
          joursTravail {
            date
            slots {
              slotNumber
              name
            }
          }
        }
      }
    `;
    const bookingVars = {
      date: formatDateToYYYYMMDD(new Date()),
      slots: [
        {
          slotNumber: 1,
          name: "Test Client",
          phoneNumber: "123456789",
          email: "testclient@example.com",
        },
      ],
    };

    const { errors } = await mutate({
      mutation: BOOK_SLOTS,
      variables: bookingVars,
    });
    expect(errors).toBeDefined();
    expect(errors[0].message).toContain("was not provided");
  });
});
