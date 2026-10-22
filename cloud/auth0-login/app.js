require("dotenv").config();
const express = require("express");
const { auth } = require("express-openid-connect");
const escape = require("escape-html");
const app = express();
app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL
}));
app.get("/", (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Page</title>
                <style>
                    body {
                        font-family: Arial;
                        background: #eaf0ff;
                        text-align: center;
                        padding-top: 100px;
                    }
                    .box {
                        background: white;
                        width: 300px;
                        margin: auto;
                        padding: 30px;
                        border-radius: 12px;
                    }
                    a {
                        display: inline-block;
                        background: #405de6;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                    }
                </style>
            </head>
            <body>
                <div class="box">
                    <h2>User Login</h2>
                    <p>Login securely using Auth0</p>
                    <a href="/login">Login with Auth0</a>
                </div>
            </body>
            </html>
        `);
    }
    const name = escape(req.oidc.user.name || "User");
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Successful</title>
            <style>
                body {
                    font-family: Arial;
                    background: #eaf0ff;
                    text-align: center;
                    padding-top: 120px;
                }
                .box {
                    background: white;
                    width: 350px;
                    margin: auto;
                    padding: 30px;
                    border-radius: 12px;
                }
                h2 { color: green; }
                a {
                    display: inline-block;
                    background: #405de6;
                    color: white;
                    padding: 10px 25px;
                    text-decoration: none;
                    border-radius: 6px;
                }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Login Successful!</h2>
                <h3>Welcome, ${name}</h3>
                <p>You have logged in successfully using Auth0.</p>
                <a href="/logout">Logout</a>
            </div>
        </body>
        </html>
    `);
});
app.listen(process.env.PORT || 3000, () => {
    console.log("Open http://localhost:3000");
});

