import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
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

// pagination => infinite scroll
router.get("/", protectRoute, async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query; // default to page 1 and limit 5
    const skip = (page - 1) * limit;

    const books = await Book.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // sort by most recent
      .skip(skip)
      .limit(limit) // limit to 10 books per request
      .populate("user", "username profileImage"); // populate user details
    res.send({
      books,
      currentPage: parseInt(page),
      totalBooks: await Book.countDocuments({ user: req.user._id }),
      totalPages: Math.ceil(
        (await Book.countDocuments({ user: req.user._id })) / limit
      ),
    });
  } catch (error) {
    console.log("Error fetching books:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this book" });
    }
    // delete image from cloudinary
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0]; // Extract public ID from URL
        await cloudinary.uploader.destroy(publicId);
        console.log("Image deleted from cloudinary successfully");
      } catch (error) {
        console.log("Error deleting image from cloudinary:", error);
        return res.status(500).json({ message: "Failed to delete image" });
      }
    }
    // delete book from database
    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error deleting book:", error);
    res.status(500).json({ message: error.message });
  }
});

// get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // sort by most recent
      .populate("user", "username profileImage"); // populate user details
    res.status(200).json(books);
  } catch (error) {
    console.log("Error fetching user books:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
