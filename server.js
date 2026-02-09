import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import "dotenv/config"
import listEndpoints from "express-list-endpoints"
import thoughtData from "./data.json" with { type: "json" }

const mongoURL = process.env.MONGO_URL || "mongodb://localhost/thoughts"
mongoose.connect(mongoURL).catch(error => console.error("Mongo connection error:", error))

if (process.env.RESET_DB === "true") {
  const seedDatabase = async () => {
    await Thought.deleteMany()
    thoughtData.forEach((thought) => {
      new Thought(thought).save()
    })
  }

  console.log("seeding database")
  seedDatabase()
}

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())


const thoughtSchema = new mongoose.Schema({
  message: { type: String, required: true },
  hearts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

const Thought = mongoose.model('Thought', thoughtSchema)

// Start defining your routes here
app.get("/", async (req, res) => {
  // const endpoints = listEndpoints(app)
  try {
    const thoughts = await Thought.find()
    res.json(thoughts)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/thoughts", async (req, res) => {
  const { hearts } = req.query

  const dbQuery = {}
  if (hearts !== undefined) {
    const heartsNum = Number(hearts)
    if (!Number.isNaN(heartsNum)) {
      dbQuery.hearts = heartsNum
    }
  }

  try {
    const thoughts = await Thought.find(dbQuery)
    if (thoughts.length === 0) {
      return res.status(404).json({
        success: false,
        response: [],
        message: "No thoughts match the query"
      })
    }

    return res.status(200).json({
      success: true,
      response: thoughts,
      message: "Thoughts retrieved"
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      response: [],
      message: error
    })
  }
})

app.get("/thoughts/:id", async (req, res) => {
  const id = req.params.id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        response: null,
        message: "Invalid ID format",

      })
    }
    const thought = await Thought.findById(id)

    if (!thought) {
      return res.status(404).json({
        success: false,
        response: null,
        message: "Thought not found",
      })
    }

    return res.status(200).json({
      success: true,
      response: thought,
      message: "Success",
    })
  }

  catch (error) {
    return res.status(500).json({
      success: false,
      response: null,
      message: error,
    })
  }
}
)


app.post("/thoughts", async (req, res) => {
  const { message } = req.body;

  try {
    const newThought = await new Thought({ message }).save();

    if (!newThought) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Failed to post thought"
      });
    }

    res.status(201).json({
      success: true,
      data: newThought,
      message: "Thought created successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message || "Server error"
    });
  }
});

// Delete
app.delete("/thoughts/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const thought = await Thought.findById(id)

    if (!thought) {
      return res.status(404).json({
        success: false,
        response: [],
        message: "Thought not found"
      })
    }

    await Thought.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      response: id,
      message: "Thought deleted successfully"
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      response: null,
      message: error,
    })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
