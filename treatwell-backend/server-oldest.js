const express = require("express");
const {
  ApolloServer,
  gql,
  UserInputError,
  ApolloError,
  ForbiddenError,
  pubsub,
} = require("apollo-server-express");
const http = require("http");

const mongoose = require("mongoose");
// const { PubSub } = require("apollo-server");
// const { PubSub } = require("graphql-subscriptions");

// const pubsub = new PubSub();
// const pubsub = PubSub;

const { Server: WebSocketServer } = require("ws");

const COIFFEUR_UPDATED = "COIFFEUR_UPDATED";

// Define the Express app instance
const app = express();
const port = process.env.PORT || 4000; // Use the port from environment variables or default to 4000

// Import your Coiffeur model here
const Coiffeur = require("./models/Coiffeur");

require("dotenv").config();

// Connect to MongoDB here
mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Define your GraphQL schema (types and resolvers)
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

  type Coiffeur {
    id: ID!
    nom: String
    prenom: String
    urlImage: String
    joursTravail: [Day]
  }

  type Query {
    coiffeurs: [Coiffeur]
    coiffeur(id: ID!): Coiffeur
  }

  type Mutation {
    addCoiffeur(
      nom: String!
      prenom: String!
      urlImage: String
      joursTravail: [DayInput]
    ): Coiffeur

    updateCoiffeur(
      id: ID!
      nom: String
      prenom: String
      urlImage: String
      joursTravail: [DayInput]
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
// updateSlots(coiffeurId: ID!, date: String!, slots: [Int]!): Coiffeur
// addDayWithSlots(coiffeurId: ID!, date: String!, slots: [Int]!): Coiffeur

// Define your GraphQL resolvers to handle requests
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
    addCoiffeur: async (_, { nom, prenom, urlImage, joursTravail }) => {
      try {
        // Ensure joursTravail dates are properly formatted as Date objects
        const formattedJoursTravail = joursTravail.map((jour) => ({
          date: new Date(jour.date),
          slots: jour.slots,
        }));

        const newCoiffeur = new Coiffeur({
          nom,
          prenom,
          urlImage,
          joursTravail: formattedJoursTravail,
        });

        await newCoiffeur.save();
        return newCoiffeur;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to create a new coiffeur.");
      }
    },
    updateCoiffeur: async (_, { id, nom, prenom, urlImage, joursTravail }) => {
      try {
        const updateData = { nom, prenom, urlImage, joursTravail };

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
    // updateSlots: async (_, { coiffeurId, date, slots }) => {
    //   try {
    //     const coiffeur = await Coiffeur.findById(coiffeurId);

    //     if (!coiffeur) {
    //       throw new Error("Coiffeur not found.");
    //     }

    //     const dayIndex = coiffeur.joursTravail.findIndex(
    //       (day) => day.date.toISOString().split("T")[0] === date
    //     );

    //     if (dayIndex > -1) {
    //       // Check for any slots that are already taken
    //       const existingSlots = coiffeur.joursTravail[dayIndex].slots;
    //       const slotsTaken = slots.some((slot) => existingSlots.includes(slot));

    //       if (slotsTaken) {
    //         throw new Error("One or more slots are already taken.");
    //       }

    //       // If none of the slots are taken, add the new slots
    //       coiffeur.joursTravail[dayIndex].slots.push(...slots);
    //     } else {
    //       // If the day doesn't exist, add a new day with the slots
    //       coiffeur.joursTravail.push({ date: new Date(date), slots });
    //     }

    //     await coiffeur.save();
    //     // return coiffeur;
    //     const updatedCoiffeur = coiffeur;

    //     // Publish the update
    //     pubsub.publish(COIFFEUR_UPDATED, {
    //       coiffeurUpdated: {
    //         coiffeurId,
    //         updateType: "SLOTS_UPDATED",
    //         coiffeur: updatedCoiffeur,
    //       },
    //     });

    //     return updatedCoiffeur;
    //   } catch (error) {
    //     console.error("Original error:", error);
    //     throw new Error("Failed to update slots.");
    //   }
    // },

    // addDayWithSlots: async (_, { coiffeurId, date, slots }) => {
    //   try {
    //     const coiffeur = await Coiffeur.findById(coiffeurId);

    //     if (!coiffeur) {
    //       throw new Error("Coiffeur not found.");
    //     }

    //     const existingDayIndex = coiffeur.joursTravail.findIndex(
    //       (day) => day.date.toISOString().split("T")[0] === date
    //     );

    //     if (existingDayIndex > -1) {
    //       // The day already exists, check if any new slots are already taken
    //       const existingSlots = coiffeur.joursTravail[existingDayIndex].slots;
    //       const slotsTaken = slots.some((slot) => existingSlots.includes(slot));

    //       if (slotsTaken) {
    //         throw new Error("One or more slots are already taken.");
    //       }

    //       // If none of the slots are taken, you could choose to merge the new slots here
    //       // coiffeur.joursTravail[existingDayIndex].slots.push(...slots);
    //       // Or decide to not update the slots since the day already exists
    //       throw new Error("Day already exists. Slots were not updated.");
    //     } else {
    //       // Add the new day with slots since it doesn't exist
    //       coiffeur.joursTravail.push({ date: new Date(date), slots });
    //     }

    //     await coiffeur.save();
    //     // return coiffeur;

    //     const updatedCoiffeur = coiffeur;

    //     // Publish the update
    //     pubsub.publish(COIFFEUR_UPDATED, {
    //       coiffeurUpdated: {
    //         coiffeurId,
    //         updateType: "DATE_ADDED",
    //         coiffeur: updatedCoiffeur,
    //       },
    //     });

    //     return updatedCoiffeur;
    //   } catch (error) {
    //     console.error("Original error:", error);
    //     throw new Error("Failed to add day with slots.");
    //   }
    // },
    //
    //
    //
    // bookSlot: async (_, { coiffeurId, date, slot }) => {
    //   try {
    //     const coiffeur = await Coiffeur.findOne({
    //       _id: coiffeurId,
    //       "joursTravail.date": new Date(date),
    //     });

    //     if (!coiffeur) {
    //       // If the coiffeur or date doesn't exist, throw an error or handle accordingly
    //       throw new Error(
    //         `Coiffeur with ID ${coiffeurId} does not have work on the specified date.`
    //       );
    //     }

    //     const dayIndex = coiffeur.joursTravail.findIndex(
    //       (day) => day.date.toISOString().split("T")[0] === date
    //     );

    //     if (dayIndex === -1) {
    //       throw new Error(`No slots found for the specified date.`);
    //     }

    //     // Check if the slot is already booked
    //     const slotIndex = coiffeur.joursTravail[dayIndex].slots.findIndex(
    //       (s) => s.slotNumber === slot.slotNumber
    //     );

    //     if (
    //       slotIndex !== -1 &&
    //       coiffeur.joursTravail[dayIndex].slots[slotIndex].name
    //     ) {
    //       throw new Error(`Slot number ${slot.slotNumber} is already booked.`);
    //     }

    //     // Create a new booking with client details
    //     const booking = {
    //       ...slot,
    //       reservationId: new mongoose.Types.ObjectId().toString(), // Generate a unique reservation ID
    //     };

    //     if (slotIndex === -1) {
    //       // If slot is not in the array, push the new booking into slots array
    //       coiffeur.joursTravail[dayIndex].slots.push(booking);
    //     } else {
    //       // If slot exists without booking, update the slot with the new booking
    //       coiffeur.joursTravail[dayIndex].slots[slotIndex] = booking;
    //     }

    //     await coiffeur.save();

    //     // Publish the update
    //     pubsub.publish(COIFFEUR_UPDATED, {
    //       coiffeurUpdated: {
    //         coiffeurId,
    //         updateType: "SLOT_BOOKED",
    //         coiffeur: coiffeur,
    //       },
    //     });

    //     return coiffeur;
    //   } catch (error) {
    //     console.error("Error booking slot:", error);
    //     throw new Error("Failed to book slot.");
    //   }
    // },

    bookSlots: async (_, { coiffeurId, date, slots }) => {
      try {
        const coiffeur = await Coiffeur.findById(coiffeurId);

        if (!coiffeur) {
          // Coiffeur not found
          throw new ApolloError("Coiffeur not found.", "404");
        }

        let day = coiffeur.joursTravail.find(
          (day) => day.date.toISOString().split("T")[0] === date
        );

        if (!day) {
          // Day doesn't exist, add new day with slots
          day = { date: new Date(date), slots: [] };
          coiffeur.joursTravail.push(day);
        }

        // Check for already booked or existing slots
        const alreadyBookedSlots = slots.filter((slot) =>
          day.slots.some((s) => s.slotNumber === slot.slotNumber && s.name)
        );

        if (alreadyBookedSlots.length > 0) {
          // One or more slots are already booked
          const bookedSlotNumbers = alreadyBookedSlots
            .map((slot) => slot.slotNumber)
            .join(", ");
          throw new UserInputError(
            `Slot(s) ${bookedSlotNumbers} on ${date} are already booked.`
          );
        }

        // Book slots
        slots.forEach((slot) => {
          const slotIndex = day.slots.findIndex(
            (s) => s.slotNumber === slot.slotNumber
          );

          if (slotIndex !== -1) {
            // Update existing slot with booking info
            day.slots[slotIndex] = {
              ...slot,
              reservationId: new mongoose.Types.ObjectId().toString(),
            };
          } else {
            // Add new slot with booking info
            day.slots.push({
              ...slot,
              reservationId: new mongoose.Types.ObjectId().toString(),
            });
          }
        });

        await coiffeur.save();

        return coiffeur;
      } catch (error) {
        if (error instanceof ApolloError || error instanceof UserInputError) {
          // Re-throw known error instances directly
          throw error;
        } else {
          console.error("Error booking slots:", error);
          throw new ApolloError("Failed to book slots.", "400");
        }
      }
    },
    cancelReservation: async (
      _,
      { coiffeurId, date, reservationId, email }
    ) => {
      try {
        const coiffeur = await Coiffeur.findOne({
          _id: coiffeurId,
          "joursTravail.date": new Date(date),
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

        // Find the slot to cancel and check if the email matches
        const slotIndex = coiffeur.joursTravail[dayIndex].slots.findIndex(
          (s) => s.reservationId === reservationId && s.email === email
        );

        if (slotIndex === -1) {
          throw new Error(
            `No reservation found with the provided ID and email.`
          );
        }

        // Remove the slot booking
        coiffeur.joursTravail[dayIndex].slots.splice(slotIndex, 1);

        await coiffeur.save();

        // Publish the update
        pubsub.publish(COIFFEUR_UPDATED, {
          coiffeurUpdated: {
            coiffeurId,
            updateType: "SLOT_CANCELED",
            coiffeur: coiffeur,
          },
        });

        return coiffeur;
      } catch (error) {
        console.error("Error canceling reservation:", error);
        throw new Error("Failed to cancel reservation.");
      }
    },
  },

  Subscription: {
    coiffeurUpdated: {
      subscribe: () => pubsub.asyncIterator([COIFFEUR_UPDATED]),
    },
  },
};

// Create an instance of ApolloServer
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// const wsApp = express();
const wsServer = http.createServer(app);
const wss = new WebSocketServer({ wsServer });

apolloServer.applyMiddleware({ app });

// The function to start the server and apply middleware
async function startServer() {
  // Start the Apollo server
  await server.start();

  // Apply the Apollo server middleware to the Express application
  server.applyMiddleware({ app });

  // Start listening with the Express app

  app.listen(port, () => {
    console.log(
      `Server running at http://localhost:${port}${server.graphqlPath}`
    );
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    // Handle WebSocket messages
    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
      // Handle incoming messages from WebSocket clients
    });

    // Handle WebSocket closure
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
}

// Call the function to start the server
startServer();
