const express = require("express");
const User = require("../models/User");

const router = express.Router();

/* ============================================================
   CREATE / SAVE USER
============================================================ */
router.post("/", async (req, res) => {
  try {
    const {
      firebaseUid,
      name,
      email,
      department,
      semester
    } = req.body;

    if (!firebaseUid || !name || !email) {
      return res.status(400).json({
        message: "firebaseUid, name and email are required"
      });
    }

    const existingUser = await User.findOne({
      firebaseUid
    });

    if (existingUser) {
      return res.status(200).json({
        message: "User already exists",
        user: existingUser
      });
    }

    const user = new User({
      firebaseUid,
      name,
      email,
      department: department || "",
      semester: semester || ""
    });

    await user.save();

    res.status(201).json({
      message: "User saved successfully",
      user
    });

  } catch (error) {
    console.error("Error saving user:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* ============================================================
   GET USER PROFILE
============================================================ */
router.get("/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.params.firebaseUid
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "User profile loaded successfully",
      user
    });

  } catch (error) {
    console.error("Error loading user profile:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* ============================================================
   UPDATE USER PROFILE
============================================================ */
router.put("/:firebaseUid", async (req, res) => {
  try {
    const {
      name,
      email,
      department,
      semester
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "name and email are required"
      });
    }

    const user = await User.findOneAndUpdate(
      {
        firebaseUid: req.params.firebaseUid
      },
      {
        name,
        email,
        department: department || "",
        semester: semester || ""
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "User profile updated successfully",
      user
    });

  } catch (error) {
    console.error("Error updating user:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;