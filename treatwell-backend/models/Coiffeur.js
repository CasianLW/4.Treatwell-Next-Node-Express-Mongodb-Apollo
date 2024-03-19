const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const slotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,
    required: true,
  },
  name: String,
  phoneNumber: String,
  email: String,
  reservationId: {
    type: String,
    default: function () {
      return uuidv4(); // Generates a universally unique identifier
    },
    // unique: true,
  },
  // reservationId: {
  //   type: String,
  //   default: function () {
  //     // This function generates a random string for the reservation ID
  //     // You can replace this logic with any ID generation logic you prefer
  //     return Math.random().toString(36).substr(2, 9);
  //   },
  //   unique: true, // Make sure the reservation ID is unique across all documents
  // },
});

const daySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    // unique: true,
  },
  slots: [slotSchema],
});

const CoiffeurSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  urlImage: String,
  joursTravail: [daySchema],
  workingDays: {
    type: [
      {
        dayOfWeek: {
          type: String, // ou Number si vous préférez représenter le jour par un nombre
          enum: [
            "Lundi",
            "Mardi",
            "Mercredi",
            "Jeudi",
            "Vendredi",
            "Samedi",
            "Dimanche",
          ], // Assurez-vous que seuls les jours de la semaine valides sont autorisés
        },
        morningSlots: {
          type: [Number], // Tableau de créneaux pour le matin
          default: Array.from({ length: 16 }, (_, i) => i + 1), // Par défaut à [1, 2, ..., 16]
        },
        afternoonSlots: {
          type: [Number], // Tableau de créneaux pour l'après-midi
          default: Array.from({ length: 16 }, (_, i) => i + 1), // Par défaut à [1, 2, ..., 16]
        },
      },
    ],
    default: () => {
      // Définit les jours de travail par défaut pour toute la semaine
      return [
        { dayOfWeek: "Lundi" },
        { dayOfWeek: "Mardi" },
        { dayOfWeek: "Mercredi" },
        { dayOfWeek: "Jeudi" },
        { dayOfWeek: "Vendredi" },
        { dayOfWeek: "Samedi" },
        { dayOfWeek: "Dimanche" },
      ];
    },
  },
});

module.exports = mongoose.model("Coiffeur", CoiffeurSchema);
