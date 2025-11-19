import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import users from "../users.js"; 

const app = express();
const PORT = 3002;

app.use(cors({ 
    origin: "http://localhost:5175" 
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log("Request received at:", req.url);
  next();
});

app.get("/", (req, res) => {
  res.send(users.data);
});

app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const user = users.data.find((u) => u.id === parseInt(id));
  if (user) res.send(user);
  else res.status(404).send({ message: "User not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});