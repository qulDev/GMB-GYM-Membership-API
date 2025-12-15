import express, { Express } from "express";
const app: Express = express();
import { _PORT } from "./secret";
import rootRoutes from "./routes";

// port
const port = _PORT;

// Express setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


//routes
app.use("/api", rootRoutes);

//server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
