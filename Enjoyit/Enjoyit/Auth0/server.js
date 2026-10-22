
const express = require("express");
const path = require("path");
const { authMiddleware, requiresAuth } = require("./auth0");

const app = express();

app.use(authMiddleware);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/profile", requiresAuth(), (req, res) => {
    const user = req.oidc.user;

    res.send(`
        <html>
        <head><title>User Profile</title></head>
        <body style="font-family:Arial;text-align:center;padding:40px">
            <h1>Authentication Successful!</h1>
            <p><b>Name:</b> ${user.name || "Not provided"}</p>
            <p><b>Email:</b> ${user.email || "Not provided"}</p>
            ${user.picture ? `<img src="${user.picture}" width="100" alt="Profile picture">` : ""}
            <br><br>
            <a href="/">Home</a> |
            <a href="/logout">Logout</a>
        </body>
        </html>
    `);
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
