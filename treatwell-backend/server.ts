// import { ApolloError, UserInputError } from "apollo-server-express";

const express = require("express");
const {
  ApolloServer,
  gql,
  ApolloError,
  UserInputError,
} = require("apollo-server-express");
const { createServer } = require("http");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const mongoose = require("mongoose");
const { PubSub } = require("graphql-subscriptions");

require("dotenv").config();
const COIFFEUR_UPDATED = "COIFFEUR_UPDATED";

const debug = process.env.NEXT_PUBLIC_DEBUG === "true";

function formatDateToYYYYMMDD(date) {
  if (!(date instanceof Date)) {
    throw new TypeError("Provided input is not a Date object.");
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // +1 because getMonth() returns 0-11
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

const pubsub = new PubSub();
const Coiffeur = require("./models/Coiffeur"); // Ensure the model path is correct

// GraphQL Type Definitions
const typeDefs = gql`
  type Slot {
    slotNumber: Int!
    name: String
    phoneNumber: String
    email: String
    reservationId: ID!
  }

  type Day {
    date: String
    slots: [Slot]
  }
  type WorkingDay {
    dayOfWeek: String!
    morningSlots: [Int!]!
    afternoonSlots: [Int!]!
  }

  input SlotInput {
    slotNumber: Int!
    name: String
    phoneNumber: String
    email: String
  }

  input DayInput {
    date: String
    slots: [SlotInput]
  }

  input WorkingDayInput {
    dayOfWeek: String!
    morningSlots: [Int!]!
    afternoonSlots: [Int!]!
  }

  type Coiffeur {
    id: ID!
    nom: String
    prenom: String
    urlImage: String
    joursTravail: [Day]
    workingDays: [WorkingDay]
  }

  type Query {
    coiffeurs: [Coiffeur]
    coiffeur(id: ID!): Coiffeur
  }

  type Mutation {
    addCoiffeur(
      nom: String
      prenom: String
      urlImage: String
      joursTravail: [DayInput]
      workingDays: [WorkingDayInput]
    ): Coiffeur

    updateCoiffeur(
      id: ID!
      nom: String
      prenom: String
      urlImage: String
      joursTravail: [DayInput]
      workingDays: [WorkingDayInput]
    ): Coiffeur

    bookSlots(coiffeurId: ID!, date: String!, slots: [SlotInput!]!): Coiffeur
    cancelReservation(
      coiffeurId: ID!
      date: String!
      reservationId: ID!
      email: String!
    ): Coiffeur
  }

  type CoiffeurUpdatePayload {
    coiffeurId: ID!
    updateType: String!
    coiffeur: Coiffeur
  }

  type Subscription {
    coiffeurUpdated: CoiffeurUpdatePayload
  }
`;
const resolvers = {
  Query: {
    coiffeurs: async () => {
      return await Coiffeur.find({});
    },
    coiffeur: async (_, { id }) => {
      try {
        const coiffeur = await Coiffeur.findById(id);
        if (!coiffeur) {
          throw new Error("Coiffeur not found.");
        }
        return coiffeur;
      } catch (error) {
        console.error(error);
        throw new Error("Error fetching coiffeur.");
      }
    },
  },
  Mutation: {
    addCoiffeur: async (
      _,
      { nom, prenom, urlImage, joursTravail, workingDays }
    ) => {
      try {
        if (!Array.isArray(joursTravail)) {
          throw new Error("joursTravail must be an array");
        }

        const formattedJoursTravail = joursTravail.map((jour) => ({
          date: formatDateToYYYYMMDD(new Date(jour.date)),
          slots: jour.slots,
        }));

        const newCoiffeur = new Coiffeur({
          nom,
          prenom,
          urlImage,
          joursTravail: formattedJoursTravail,
          workingDays,
        });

        await newCoiffeur.save();
        return newCoiffeur;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to create a new coiffeur.");
      }
    },
    updateCoiffeur: async (
      _,
      { id, nom, prenom, urlImage, joursTravail, workingDays }
    ) => {
      try {
        const updateData = { nom, prenom, urlImage, joursTravail, workingDays };

        const updatedCoiffeur = await Coiffeur.findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        );

        if (!updatedCoiffeur) {
          throw new Error("Coiffeur not found.");
        }

        return updatedCoiffeur;
      } catch (error) {
        console.error(error);
        throw new Error("Error updating coiffeur.");
      }
    },

    bookSlots: async (_, { coiffeurId, date, slots }) => {
      try {
        if (!coiffeurId) throw new UserInputError("Missing Coiffeur ID.");
        if (slots.length === 0) {
          throw new UserInputError("Slots array cannot be empty.", {
            errorCode: 400,
          });
        }
        // Date Validation
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          isNaN(new Date(date).getTime())
        ) {
          throw new UserInputError(
            "Invalid date format. Please use YYYY-MM-DD."
          );
        }

        // Email Validation for each slot
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        slots.forEach((slot) => {
          if (!emailRegex.test(slot.email)) {
            throw new UserInputError(`Invalid email format: ${slot.email}`);
          }
        });

        const coiffeur = await Coiffeur.findById(coiffeurId);
        if (!coiffeur) {
          throw new ApolloError("Coiffeur not found.", "404");
        }

        const dateObj = new Date(date);
        let day = coiffeur.joursTravail.find(
          (d) =>
            d.date.toISOString().split("T")[0] ===
            dateObj.toISOString().split("T")[0]
        );

        if (!day) {
          // Day does not exist, so create it with slots
          day = {
            date: dateObj,
            slots: slots.map((slot) => ({
              ...slot,
              reservationId: new mongoose.Types.ObjectId().toString(),
            })),
          };
          coiffeur.joursTravail.push(day);
        } else {
          // Day exists, update or add new slots to the day
          slots.forEach((inputSlot) => {
            const existingSlotIndex = day.slots.findIndex(
              (s) => s.slotNumber === inputSlot.slotNumber
            );
            if (existingSlotIndex >= 0) {
              // Slot exists, update it if not already booked
              if (day.slots[existingSlotIndex].name) {
                throw new UserInputError(
                  `Slot number ${inputSlot.slotNumber} is already booked.`
                );
              }
              day.slots[existingSlotIndex] = {
                ...inputSlot,
                reservationId: day.slots[existingSlotIndex].reservationId,
              };
            } else {
              // Slot does not exist, add new slot
              day.slots.push({
                ...inputSlot,
                reservationId: new mongoose.Types.ObjectId().toString(),
              });
            }
          });
        }
        await coiffeur.save();

        debug && console.log(`Publishing update for coiffeurId: ${coiffeurId}`);
        // console.log(`Coiffeur object: ${coiffeur}`);
        // Publish the entire coiffeur object
        pubsub.publish(COIFFEUR_UPDATED, {
          coiffeurUpdated: {
            coiffeurId,
            updateType: "SLOTS_UPDATED", // Or any relevant update type
            coiffeur, // The entire updated coiffeur object
          },
        });

        return coiffeur;
      } catch (error) {
        console.error("Error booking slots:", error);
        if (error instanceof ApolloError || error instanceof UserInputError) {
          throw error;
        } else {
          throw new ApolloError(
            "An unexpected error occurred while booking slots.",
            "500"
          );
        }
      }
    },

    cancelReservation: async (
      _,
      { coiffeurId, date, reservationId, email }
    ) => {
      try {
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          isNaN(new Date(date).getTime())
        ) {
          throw new UserInputError(
            "Invalid date format. Please use YYYY-MM-DD."
          );
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new UserInputError(`Invalid email format: ${email}`);
        }
        const coiffeur = await Coiffeur.findOne({
          _id: coiffeurId,
          "joursTravail.date": formatDateToYYYYMMDD(new Date(date)),
          // "joursTravail.date": new Date(date),
        });

        if (!coiffeur) {
          throw new Error(
            `Coiffeur with ID ${coiffeurId} does not have work on the specified date.`
          );
        }

        const dayIndex = coiffeur.joursTravail.findIndex(
          (day) => day.date.toISOString().split("T")[0] === date
        );

        if (dayIndex === -1) {
          throw new Error(`No slots found for the specified date.`);
        }

        const slotIndex = coiffeur.joursTravail[dayIndex].slots.findIndex(
          (s) => s.reservationId === reservationId && s.email === email
        );

        if (slotIndex === -1) {
          throw new Error(
            `No reservation found with the provided ID and email.`
          );
        }

        coiffeur.joursTravail[dayIndex].slots.splice(slotIndex, 1);

        // console.log(`Publishing update for coiffeurId: ${coiffeurId}`);

        pubsub.publish(COIFFEUR_UPDATED, {
          coiffeurUpdated: {
            coiffeurId,
            updateType: "SLOT_CANCELED",
            coiffeur: coiffeur,
          },
        });
        await coiffeur.save();
        return coiffeur;
      } catch (error) {
        console.error("Error canceling reservation:", error);
        throw new Error("Failed to cancel reservation.");
      }
    },
  },

  Subscription: {
    coiffeurUpdated: {
      subscribe: () => {
        debug && console.log("Client subscribed to coiffeur updates");
        return pubsub.asyncIterator([COIFFEUR_UPDATED]);
      },
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

const apolloServer = new ApolloServer({
  schema,
  context: ({ req, res }) => ({ req, res, pubsub }),
});

// app.post("/graphql", (req, res) => {
//   res.json({ message: "GraphQL route reached" });
// });

const startServer = async () => {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: apolloServer.graphqlPath }
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(
      `Server is now running on http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer().catch((error) =>
    console.error("Error starting server:", error)
  );
}

module.exports = {
  app,
  startServer,
  typeDefs,
  resolvers,
  formatDateToYYYYMMDD,
};

// const startServer = async () => {
//   const apolloServer = new ApolloServer({
//     schema,
//     context: ({ req, res }) => ({ req, res, pubsub }),
//   });

//   await apolloServer.start();
//   apolloServer.applyMiddleware({ app });

//   SubscriptionServer.create(
//     { schema, execute, subscribe },
//     { server: httpServer, path: apolloServer.graphqlPath }
//   );

//   const PORT = process.env.PORT || 4000;
//   httpServer.listen(PORT, () => {
//     console.log(
//       `Server is now running on http://localhost:${PORT}${apolloServer.graphqlPath}`
//     );
//   });
// };

// startServer().catch((error) => console.error("Error starting server:", error));
