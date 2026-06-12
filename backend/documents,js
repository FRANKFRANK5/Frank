const fs = require('fs');
const path = require('path');

const docsPath = path.join(__dirname, '..', 'documents.json');
const uploadsPath = path.join(__dirname, '..', 'uploads');

// Create uploads folder if not exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Initialize documents database if not exists
if (!fs.existsSync(docsPath)) {
    const initialDocs = {
        documents: [],
        nextId: 1,
        totalCount: 0
    };
    fs.writeFileSync(docsPath, JSON.stringify(initialDocs, null, 2));
    console.log('✅ Documents database created at:', docsPath);
}

// Read all documents
function readDocs() {
    const data = fs.readFileSync(docsPath, 'utf8');
    return JSON.parse(data);
}

// Write documents
function writeDocs(data) {
    fs.writeFileSync(docsPath, JSON.stringify(data, null, 2));
}

// Get all documents (with pagination support)
function getDocuments(page = 1, limit = 50) {
    const db = readDocs();
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
        documents: db.documents.slice(start, end),
        total: db.documents.length,
        page,
        totalPages: Math.ceil(db.documents.length / limit)
    };
}

// Get single document by ID
function getDocumentById(id) {
    const db = readDocs();
    return db.documents.find(d => d.id === id);
}

// Add new document
function addDocument(title, category, content, fileUrl = null, tags = []) {
    const db = readDocs();
    const newDoc = {
        id: db.nextId,
        title: title,
        category: category,
        content: content,
        tags: tags,
        fileUrl: fileUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.documents.push(newDoc);
    db.nextId++;
    db.totalCount = db.documents.length;
    writeDocs(db);
    return newDoc;
}

// Update document
function updateDocument(id, updates) {
    const db = readDocs();
    const index = db.documents.findIndex(d => d.id === id);
    if (index !== -1) {
        db.documents[index] = { 
            ...db.documents[index], 
            ...updates, 
            updatedAt: new Date().toISOString() 
        };
        writeDocs(db);
        return db.documents[index];
    }
    return null;
}

// Delete document
function deleteDocument(id) {
    const db = readDocs();
    const index = db.documents.findIndex(d => d.id === id);
    if (index !== -1) {
        // Delete file if exists
        const doc = db.documents[index];
        if (doc.fileUrl) {
            const filePath = path.join(uploadsPath, path.basename(doc.fileUrl));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        db.documents.splice(index, 1);
        db.totalCount = db.documents.length;
        writeDocs(db);
        return true;
    }
    return false;
}

// Search documents by title or content
function searchDocuments(query) {
    const db = readDocs();
    const lowerQuery = query.toLowerCase();
    const results = db.documents.filter(doc => 
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery) ||
        doc.category.toLowerCase().includes(lowerQuery) ||
        doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    return results;
}

// Get documents by category
function getDocumentsByCategory(category) {
    const db = readDocs();
    return db.documents.filter(doc => doc.category === category);
}

// Get statistics
function getDocumentStats() {
    const db = readDocs();
    const categories = {};
    db.documents.forEach(doc => {
        categories[doc.category] = (categories[doc.category] || 0) + 1;
    });
    return {
        total: db.documents.length,
        categories: categories,
        lastId: db.nextId - 1
    };
}

module.exports = {
    getDocuments,
    getDocumentById,
    addDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,
    getDocumentsByCategory,
    getDocumentStats,
    uploadsPath
};