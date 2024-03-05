const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const mongoose = require("mongoose");
const { PubSub } = require("apollo-server");
const pubsub = new PubSub();

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
    slotNumber: Int
  }

  type Day {
    date: String
    slots: [Int]
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

    updateSlots(coiffeurId: ID!, date: String!, slots: [Int]!): Coiffeur

    addDayWithSlots(coiffeurId: ID!, date: String!, slots: [Int]!): Coiffeur
  }

  type CoiffeurUpdatePayload {
    coiffeurId: ID!
    updateType: String!
    coiffeur: Coiffeur
  }
  type Subscription {
    coiffeurUpdated: CoiffeurUpdatePayload
  }

  input DayInput {
    date: String
    slots: [Int]
  }
`;

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
    updateSlots: async (_, { coiffeurId, date, slots }) => {
      try {
        const coiffeur = await Coiffeur.findById(coiffeurId);

        if (!coiffeur) {
          throw new Error("Coiffeur not found.");
        }

        const dayIndex = coiffeur.joursTravail.findIndex(
          (day) => day.date.toISOString().split("T")[0] === date
        );

        if (dayIndex > -1) {
          // Check for any slots that are already taken
          const existingSlots = coiffeur.joursTravail[dayIndex].slots;
          const slotsTaken = slots.some((slot) => existingSlots.includes(slot));

          if (slotsTaken) {
            throw new Error("One or more slots are already taken.");
          }

          // If none of the slots are taken, add the new slots
          coiffeur.joursTravail[dayIndex].slots.push(...slots);
        } else {
          // If the day doesn't exist, add a new day with the slots
          coiffeur.joursTravail.push({ date: new Date(date), slots });
        }

        await coiffeur.save();
        // return coiffeur;
        const updatedCoiffeur = coiffeur;

        // Publish the update
        pubsub.publish(COIFFEUR_UPDATED, {
          coiffeurUpdated: {
            coiffeurId,
            updateType: "SLOTS_UPDATED",
            coiffeur: updatedCoiffeur,
          },
        });

        return updatedCoiffeur;
      } catch (error) {
        console.error("Original error:", error);
        throw new Error("Failed to update slots.");
      }
    },

    addDayWithSlots: async (_, { coiffeurId, date, slots }) => {
      try {
        const coiffeur = await Coiffeur.findById(coiffeurId);

        if (!coiffeur) {
          throw new Error("Coiffeur not found.");
        }

        const existingDayIndex = coiffeur.joursTravail.findIndex(
          (day) => day.date.toISOString().split("T")[0] === date
        );

        if (existingDayIndex > -1) {
          // The day already exists, check if any new slots are already taken
          const existingSlots = coiffeur.joursTravail[existingDayIndex].slots;
          const slotsTaken = slots.some((slot) => existingSlots.includes(slot));

          if (slotsTaken) {
            throw new Error("One or more slots are already taken.");
          }

          // If none of the slots are taken, you could choose to merge the new slots here
          // coiffeur.joursTravail[existingDayIndex].slots.push(...slots);
          // Or decide to not update the slots since the day already exists
          throw new Error("Day already exists. Slots were not updated.");
        } else {
          // Add the new day with slots since it doesn't exist
          coiffeur.joursTravail.push({ date: new Date(date), slots });
        }

        await coiffeur.save();
        // return coiffeur;

        const updatedCoiffeur = coiffeur;

        // Publish the update
        pubsub.publish(COIFFEUR_UPDATED, {
          coiffeurUpdated: {
            coiffeurId,
            updateType: "DATE_ADDED",
            coiffeur: updatedCoiffeur,
          },
        });

        return updatedCoiffeur;
      } catch (error) {
        console.error("Original error:", error);
        throw new Error("Failed to add day with slots.");
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
}

// Call the function to start the server
startServer();
