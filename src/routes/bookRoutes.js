import express from "express";
import cloudinary from "../lib/cloudinary";
import { Book } from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    // now after protectRoute middleware, req.user should be available
    const { title, author, caption, rating } = req.body;
    if (!title || !author || !caption || !rating) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // upload image to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;
    // save book to database

    const newBook = new Book({
      title,
      author,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id, // assuming req.user is set by authentication middleware
    });
    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    console.log("Error creating book:", error);
    res.status(500).json({ message: error.message });
  }
});
export default router;
