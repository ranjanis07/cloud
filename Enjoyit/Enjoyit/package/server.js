
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 60 * 60 * 1000
        }
    })
);

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Open login page at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Product schema
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be a whole number"
            }
        }
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);


// Protect product APIs
function checkLogin(req, res, next) {
    if (req.session.loggedIn) {
        return next();
    }

    return res.status(401).json({
        message: "Please login first"
    });
}

// Login API

// Login API - accepts any non-empty username and password
app.post("/api/login", (req, res, next) => {
    const { username, password } = req.body;

    if (
        typeof username !== "string" ||
        !username.trim() ||
        typeof password !== "string" ||
        !password.trim()
    ) {
        return res.status(400).json({
            message: "Please enter a username and password"
        });
    }

    req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.loggedIn = true;

        req.session.save((saveError) => {
            if (saveError) return next(saveError);

            res.json({ message: "Login successful" });
        });
    });
});

// Check login status
app.get("/api/me", checkLogin, (req, res) => {
    res.json({ loggedIn: true });
});

// Logout API
app.post("/api/logout", (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err);

        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
    });
});

// Add product
app.post("/api/products", checkLogin, async (req, res) => {
    try {
        const { name, price, quantity } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            price === "" ||
            price == null ||
            quantity === "" ||
            quantity == null
        ) {
            return res.status(400).json({
                message: "Please fill in all fields"
            });
        }

        const numericPrice = Number(price);
        const numericQuantity = Number(quantity);

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0 ||
            !Number.isInteger(numericQuantity) ||
            numericQuantity < 0
        ) {
            return res.status(400).json({
                message: "Enter a valid price and whole-number quantity"
            });
        }

        const product = await Product.create({
            name: name.trim(),
            price: numericPrice,
            quantity: numericQuantity
        });

        res.status(201).json({
            message: "Product added successfully",
            product
        });
    } catch (error) {
        console.error("Add product error:", error.message);

        res.status(500).json({
            message: "Could not add product"
        });
    }
});

// View all products
app.get("/api/products", checkLogin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("View products error:", error.message);

        res.status(500).json({
            message: "Could not fetch products"
        });
    }
});

// Delete the first exact name match, ignoring letter case
app.delete("/api/products", checkLogin, async (req, res) => {
    try {
        const { name } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Enter a product name"
            });
        }

        const escapedName = name.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const product = await Product.findOneAndDelete({
            name: {
                $regex: "^" + escapedName + "$",
                $options: "i"
            }
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error.message);

        res.status(500).json({
            message: "Could not delete product"
        });
    }
});

// Handle unexpected errors
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    if (res.headersSent) return next(err);

    res.status(500).json({
        message: "Internal server error"
    });
});

// Connect to MongoDB before starting the server
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from your .env file");
    process.exit(1);
}

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });
