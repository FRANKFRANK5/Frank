const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateOTP, sendOTPEmail } = require('./email');
const { addDocument, getDocuments, deleteDocument, uploadsPath } = require('./documents');

const frontendPath = path.join(__dirname, '..', 'frontend');
const dbPath = path.join(__dirname, '..', 'portfolio.json');

// Store OTPs temporarily
const otpStore = new Map();

// Admin credentials
const ADMIN_USERNAME = '4PP3X';
const ADMIN_PASSWORD = '4PP3X#SuperSecure2026!!';
const ADMIN_EMAIL = 'frankkarani280@gmail.com';

// Store sessions
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

// Database functions
function readDB() {
    if (!fs.existsSync(dbPath)) {
        const initialData = {
            achievements: [
                { id: 1, title: 'Global Rank #15', competition: 'CTFZone Standalone', rank: '#15 Worldwide', score: 98, date: '2026', icon: '🏆' },
                { id: 2, title: 'Perfect 100%', competition: 'CTFZone Bootcamp', rank: '11th Global', score: 100, date: '2026', icon: '🎯' },
                { id: 3, title: 'Top 50', competition: 'TCRA CyberChampions', rank: 'Top 50 Tanzania', score: 92, date: '2025/26', icon: '⭐' },
                { id: 4, title: '3rd Place', competition: 'ExploitRoom', rank: '3rd Place', score: 95, date: '2026', icon: '🥉' },
                { id: 5, title: 'Top 100', competition: 'SecLeaf Q2 CTF', rank: 'Top 100 Global', score: 88, date: '2026', icon: '🌍' },
                { id: 6, title: 'Top 150', competition: 'picoCTF', rank: 'Top 150', score: 85, date: '2026', icon: '🚩' }
            ],
            skills: [
                { id: 1, name: 'Web Security', category: 'Offensive', level: 95 },
                { id: 2, name: 'Penetration Testing', category: 'Offensive', level: 88 },
                { id: 3, name: 'Cryptography', category: 'Core', level: 82 },
                { id: 4, name: 'Network Forensics', category: 'Forensics', level: 78 },
                { id: 5, name: 'CTF Problem Solving', category: 'Competitive', level: 93 }
            ]
        };
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    console.log('📡', req.method, url);

    // ============ PUBLIC API ============
    if (url === '/api/public/achievements' && req.method === 'GET') {
        const db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.achievements));
        return;
    }

    if (url === '/api/public/skills' && req.method === 'GET') {
        const db = readDB();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.skills));
        return;
    }

    if (url === '/api/public/documents' && req.method === 'GET') {
        const docs = getDocuments();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(docs));
        return;
    }

    // ============ 2FA LOGIN - STEP 1: Send OTP ============
    if (url === '/api/admin/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { username, password } = JSON.parse(body);
                if (verifyAdmin(username, password)) {
                    const otp = generateOTP();
                    const expiresAt = Date.now() + 10 * 60 * 1000;
                    otpStore.set(ADMIN_EMAIL, { otp, expiresAt });
                    
                    try {
                        await sendOTPEmail(ADMIN_EMAIL, otp);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'OTP sent to your email', email: ADMIN_EMAIL }));
                    } catch (emailError) {
                        console.error('Email error:', emailError);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to send OTP. Check email configuration.' }));
                    }
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid credentials' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }

    // ============ 2FA LOGIN - STEP 2: Verify OTP ============
    if (url === '/api/admin/verify-otp' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { email, otp } = JSON.parse(body);
                const stored = otpStore.get(email);
                
                if (stored && stored.otp === otp && stored.expiresAt > Date.now()) {
                    otpStore.delete(email);
                    const token = createSession(ADMIN_USERNAME);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, token, username: ADMIN_USERNAME }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid or expired OTP' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }

    // ============ VERIFY TOKEN ============
    if (url === '/api/admin/verify' && req.method === 'GET') {
        const token = req.headers.authorization;
        if (token && verifySession(token)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: true }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: false }));
        }
        return;
    }

    // ============ ADMIN: ADD ACHIEVEMENT ============
    if (url === '/api/admin/achievements' && req.method === 'POST') {
        const token = req.headers.authorization;
        if (!token || !verifySession(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const newAchievement = JSON.parse(body);
                const db = readDB();
                const newId = Math.max(...db.achievements.map(a => a.id), 0) + 1;
                newAchievement.id = newId;
                db.achievements.push(newAchievement);
                writeDB(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id: newId }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid data' }));
            }
        });
        return;
    }

    // ============ ADMIN: DELETE ACHIEVEMENT ============
    if (url.startsWith('/api/admin/achievements/') && req.method === 'DELETE') {
        const token = req.headers.authorization;
        if (!token || !verifySession(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const id = parseInt(url.split('/').pop());
        const db = readDB();
        db.achievements = db.achievements.filter(a => a.id !== id);
        writeDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // ============ ADMIN: ADD SKILL ============
    if (url === '/api/admin/skills' && req.method === 'POST') {
        const token = req.headers.authorization;
        if (!token || !verifySession(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const newSkill = JSON.parse(body);
                const db = readDB();
                const newId = Math.max(...db.skills.map(s => s.id), 0) + 1;
                newSkill.id = newId;
                db.skills.push(newSkill);
                writeDB(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id: newId }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid data' }));
            }
        });
        return;
    }

    // ============ ADMIN: DELETE SKILL ============
    if (url.startsWith('/api/admin/skills/') && req.method === 'DELETE') {
        const token = req.headers.authorization;
        if (!token || !verifySession(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const id = parseInt(url.split('/').pop());
        const db = readDB();
        db.skills = db.skills.filter(s => s.id !== id);
        writeDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // ============ DOCUMENTS API ============
    if (url === '/api/admin/documents' && req.method === 'POST') {
        const token = req.headers.authorization;
        if (!token || !verifySession(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { title, category, content } = JSON.parse(body);
                const newDoc = addDocument(title, category, content);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id: newDoc.id }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid data' }));
            }
        });
        return;
    }

    if (url === '/api/admin/documents' && req.method === 'GET') {
        const token = req.headers.authorization;
        if (!token || !verifySession(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const docs = getDocuments();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(docs));
        return;
    }

    if (url.startsWith('/api/admin/documents/') && req.method === 'DELETE') {
        const token = req.headers.authorization;
        if (!token || !verifySession(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const id = parseInt(url.split('/').pop());
        deleteDocument(id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // ============ LOGOUT ============
    if (url === '/api/admin/logout' && req.method === 'POST') {
        const token = req.headers.authorization;
        if (token) logout(token);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // ============ SERVE FRONTEND ============
    let filePath = url === '/' ? '/index.html' : url;
    filePath = path.join(frontendPath, filePath);

    if (!filePath.startsWith(frontendPath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
    }[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log('❌ File not found:', filePath);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     🔐 4PP3X PORTFOLIO - FRANK KARANI                      ║');
    console.log('║     🚀 Server: http://localhost:' + PORT + '                      ║');
    console.log('║     🔐 2FA Authentication: ENABLED                        ║');
    console.log('║     📧 OTP sent to: frankkarani280@gmail.com               ║');
    console.log('║     🔑 Login: 4PP3X / 4PP3X#SuperSecure2026!!             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
});