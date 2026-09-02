import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

function compressionMiddleware() {
  return compression({
    threshold: 1024,
    filter: (req, res) => {
      // Never compress SSE — buffering breaks the live event feed.
      if (res.getHeader("Content-Type") === "text/event-stream") return false;
      if (req.headers["accept"] === "text/event-stream") return false;
      return compression.filter(req, res);
    },
  });
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { ok: false, error: "Too many attempts. Try again in 15 minutes." },
});

export const ingestLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: "Ingest rate limit exceeded." },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
});

export function applySecurity(app) {
  // Render/Railway sit behind a proxy. Without this every request looks like it
  // comes from one IP and the limiters throttle all users together.
  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // three.js reads pixel data from canvases; strict COEP breaks WebGL textures.
    crossOriginEmbedderPolicy: false,
  }));

  app.use(compressionMiddleware());
  app.use("/api", apiLimiter);
  return app;
}
