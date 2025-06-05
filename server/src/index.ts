import express from "express";
import files from "./routes/files";
import event from "./routes/event";
import path from "path";
import cors from "cors"; //TODO: delete this in production, only for development purposes

const app = express();
const port = "3000";

app.use(cors()) //TODO: delete this in production, only for development purposes

app.use("/files", files);
app.use('/event', event);

app.use('/images', express.static(
  path.resolve(__dirname, 'buckets/images'),
  {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});