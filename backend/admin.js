const crypto = require('crypto');

// Admin credentials (change these!)
const ADMIN_USERNAME = '4PP3X';
const ADMIN_PASSWORD = '4PP3X#Admin2026!!';
const ADMIN_EMAIL = 'frankkarani280@iaa.ac.tz';

// Store active sessions
const sessions = new Map();

function generateToken() {
    return crypto.randomBytes(64).toString('hex');
}

function verifyAdmin(username, password) {
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

function createSession(username) {
    const token = generateToken();
    sessions.set(token, { username, expires: Date.now() + 3600000 });
    return token;
}

function verifySession(token) {
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) {
        sessions.delete(token);
        return null;
    }
    return session;
}

function logout(token) {
    sessions.delete(token);
}

module.exports = { verifyAdmin, createSession, verifySession, logout };