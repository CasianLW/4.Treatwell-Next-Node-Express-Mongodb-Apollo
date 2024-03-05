const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
  date: Date, // Represents a specific day
  slots: [
    {
      type: Number, // Represents a specific 15-minute slot within the day
      default: [], // By default, all slots are available (empty array means all slots are open)
    },
  ],
});

const CoiffeurSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  urlImage: String,
  joursTravail: [daySchema], // An array of 'day' objects
});

module.exports = mongoose.model("Coiffeur", CoiffeurSchema);
