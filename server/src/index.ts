import express from "express";
import files from "./routes/files";
import event from "./routes/event";
import cors from "cors";

const app = express();
const port = "3000";

app.use(cors())

app.use("/files", files);
app.use('/event', event);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});