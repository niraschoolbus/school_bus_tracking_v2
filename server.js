require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"],
    }
});
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";
const PORT = process.env.PORT || 4000;
//Test Route 
app.get('/test', (req, res) => {
    res.send('Backend is working!');
});
app.listen(PORT,  () => {
    console.log(`Server running on port ${PORT}`);
});

// Middleware
app.use(cors({ origin: ["http://127.0.0.1:5500", "http://192.168.0.102:5500"], //Allow request from your frontend
method: ['GET', 'POST'], //Allow specific methods
credentials: true 
}));
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Farhiya1210#",
    database: "school_bus_tracking_v2",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1); // Stop server if DB connection fails
    }
    console.log(" Connected to MySQL");
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ error: "No token provided" });

    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Unauthorized" });
        req.user = decoded;
        next();
    });
};

// *USER AUTHENTICATION ROUTES*

// User Registration (Sign Up)
app.post("/api/signup", async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }
    // Validate role
    const allowedRoles = ["admin", "driver", "parent"];
    if (!allowedRoles.includes(role))
    {
        return res.status(400).json({ error: "Invalid role specified" });
    }

    try {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert user into the database
        db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)",
            [name, email, hashedPassword, role],
            (err) => {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.status(500).json({ error: "Database error", details: err.message });
                }
                res.status(201).json({ message: "User registered successfully!" });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Error hashing password" });
    }
});

// User Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ message: "Login successful", token,
            user: { id:user.id, name: user.name, email: user.email, role: user.role }
        });
    });
});

// *BUS TRACKING API ROUTES*

// Get All Buses (Public)
app.get("/api/buses", (req, res) => {
    db.query("SELECT bus_number, latitude, longitude FROM buses", (err, results) => {
        if (err) {
            console.error(" Error fetching buses:", err);
            return res.status(500).json({ error: "Database error", details: err.message });
        }
        res.json(results);
    });
});

// Get All Drivers (Protected)
app.get("/api/drivers", verifyToken, (req, res) => {
    db.query("SELECT * FROM drivers", (err, results) => {
        if (err) {
            console.error(" Error fetching drivers:", err);
            return res.status(500).json({ error: "Database error", details: err.message });
        }
        res.json(results);
    });
});

// Get All Routes (Protected)
app.get("/api/routes", verifyToken, (req, res) => {
    db.query("SELECT * FROM routes", (err, results) => {
        if (err) {
            console.error(" Error fetching routes:", err);
         return res.status(500).json({ error: "Database error", details: err.message  });
        }
        res.json(results);
    });
});

// *REAL-TIME BUS TRACKING WITH WEBSOCKETS*
io.on("connection", (socket) => {
    console.log(" New client connected");

    const sendBusUpdates = () => {
        db.query("SELECT bus_number, latitude, longitude FROM buses", (err, results) => {
            if (err) {
                console.error(" Error fetching real-time bus locations:", err);
                return;
            }
            console.log("Fetched bus locations:", results); //Log fetched data
                io.emit("busLocation", results);
        });
    };

    // Send bus updates every 5 seconds
    const interval = setInterval(sendBusUpdates, 5000);

    socket.on("disconnect", () => {
        console.log(" Client disconnected");
        clearInterval(interval);
    });
});
app.get("/", (req, res) => {
    res.send("Server is running!");
});

// *START SERVER*
server.listen(PORT, () => {
    console.log(`Server running on port${PORT}`);
});