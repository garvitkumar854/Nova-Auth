export const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 Minutes from now
    return { otp, expiry };
};