const dns = require("node:dns");

// Fix DNS lookup issues
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("node:path");

const app = express();
const PORT = process.env.PORT || 5001;

// Validate Dropbox configuration
if (!process.env.DROPBOX_ACCESS_TOKEN) {
    console.error("DROPBOX_ACCESS_TOKEN is missing from .env");
    process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Image upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            return callback(
                new Error("Please upload an image file.")
            );
        }
        callback(null, true);
    }
});

// 1. UPLOAD IMAGE TO DROPBOX
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "Please select an image."
            });
        }

        const safeName = path.basename(req.file.originalname)
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        const imagePath = `/uploads/${Date.now()}-${safeName}`;

        const response = await fetch(
            "https://content.dropboxapi.com/2/files/upload",
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
                    "Dropbox-API-Arg": JSON.stringify({
                        path: imagePath,
                        mode: "add",
                        autorename: true
                    }),
                    "Content-Type": "application/octet-stream"
                },
                body: req.file.buffer
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Dropbox upload error:", data);

            return res.status(502).json({
                error: data.error_summary || "Dropbox upload failed."
            });
        }

        res.json({
            message: "Image uploaded successfully!",
            imagePath: data.path_display
        });

    } catch (error) {
        console.error("Upload error:", error);

        res.status(500).json({
            error: error.message || "Image upload failed."
        });
    }
});

// 2. GET IMAGE FROM DROPBOX
async function getDropboxImage(imagePath) {
    const response = await fetch(
        "https://content.dropboxapi.com/2/files/download",
        {
            method: "POST",
            headers: {
                Authorization:
                    `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
                "Dropbox-API-Arg": JSON.stringify({
                    path: imagePath
                })
            }
        }
    );

    if (!response.ok) {
        const details = await response.text();
        console.error("Dropbox image error:", details);

        throw new Error("Could not retrieve image from Dropbox.");
    }

    return Buffer.from(await response.arrayBuffer());
}

// Validate Dropbox image paths
function isValidImagePath(imagePath) {
    return (
        typeof imagePath === "string" &&
        imagePath.startsWith("/uploads/") &&
        !imagePath.includes("..")
    );
}

// 3. DISPLAY IMAGE
app.get("/image", async (req, res) => {
    try {
        const imagePath = req.query.path;

        if (!isValidImagePath(imagePath)) {
            return res.status(400).send("Invalid image path.");
        }

        const imageBuffer = await getDropboxImage(imagePath);
        const extension = path.extname(imagePath).toLowerCase();

        const contentTypes = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".bmp": "image/bmp"
        };

        res.setHeader(
            "Content-Type",
            contentTypes[extension] || "application/octet-stream"
        );

        res.setHeader("Cache-Control", "no-store");
        res.send(imageBuffer);

    } catch (error) {
        console.error("Image display error:", error);

        res.status(502).send(error.message);
    }
});

// 4. DOWNLOAD IMAGE
app.get("/download", async (req, res) => {
    try {
        const imagePath = req.query.path;

        if (!isValidImagePath(imagePath)) {
            return res.status(400).send("Invalid image path.");
        }

        const imageBuffer = await getDropboxImage(imagePath);

        const fileName = path.basename(imagePath)
            .replace(/["\r\n]/g, "_");

        res.setHeader("Content-Type", "application/octet-stream");

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        res.send(imageBuffer);

    } catch (error) {
        console.error("Download error:", error);

        res.status(502).send(error.message);
    }
});

// 5. START SERVER
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
