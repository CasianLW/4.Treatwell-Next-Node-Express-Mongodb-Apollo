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
    unique: true,
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

// const daySchema = new mongoose.Schema({
//   date: Date, // Represents a specific day
//   slots: [
//     {
//       type: Number, // Represents a specific 15-minute slot within the day
//       default: [], // By default, all slots are available (empty array means all slots are open)
//     },
//   ],
// });
const daySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  slots: [slotSchema],
});

const CoiffeurSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  urlImage: String,
  joursTravail: [daySchema],
});

module.exports = mongoose.model("Coiffeur", CoiffeurSchema);
