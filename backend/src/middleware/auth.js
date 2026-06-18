import jwt from "jsonwebtoken";

// Verifies the Bearer token and attaches the decoded user to req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restricts a route to responders (ambulance / first-responder accounts).
export function requireResponder(req, res, next) {
  if (req.user?.role !== "responder") {
    return res.status(403).json({ error: "Responder access required" });
  }
  next();
}
