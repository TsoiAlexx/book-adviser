import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied" });
    }
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find the user by ID
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found, authorization denied" });
    }
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.log("Error in auth middleware:", error.message);
    res.status(401).json({ message: "Invalid token, authorization denied" });
  }
};

export default protectRoute;
// This middleware checks for a valid JWT token in the Authorization header,
