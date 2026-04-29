// env MUST be first — populates process.env before any other module reads it
import './env';
import express from "express";
import rateLimit from "express-rate-limit";
import { router as files } from "./routes/files";
import { router as sse } from "./routes/sse";
import events from "./routes/event";
import users from "./routes/user";
import challenges from "./routes/challenge";
import path from "path";
import cors from "cors";

const app = express();
const port = process.env.PORT || "3000";

if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: [
      "https://wedding.unaividal.com",
      "https://backend.unaividal.com",
      "https://unaividal.github.io"
    ],
    credentials: true
  }));
} else {
  app.use(cors());
}

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many upload requests, please try again in a minute." },
});

app.use(express.json());
app.use("/files/upload", uploadLimiter);

app.use("/files", files);
app.use('/events', sse);
app.use('/event', events);
app.use('/user', users)
app.use('/challenge', challenges)

app.use('/images', express.static(path.resolve(__dirname, 'buckets/images')));

app.listen(port);
