const config = require("../config/config");

// Models
const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const otpModel = require("../models/otp.model");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Utils
const { sendOTPEmail, sendEmailVerifiedEmail } = require("../services/email.service");
const { generateOTP } = require("../utils/otpGenerator");

// Shared cookie policy for refresh token operations.
// Keeping these options in one place ensures set/clear behavior stays consistent.
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

async function register(req, res) {
    try {
        // Process 1: read and normalize incoming registration data.
        const { fullName, username, email, password, role = "user" } = req.body;
        const normalizedUsername = String(username || "")
            .toLowerCase()
            .trim();
        const normalizedEmail = String(email || "")
            .toLowerCase()
            .trim();

        // Process 2: basic input validation.
        if (!fullName || !password || !normalizedUsername || !normalizedEmail) {
            return res.status(400).json({
                message: "fullName, username, email, and password are required",
            });
        }

        // Process 3: enforce password policy.
        if (String(password).length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters long" });
        }

        // Process 4: block duplicate username/email accounts.
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

        // Process 5: create user with hashed password.
        const newUser = await userModel.create({
            fullName,
            username: normalizedUsername,
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10),
            role,
        });

        // Process 6: generate short-lived OTP for email verification.
        const { otp, expiry } = generateOTP();

        // Process 7: store only hashed OTP so plain OTP is never persisted.
        await otpModel.create({
            user: newUser._id,
            email: normalizedEmail,
            otp: await bcrypt.hash(otp, 10),
            expiresAt: expiry,
        });

        // Process 8: send plain OTP to user email.
        await sendOTPEmail(normalizedEmail, otp);

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                verified: newUser.isVerified,
            },
        });
    } catch (error) {
        console.error("Error in register controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function login(req, res) {
    try {
        // Process 1: ensure server auth secret exists before token operations.
        if (!config.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        // Process 2: read and normalize login identity fields.
        const { username, email, password } = req.body;
        const normalizedEmail = String(email || "").toLowerCase().trim();
        const normalizedUsername = String(username || "").toLowerCase().trim();

        // Process 3: validate login payload.
        if ((!normalizedEmail && !normalizedUsername) || !password) {
            return res.status(400).json({
                message: "Either username or email and password are required",
            });
        }

        // Process 4: locate account by email or username.
        const user = await userModel.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
        });

        // Process 5: reject unknown users.
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Process 6: block login until email verification is completed.
        if (!user.isVerified) {
            return res
                .status(401)
                .json({
                    message:
                        "Please verify your email address before logging in, check your inbox",
                });
        }

        // Process 7: validate password hash.
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Process 8: create a session record for this device/request.
        const session = await sessionModel.create({
            userId: user._id,
            refreshTokenHash: "pending",
            ip: req.ip,
            userAgent: req.headers["user-agent"] || "Unknown",
        });

        // Process 9: create refresh token that references this session.
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

        // Process 10: persist hashed refresh token for secure comparison later.
        session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await session.save();

        // Process 11: issue short-lived access token for API calls.
        const accessToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                sessionId: session._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m",
            },
        );

        // Process 12: deliver refresh token via secure httpOnly cookie.
        res.cookie("refreshToken", refreshToken, {
            ...REFRESH_COOKIE_OPTIONS,
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
        // Process 1: read refresh token from cookie.
        const refreshToken = req.cookies.refreshToken;

        // Process 2: stop if refresh token is not present.
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token not found" });
        }

        // Process 3: decode token to identify user/session.
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        // Process 4: find the active session and revoke only that one.
        const session = await sessionModel.findOne({
            _id: decoded.sessionId,
            userId: decoded.id,
            revoked: false,
        });

        if (!session) {
            return res.status(400).json({ message: "User Already Logged Out" });
        }

        // Process 5: revoke session and clear refresh cookie.
        session.revoked = true;
        await session.save();

        res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

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
        // Process 1: read current refresh token.
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token not found" });
        }

        // Process 2: decode current user id.
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        // Process 3: revoke every active session for the user.
        await sessionModel.updateMany(
            { userId: decoded.id, revoked: false },
            { revoked: true },
        );

        // Process 4: clear cookie on current device.
        res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

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
        // Process 1: read refresh token from cookie.
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res
                .status(401)
                .json({ message: "Refresh token not found, please login again" });
        }

        // Process 2: decode token to get user/session ids.
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        // Process 3: make sure linked user still exists.
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Process 4: fetch active session for this token.
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

        // Process 5: compare plain token with stored hash.
        const isTokenValid = await bcrypt.compare(
            refreshToken,
            session.refreshTokenHash,
        );

        if (!isTokenValid) {
            return res
                .status(401)
                .json({ message: "Invalid refresh token, please login again" });
        }

        // Process 6: issue new access token.
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

        // Process 7: rotate refresh token so old one cannot be reused.
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

        // Process 8: store new refresh token hash.
        session.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
        await session.save();

        // Process 9: send refreshed cookie and access token response.
        res.cookie("refreshToken", newRefreshToken, {
            ...REFRESH_COOKIE_OPTIONS,
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

async function verifyEmail(req, res) {
    try {
        // Process 1: read verification payload.
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and otp are required" });
        }

        // Process 2: fetch user record.
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Process 3: read latest OTP entry for the user.
        const latestOtp = await otpModel.findOne({ user: user._id }).sort({ createdAt: -1 });

        if (!latestOtp) {
            return res.status(400).json({ message: "OTP not found" });
        }

        // Process 4: reject expired OTP codes.
        if (latestOtp.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // Process 5: compare provided OTP against hashed stored OTP.
        const isValidOtp = await bcrypt.compare(String(otp), latestOtp.otp);

        if (!isValidOtp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Process 6: mark account verified and clean OTP records.
        user.isVerified = true;
        await user.save();

        await otpModel.deleteMany({ user: user._id });

        await sendEmailVerifiedEmail(user.email);

        return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error in verify email controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = { register, login, logout, logoutAll, refreshToken, verifyEmail };