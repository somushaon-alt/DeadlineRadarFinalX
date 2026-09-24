const express = require("express");
const Deadline = require("../models/Deadline");
const User = require("../models/User");

const router = express.Router();


// ============================================================
// GET ALL DEADLINES FOR ONE USER
// ============================================================
router.get("/:firebaseUid", async (req, res) => {
  try {
    const deadlines = await Deadline.find({
      firebaseUid: req.params.firebaseUid
    }).sort({ due: 1 });

    res.json(deadlines);

  } catch (error) {
    console.error("Error getting deadlines:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});


// ============================================================
// ADD DEADLINE
// ============================================================
router.post("/", async (req, res) => {
  try {

    console.log("========================================");
    console.log("NEW DEADLINE REQUEST RECEIVED");
    console.log("Request body:", req.body);
    console.log("========================================");


    const {
      firebaseUid,

      // User information from frontend
      userName,
      userEmail,

      // Deadline information
      title,
      course,
      type,
      description,
      due,
      priority,
      progress,
      completed
    } = req.body;


    // ========================================================
    // VALIDATE REQUIRED FIELDS
    // ========================================================
    if (!firebaseUid || !title || !due) {
      return res.status(400).json({
        message: "firebaseUid, title and due are required"
      });
    }


    // ========================================================
    // FIND USER IN MONGODB
    // ========================================================
    const user = await User.findOne({
      firebaseUid: firebaseUid
    });

    console.log("Firebase UID:", firebaseUid);
    console.log("User found:", user);


    // ========================================================
    // GET USER NAME AND EMAIL
    // ========================================================
    // First preference:
    // Use the information already stored in users collection.
    //
    // Second preference:
    // Use information sent by frontend.
    // ========================================================

    const finalUserName =
      user?.name ||
      userName ||
      "";

    const finalUserEmail =
      user?.email ||
      userEmail ||
      "";


    // ========================================================
    // CREATE DEADLINE
    // ========================================================
    const deadline = new Deadline({

      // Firebase user ID
      firebaseUid: firebaseUid,

      // User identification
      userName: finalUserName,
      userEmail: finalUserEmail,

      // Deadline information
      title: title,

      course: course || "",

      type: type || "Assignment",

      description: description || "",

      due: due,

      priority: priority || "Medium",

      progress: Number(progress ?? 0),

      completed: !!completed
    });


    // ========================================================
    // DEBUG
    // ========================================================
    console.log("User information saved with deadline:");
    console.log("Name:", finalUserName);
    console.log("Email:", finalUserEmail);

    console.log("Deadline before saving:");
    console.log(deadline);


    // ========================================================
    // SAVE TO MONGODB
    // ========================================================
    await deadline.save();


    // ========================================================
    // SUCCESS
    // ========================================================
    console.log("Deadline saved successfully:");
    console.log(deadline);

    console.log("========================================");


    res.status(201).json({
      message: "Deadline saved successfully",
      deadline: deadline
    });


  } catch (error) {

    console.error("========================================");
    console.error("ERROR SAVING DEADLINE:");
    console.error(error);
    console.error("========================================");

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});


// ============================================================
// UPDATE DEADLINE
// ============================================================
router.put("/:id", async (req, res) => {
  try {

    const {
      firebaseUid,
      ...updates
    } = req.body;


    const deadline = await Deadline.findOneAndUpdate(
      {
        _id: req.params.id,
        firebaseUid: firebaseUid
      },
      updates,
      {
        new: true,
        runValidators: true
      }
    );


    if (!deadline) {
      return res.status(404).json({
        message: "Deadline not found"
      });
    }


    res.json({
      message: "Deadline updated successfully",
      deadline: deadline
    });


  } catch (error) {

    console.error("Error updating deadline:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});


// ============================================================
// DELETE ALL DEADLINES FOR ONE USER
// ============================================================
router.delete("/user/:firebaseUid", async (req, res) => {
  try {

    const {
      firebaseUid
    } = req.params;


    if (!firebaseUid) {
      return res.status(400).json({
        message: "firebaseUid is required"
      });
    }


    const result = await Deadline.deleteMany({
      firebaseUid: firebaseUid
    });


    res.json({
      message: "All deadlines deleted successfully",
      deletedCount: result.deletedCount
    });


  } catch (error) {

    console.error("Error deleting all deadlines:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});


// ============================================================
// DELETE ONE DEADLINE
// ============================================================
router.delete("/:id", async (req, res) => {
  try {

    const {
      firebaseUid
    } = req.body;


    const deadline = await Deadline.findOneAndDelete({
      _id: req.params.id,
      firebaseUid: firebaseUid
    });


    if (!deadline) {
      return res.status(404).json({
        message: "Deadline not found"
      });
    }


    res.json({
      message: "Deadline deleted successfully"
    });


  } catch (error) {

    console.error("Error deleting deadline:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});


module.exports = router;