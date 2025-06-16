import express from "express";
import files from "./routes/files";
import events from "./routes/event";
import users from "./routes/user";
import challenges from "./routes/challenge";
import path from "path";
import cors from "cors"; //TODO: delete this in production, only for development purposes
import 'dotenv/config'

const app = express();
const port = "3000";

if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: "https://wedding.unaividal.com"
  }));
} else {
  app.use(cors()); //TODO: delete this in production, only for development purposes
}

app.use("/files", files);
app.use('/event', events);
app.use('/user', users)
app.use('/challenge', challenges)

app.use('/images', express.static(path.resolve(__dirname, 'buckets/images')));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});