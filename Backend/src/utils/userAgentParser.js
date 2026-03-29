/**
 * Parse user agent string to extract browser, OS, and device type
 * @param {string} userAgent - The user agent string from request header
 * @returns {object} Object with browser, os, and device
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Unknown Device",
    };
  }

  const ua = String(userAgent).toLowerCase();
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = "Unknown Device";

  // Detect Browser
  if (ua.includes("chrome") && !ua.includes("chromium")) {
    browser = "Chrome";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("edge") || ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("opera") || ua.includes("opr/")) {
    browser = "Opera";
  } else if (ua.includes("trident")) {
    browser = "Internet Explorer";
  }

  // Detect OS
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac")) {
    os = ua.includes("iphone") || ua.includes("ipad") ? "iOS" : "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
  }

  // Detect Device Type
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    device = "Mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    device = "Tablet";
  } else {
    device = "Desktop";
  }

  return {
    browser,
    os,
    device,
  };
}

module.exports = { parseUserAgent };
