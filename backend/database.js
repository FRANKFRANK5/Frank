const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'portfolio.json');

// Initialize database if not exists
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
    console.log('✅ Database created at:', dbPath);
}

// Read full database
function readDB() {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
}

// Write full database
function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Get all achievements
function getAchievements() {
    const db = readDB();
    return db.achievements;
}

// Add new achievement
function addAchievement(achievement) {
    const db = readDB();
    const newId = Math.max(...db.achievements.map(a => a.id), 0) + 1;
    const newAchievement = { id: newId, ...achievement };
    db.achievements.push(newAchievement);
    writeDB(db);
    return newAchievement;
}

// Update achievement
function updateAchievement(id, updates) {
    const db = readDB();
    const index = db.achievements.findIndex(a => a.id === id);
    if (index !== -1) {
        db.achievements[index] = { ...db.achievements[index], ...updates };
        writeDB(db);
        return db.achievements[index];
    }
    return null;
}

// Delete achievement
function deleteAchievement(id) {
    const db = readDB();
    db.achievements = db.achievements.filter(a => a.id !== id);
    writeDB(db);
    return true;
}

// Get all skills
function getSkills() {
    const db = readDB();
    return db.skills;
}

// Add new skill
function addSkill(skill) {
    const db = readDB();
    const newId = Math.max(...db.skills.map(s => s.id), 0) + 1;
    const newSkill = { id: newId, ...skill };
    db.skills.push(newSkill);
    writeDB(db);
    return newSkill;
}

// Update skill
function updateSkill(id, updates) {
    const db = readDB();
    const index = db.skills.findIndex(s => s.id === id);
    if (index !== -1) {
        db.skills[index] = { ...db.skills[index], ...updates };
        writeDB(db);
        return db.skills[index];
    }
    return null;
}

// Delete skill
function deleteSkill(id) {
    const db = readDB();
    db.skills = db.skills.filter(s => s.id !== id);
    writeDB(db);
    return true;
}

module.exports = {
    readDB,
    writeDB,
    getAchievements,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    getSkills,
    addSkill,
    updateSkill,
    deleteSkill
};