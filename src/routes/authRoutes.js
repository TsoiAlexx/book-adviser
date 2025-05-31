import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"})
}

router.post('/register', async (req, res) => {
    try {
        console.log(req.body);
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({message: "All fields are required"});
        }
        if (password.length < 6) {
            return res.status(400).json({message: "Password should be at least 6 characters long"});
        }
        if (username.length < 3) {
            return res.status(400).json({message: "Username should be at least 3 characters long"});
        }
    //check if user is already exists
        const existingEmail = await User.findOne({email});
        if (existingEmail) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        const existingUsername = await User.findOne({username});
        if (existingUsername) {
            return res.status(409).json({message: "Invalid credentials"});
        }

        // get random avatar
        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

        const user = new User({
            email: email,
            password: password,
            username: username,
            profileImage: profileImage,
        })

        await user.save();

        const token = generateToken(user._id)

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profileImage: user.profileImage,
            }
        })

    } catch (error) {
        console.log("Error register route", error);
        return res.status(500).json({message: "Something went wrong"});
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({message: "All fields are required"});
        }

        // check if user exists
        const user = await User.findOne({email})
        if (!user) {
            return res.status(400).json({message: "Invalid email"});
        }

        //check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({message: "Invalid password"});
        }

        const token = generateToken((user._id))
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            }
        });
    } catch (error) {
        return res.status(500).json({message: "Login Error"});
    }
})

export default router;