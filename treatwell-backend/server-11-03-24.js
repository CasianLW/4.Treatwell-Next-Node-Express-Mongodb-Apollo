const express = require("express");
const {
  ApolloServer,
  gql,
  UserInputError,
  ApolloError,
  ForbiddenError,
  // PubSub,
} = require("apollo-server-express");
const http = require("http");

const mongoose = require("mongoose");

// const { Server: WebSocketServer } = require("ws");
const { execute, subscribe } = require("graphql");

const COIFFEUR_UPDATED = "COIFFEUR_UPDATED";

const Coiffeur = require("./models/Coiffeur");
const { PubSub } = require("graphql-subscriptions");
const { SubscriptionServer } = require("subscriptions-transport-ws");

require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

const pubsub = new PubSub();
// const pubsub = PubSub;

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
    // bookSlots: async (_, { coiffeurId, date, slots }) => {
    //   try {
    //     const coiffeur = await Coiffeur.findById(coiffeurId);

    //     if (!coiffeur) {
    //       throw new ApolloError("Coiffeur not found.", "404");
    //     }
    //     if (slots.length === 0) {
    //       throw new UserInputError("At least one slot must be provided.");
    //     }

    //     let day = coiffeur.joursTravail.find(
    //       (day) => day.date.toISOString().split("T")[0] === date
    //     );

    //     if (!day) {
    //       day = { date: new Date(date), slots: [] };
    //       coiffeur.joursTravail.push(day);
    //     }

    //     const alreadyBookedSlots = slots.filter((slot) =>
    //       day.slots.some((s) => s.slotNumber === slot.slotNumber && s.name)
    //     );

    //     if (alreadyBookedSlots.length > 0) {
    //       const bookedSlotNumbers = alreadyBookedSlots
    //         .map((slot) => slot.slotNumber)
    //         .join(", ");
    //       throw new UserInputError(
    //         `Slot(s) ${bookedSlotNumbers} on ${date} are already booked.`
    //       );
    //     }

    //     slots.forEach((slot) => {
    //       const slotIndex = day.slots.findIndex(
    //         (s) => s.slotNumber === slot.slotNumber
    //       );

    //       if (slotIndex !== -1) {
    //         day.slots[slotIndex] = {
    //           ...slot,
    //           reservationId: new mongoose.Types.ObjectId().toString(),
    //         };
    //       } else {
    //         day.slots.push({
    //           ...slot,
    //           reservationId: new mongoose.Types.ObjectId().toString(),
    //         });
    //       }
    //     });

    //     await coiffeur.save();

    //     return coiffeur;
    //   } catch (error) {
    //     if (error instanceof ApolloError || error instanceof UserInputError) {
    //       throw error;
    //     } else {
    //       console.error("Error booking slots:", error);
    //       throw new ApolloError("Failed to book slots.", "400");
    //     }
    //   }
    // },

    bookSlots: async (_, { coiffeurId, date, slots }) => {
      try {
        if (slots.length === 0) {
          throw new UserInputError("Slots array cannot be empty.", {
            errorCode: 400,
          });
        }

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

        console.log(`Publishing update for coiffeurId: ${coiffeurId}`);
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

        const slotIndex = coiffeur.joursTravail[dayIndex].slots.findIndex(
          (s) => s.reservationId === reservationId && s.email === email
        );

        if (slotIndex === -1) {
          throw new Error(
            `No reservation found with the provided ID and email.`
          );
        }

        coiffeur.joursTravail[dayIndex].slots.splice(slotIndex, 1);

        console.log(`Publishing update for coiffeurId: ${coiffeurId}`);

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
        console.log("Client subscribed to coiffeur updates");
        return pubsub.asyncIterator([COIFFEUR_UPDATED]);
      },
    },
  },
};

// server start

(async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    playground: {
      subscriptionEndpoint: "subscriptions",
      // other GraphQL Playground options
    },
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  SubscriptionServer.create(
    { execute, subscribe, schema: apolloServer.schema },
    { server: httpServer, path: apolloServer.graphqlPath }
  );

  // const PORT = 4000;
  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}/graphql`)
  );
})();
//
//

// test not wrokig
//
//
// const app = express();
// const port = process.env.PORT || 4000;

// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// });

// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error(err));

// async function startServer() {
//   await server.start();
//   server.applyMiddleware({ app });

//   app.listen(port, () => {
//     console.log(
//       `Server ready at http://localhost:${port}${server.graphqlPath}`
//     );
//   });
// }

// startServer();

//
//
//
// old working with ws

// const httpServer = http.createServer(app);
// const wsServer = new WebSocketServer({ server: httpServer });

// async function startServer() {
//   await server.start();

//   server.applyMiddleware({ app });

//   httpServer.listen(port, () => {
//     console.log(
//       `Server running at http://localhost:${port}${server.graphqlPath}`
//     );
//   });

//   wsServer.on("connection", (ws) => {
//     console.log("WebSocket client connected");

//     ws.on("message", (message) => {
//       console.log(`Received message: ${message}`);
//     });

//     ws.on("close", () => {
//       console.log("WebSocket client disconnected");
//     });
//   });
// }

// startServer();
