const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y4ecbmx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const categoriesCollection = client.db("i-tech").collection("categories");
    const productsCollection = client.db("i-tech").collection("products");
    const bookingsCollection = client.db("i-tech").collection("bookings");
    const usersCollection = client.db("i-tech").collection("users");

    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoriesCollection.findOne(query);
      res.send(result);
    });
    app.get("/products", async (req, res) => {
      //   console.log(req.query.categoryName);
      let query = {};
      if (req.query.categoryName) {
        query = {
          categoryName: req.query.categoryName,
        };
      }
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // app.get("/products/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const booking = await productsCollection.findOne(query);
    //   res.send(booking);
    // });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      // const query = {
      //   appointmentDate: booking.appointmentDate,
      //   email: booking.email,
      //   treatment: booking.treatment,
      // };

      // const alreadyBooked = await bookingsCollection.find(query).toArray();

      // if (alreadyBooked.length) {
      //   const message = `You already have a booking on ${booking.appointmentDate}`;
      //   return res.send({ acknowledged: false, message });
      // }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        const query = { email: email };
        const singleUser = await usersCollection.findOne(query);

        if (singleUser.status !== "Admin") {
          // console.log(singleUser.status);
          return res.send(singleUser);
        }
      }
      // console.log("ok,,");
      const result = await usersCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/users/status", async (req, res) => {
      const email = req.query.email;
      if (email) {
        query = { email: email };
      }
      // console.log("ok,,");
      const singleUser = await usersCollection.findOne(query);
      console.log(singleUser.status);
      res.send(singleUser);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({ token });
    });
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "30d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("i-tech server is running");
});

app.listen(port, () => console.log(`i-tech running on ${port}`));
