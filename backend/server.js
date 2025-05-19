require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");
const {
  initializeChatHistories,
  getChatHistory,
  saveChatHistory,
  listChatTokens,
} = require("./chatStorage");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (req, callback) => {
      callback(null, "*");
    },
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_CONFIG = {
  development: "gpt-3.5-turbo",
  production: "gpt-4",
};

const CURRENT_ENV =
  process.env.NODE_ENV === "production" ? "production" : "development";

initializeChatHistories();

const activeTokens = new Map();

const MAX_CONTEXT_LENGTH = 128000;
const RESPONSE_BUFFER = 2000;
const MAX_HISTORY_TOKENS = MAX_CONTEXT_LENGTH - RESPONSE_BUFFER;

function getRelevantHistory(history, maxTokens = MAX_HISTORY_TOKENS) {
  const recentMessages = history.slice(-5);

  if (history.length > 5) {
    const firstMessage = history[0];

    let totalTokens = recentMessages.reduce(
      (sum, msg) => sum + msg.content.length / 4,
      0
    );
    totalTokens += firstMessage.content.length / 4;

    const earlierMessages = [];
    for (let i = 1; i < history.length - 5; i++) {
      const msg = history[i];
      const msgTokens = msg.content.length / 4;
      if (totalTokens + msgTokens <= maxTokens) {
        earlierMessages.push(msg);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }

    return [firstMessage, ...earlierMessages, ...recentMessages];
  }

  return recentMessages;
}

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("setToken", async (token) => {
    const history = await getChatHistory(token);
    activeTokens.set(token, socket.id);
    socket.join(token);
    console.log(`Client joined room: ${token}`);

    // Send existing chat history to the client
    socket.emit("chatHistory", history);
  });

  socket.on("chatMessage", async (data) => {
    const { token, message } = data;
    const history = await getChatHistory(token);

    history.push({
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    });

    try {
      const relevantHistory = getRelevantHistory(history);
      const completion = await openai.chat.completions.create({
        model: MODEL_CONFIG[CURRENT_ENV],
        messages: [
          {
            role: "system",
            content:
              relevantHistory.length === 0
                ? "I am preparing an interview, and these are information of the interview."
                : "You are a professional interviewer and career coach. Provide insightful, detailed, and well-structured responses. Focus on giving comprehensive answers that demonstrate expertise and professionalism.",
          },
          ...relevantHistory,
        ],
      });

      const response = completion.choices[0].message.content;
      const assistantMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      history.push(assistantMessage);
      await saveChatHistory(token, history);

      io.to(token).emit("chatResponse", {
        message: response,
        timestamp: assistantMessage.timestamp,
      });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      io.to(token).emit("error", { message: "Error processing message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Clean up token mapping
    for (const [token, socketId] of activeTokens.entries()) {
      if (socketId === socket.id) {
        activeTokens.delete(token);
        break;
      }
    }
  });
});

// Endpoint to receive transcript from Python app
app.post("/submit", async (req, res) => {
  const { token, transcript, timestamp } = req.body;

  if (!token || !transcript) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const history = await getChatHistory(token);
  const promptMessage = {
    role: "user",
    content: transcript,
    timestamp: timestamp || new Date().toISOString(),
  };
  history.push(promptMessage);

  try {
    io.to(token).emit("chatPrompt", {
      message: promptMessage,
      timestamp: promptMessage.timestamp,
    });

    const relevantHistory = getRelevantHistory(history);
    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG[CURRENT_ENV],
      messages: [
        {
          role: "system",
          content:
            "This is chat history till now in this interview, make valid answer or next sentence, don't need any explanation, only few sentences of answer.",
        },
        ...relevantHistory,
      ],
    });

    const response = completion.choices[0].message.content;
    const assistantMessage = {
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
    };

    history.push(assistantMessage);
    await saveChatHistory(token, history);

    io.to(token).emit("chatResponse", {
      message: response,
      timestamp: assistantMessage.timestamp,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ error: "Error processing transcript" });
  }
});

// Endpoint to list all available chat tokens
app.get("/chats", async (req, res) => {
  try {
    const chats = await listChatTokens();
    res.json(chats);
  } catch (error) {
    console.error("Error listing chats:", error);
    res.status(500).json({ error: "Error listing chats" });
  }
});

// Endpoint to get chat history for a specific token
app.get("/chats/:token", async (req, res) => {
  try {
    const history = await getChatHistory(req.params.token);
    res.json(history);
  } catch (error) {
    console.error("Error getting chat history:", error);
    res.status(500).json({ error: "Error getting chat history" });
  }
});

app.post("/upload-chat", async (req, res) => {
  const { token, prompt, response, timestamp } = req.body;

  if (!token || !prompt || !response) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const history = await getChatHistory(token);

    history.push({
      role: "user",
      content: prompt,
      timestamp: timestamp || new Date().toISOString(),
    });

    history.push({
      role: "assistant",
      content: response,
      timestamp: timestamp || new Date().toISOString(),
    });

    await saveChatHistory(token, history);

    io.to(token).emit("chatHistory", history);

    res.json({
      success: true,
      timestamp: timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error uploading chat:", error);
    res.status(500).json({ error: "Error uploading chat" });
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
