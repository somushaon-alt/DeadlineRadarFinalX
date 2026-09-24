const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema(
  {
    // Firebase ID of the user who created this deadline
    firebaseUid: {
      type: String,
      required: true,
      index: true
    },

    // User information
    userName: {
      type: String,
      default: ""
    },

    userEmail: {
      type: String,
      default: ""
    },

    // Deadline information
    title: {
      type: String,
      required: true
    },

    course: {
      type: String,
      default: ""
    },

    type: {
      type: String,
      default: "Assignment"
    },

    description: {
      type: String,
      default: ""
    },

    due: {
      type: Date,
      required: true
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Deadline = mongoose.model(
  "Deadline",
  deadlineSchema
);

module.exports = Deadline;