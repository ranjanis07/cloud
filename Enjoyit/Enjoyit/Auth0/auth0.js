
require("dotenv").config();

const { auth, requiresAuth } = require("express-openid-connect");

const authConfig = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL
};

const authMiddleware = auth(authConfig);

module.exports = {
    authMiddleware,
    requiresAuth
};
