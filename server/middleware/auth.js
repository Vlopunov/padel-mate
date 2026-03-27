const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production!");
}
const SECRET = JWT_SECRET || "dev-secret-unsafe";

function validateTelegramInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.BOT_TOKEN || "")
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, telegramId: user.telegramId.toString() },
    SECRET,
    { expiresIn: "30d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    req.telegramId = decoded.telegramId;
    next();
  } catch {
    return res.status(401).json({ error: "Недействительный токен" });
  }
}

function validateMaxInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const maxToken = process.env.MAX_BOT_TOKEN || "";
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(maxToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}

module.exports = { validateTelegramInitData, validateMaxInitData, generateToken, authMiddleware, SECRET };
