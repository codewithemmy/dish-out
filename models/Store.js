const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
  {
    storeType: {
      type: String,
      required: [true, "kindly provide store/restaurant name"],
      enum: [
        "Restaurant",
        "Covenience store",
        "Supermarket",
        "Speciality food store",
        "Retail",
        "Florist",
        "Off licence",
      ],
      default: "Restaurant",
    },
    numberOfLocation: { type: String },
    cuisineType: {
      type: String,
      required: [true, "kind choose your cuisine type"],
    },
    StoreOwner: {
      type: mongoose.Types.ObjectId,
      ref: "Sellar",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", StoreSchema);
