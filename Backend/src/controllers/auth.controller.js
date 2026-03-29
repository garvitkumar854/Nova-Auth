const config = require("../config/config");

// Models
const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const otpModel = require("../models/otp.model");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Utils
const { sendOTPEmail, sendEmailVerifiedEmail } = require("../services/email.service");
const { generateOTP } = require("../utils/otpGenerator");
const { parseUserAgent } = require("../utils/userAgentParser");

const USERNAME_REGEX = /^[a-z0-9_]{3,16}$/;
const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;

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
        const normalizedFullName = String(fullName || "").trim();
        const normalizedUsername = String(username || "")
            .toLowerCase()
            .trim();
        const normalizedEmail = String(email || "")
            .toLowerCase()
            .trim();

        // Process 2: basic input validation.
        if (!normalizedFullName || !password || !normalizedUsername || !normalizedEmail) {
            return res.status(400).json({
                message: "fullName, username, email, and password are required",
            });
        }

        if (normalizedFullName.length < 2 || normalizedFullName.length > 60) {
            return res.status(400).json({
                message: "Full name must be between 2 and 60 characters",
            });
        }

        if (!USERNAME_REGEX.test(normalizedUsername)) {
            return res.status(400).json({
                message: "Username must be 3-16 characters and contain only letters, numbers, or _",
            });
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
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
            fullName: normalizedFullName,
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
        try {
            await sendOTPEmail(normalizedEmail, otp);
        } catch (emailError) {
            await otpModel.deleteMany({ user: newUser._id });
            await userModel.deleteOne({ _id: newUser._id });

            console.error('OTP email send failed. Rolled back user registration:', emailError);
            return res.status(500).json({
                message: 'Failed to send OTP email. Please try again.',
            });
        }

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

        if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        if (normalizedUsername && !USERNAME_REGEX.test(normalizedUsername)) {
            return res.status(400).json({
                message: "Username must be 3-16 characters and contain only letters, numbers, or _",
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
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                verified: user.isVerified,
            },
        });
    } catch (error) {
        console.error("Error in refresh token controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function getMe(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                verified: user.isVerified,
            },
        });
    } catch (error) {
        console.error("Error in get me controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function updateFullName(req, res) {
    try {
        const fullName = String(req.body.fullName || "").trim();

        if (!fullName) {
            return res.status(400).json({ message: "Full name is required" });
        }

        if (fullName.length < 2 || fullName.length > 60) {
            return res.status(400).json({
                message: "Full name must be between 2 and 60 characters",
            });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            { fullName },
            { new: true },
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Full name updated successfully",
            user: {
                id: updatedUser._id,
                fullName: updatedUser.fullName,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                verified: updatedUser.isVerified,
            },
        });
    } catch (error) {
        console.error("Error in update full name controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function updateUsername(req, res) {
    try {
        const username = String(req.body.username || "").toLowerCase().trim();

        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({
                message: "Username must be 3-16 characters and contain only letters, numbers, or _",
            });
        }

        const existingUser = await userModel.findOne({
            username,
            _id: { $ne: req.user.id },
        });

        if (existingUser) {
            return res.status(409).json({ message: "Username is already taken" });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            { username },
            { new: true },
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Username updated successfully",
            user: {
                id: updatedUser._id,
                fullName: updatedUser.fullName,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                verified: updatedUser.isVerified,
            },
        });
    } catch (error) {
        console.error("Error in update username controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function getSessions(req, res) {
    try {
        const sessions = await sessionModel
            .find({ userId: req.user.id })
            .sort({ updatedAt: -1 });

        const data = sessions.map((session) => {
            const isCurrent = String(session._id) === String(req.user.sessionId);
            const parsedUA = parseUserAgent(session.userAgent);

            return {
                id: session._id,
                browser: parsedUA.browser,
                os: parsedUA.os,
                device: parsedUA.device,
                ipAddress: session.ip || "Unknown",
                location: "Unknown",
                lastActive: session.updatedAt,
                status: session.revoked ? "logged_out" : (isCurrent ? "current" : "active"),
            };
        });

        return res.status(200).json({ sessions: data });
    } catch (error) {
        console.error("Error in get sessions controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function logoutSession(req, res) {
    try {
        const sessionId = String(req.body.sessionId || "").trim();

        if (!sessionId) {
            return res.status(400).json({ message: "sessionId is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({ message: "Invalid session id" });
        }

        const targetSession = await sessionModel.findOne({
            _id: sessionId,
            userId: req.user.id,
        });

        if (!targetSession) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (targetSession.revoked) {
            return res.status(400).json({ message: "Session already logged out" });
        }

        targetSession.revoked = true;
        await targetSession.save();

        const isCurrentSession = String(targetSession._id) === String(req.user.sessionId);

        if (isCurrentSession) {
            res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
        }

        return res.status(200).json({
            message: isCurrentSession
                ? "Current session logged out successfully"
                : "Session logged out successfully",
            session: {
                id: targetSession._id,
                current: isCurrentSession,
            },
        });
    } catch (error) {
        console.error("Error in logout session controller:", error);
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

        try {
            await sendEmailVerifiedEmail(user.email);
        } catch (emailError) {
            console.error('Email verified notification send failed:', emailError);
        }

        return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error in verify email controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function deleteAccount(req, res) {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required to delete account" });
        }

        // Process 1: get the user
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Process 2: verify password
        const isPasswordValid = await bcrypt.compare(String(password), user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Process 3: logout all sessions first (revoke them)
        await sessionModel.updateMany(
            { userId: user._id },
            { revoked: true }
        );

        // Process 4: delete all sessions
        await sessionModel.deleteMany({ userId: user._id });

        // Process 5: delete all OTP records
        await otpModel.deleteMany({ user: user._id });

        // Process 6: delete the user account
        await userModel.findByIdAndDelete(user._id);

        // Process 7: clear refresh token cookie
        res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error in delete account controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    register,
    login,
    logout,
    logoutAll,
    refreshToken,
    verifyEmail,
    getMe,
    updateFullName,
    updateUsername,
    getSessions,
    logoutSession,
    deleteAccount,
};