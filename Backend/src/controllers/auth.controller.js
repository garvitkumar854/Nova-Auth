const config = require("../config/config");
const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function register(req, res) {
    try {
        // Get Data from Request Body
        const { fullName, username, email, password, role = "user" } = req.body;
        // Normalize username and email to lowercase and trim whitespace
        const normalizedUsername = String(username || "")
            .toLowerCase()
            .trim();
        const normalizedEmail = String(email || "")
            .toLowerCase()
            .trim();

        // Check if any Data field is missing or not
        if (!fullName || !password || !normalizedUsername || !normalizedEmail) {
            return res.status(400).json({
                message: "fullName, username, email, and password are required",
            });
        }

        // Check password length must be > 8
        if (String(password).length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters long" });
        }

        // Check if User Already Exists
        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
        });

        if (isUserAlreadyExists) {
            return res
                .status(409)
                .json({
                    message: "User Already Exists with the Same Email or Username",
                });
        }

        // Create New User
        const newUser = await userModel.create({
            fullName,
            username: normalizedUsername,
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10),
            role,
        });

        /*Email
                    Verification 
                                Logic
                                    Comes here.. 
            */

        const accessToken = jwt.sign(
            {
                id: newUser._id,
                role: newUser.role,
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m",
            },
        );

        const refreshToken = jwt.sign(
            {
                id: newUser._id,
                role: newUser.role,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                accessToken,
            },
        });
    } catch (error) {
        console.error("Error in register controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function login(req, res) {
    try {
        // Get Data from Request Body
        const { username, email, password } = req.body;

        // Normalize email to lowercase and trim whitespace
        const normalizedEmail = String(email || "")
            .toLowerCase()
            .trim();
        const normalizedUsername = String(username || "")
            .toLowerCase()
            .trim();

        // Check if any Data field is missing or not
        if ((!normalizedEmail && !normalizedUsername) || !password) {
            return res.status(400).json({
                message: "Either username or email and password are required",
            });
        }

        // Find User by Email or Username
        const user = await userModel.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
        });

        // User not Exists
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check the Verification Status of the User
        if (!user.isVerified) {
            return res
                .status(401)
                .json({
                    message:
                        "Please verify your email address before logging in, check your inbox",
                });
        }

        // Check if the provided password matches the user's password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create new session of the user
        const session = await sessionModel.create({
            userId: user._id,
            refreshTokenHash: "pending",
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "Unknown",
        });

        // Generate Refresh Token with sessionId so logout can revoke the exact session.
        const refreshToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                sessionId: session._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await session.save();

        // Generate Access Token
        const accessToken = jwt.sign(
            {
                id: user._id,
                sessionId: session._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m",
            },
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error in login controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function logout(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        // Refresh Token not Exists
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token not found" });
        }

        // Decode the Refresh Token to get sessionId and userId
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        // Find the Session with the sessionId and userId from the decoded token and revoke it by setting revoked to true
        const session = await sessionModel.findOne({
            _id: decoded.sessionId,
            userId: decoded.id,
            revoked: false,
        });

        if (!session) {
            return res.status(400).json({ message: "User Already Logged Out" });
        }

        session.revoked = true;
        await session.save();

        res.clearCookie("refreshToken");

        return res.status(200).json({
            message: "Logout successfully",
            user: {
                id: decoded.id,
                role: decoded.role,
            },
            session: {
                id: decoded.sessionId,
            }
        });
    } catch (error) {
        console.log("Error in logout controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function logoutAll(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token not found" });
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        await sessionModel.updateMany(
            { userId: decoded.id, revoked: false },
            { revoked: true },
        );

        res.clearCookie("refreshToken");

        return res.status(200).json({
            message: "Logout from all devices successfully",
        });
    } catch (error) {
        console.log("Error in logout all controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function refreshToken(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res
                .status(401)
                .json({ message: "Refresh token not found, please login again" });
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the Session with the sessionId and userId from the decoded token and check if it's not revoked
        const session = await sessionModel.findOne({
            _id: decoded.sessionId,
            userId: decoded.id,
            revoked: false,
        });

        if (!session) {
            return res
                .status(401)
                .json({ message: "Invalid refresh token, please login again" });
        }

        const isTokenValid = await bcrypt.compare(
            refreshToken,
            session.refreshTokenHash,
        );

        if (!isTokenValid) {
            return res
                .status(401)
                .json({ message: "Invalid refresh token, please login again" });
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
                sessionId: session._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m",
            },
        );

        const newRefreshToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                sessionId: session._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        session.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
        await session.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Access token refreshed successfully",
            accessToken,
        });
    } catch (error) {
        console.error("Error in refresh token controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = { register, login, logout, logoutAll, refreshToken };
