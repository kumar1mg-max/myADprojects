// index.js - HomeAssist Backend + Frontend

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== File paths =====
const workersFile = path.join(__dirname, 'workers.json');
const tasksFile = path.join(__dirname, 'tasks.json');

// ===== Helper functions =====
function readJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ====== Worker APIs ======
app.get('/workers', (req,res) => {
    const workers = readJSON(workersFile);
    res.json(workers);
});

app.post('/workers', (req,res) => {
    const { name, category, skills, rate, location, contact } = req.body;
    if(!name || !category) return res.status(400).json({error:"Name and category required"});
    const workers = readJSON(workersFile);
    const worker = {
        id: workers.length + 1,
        name,
        category,
        skills: skills || [],
        rate: rate || 0,
        location: location || "",
        contact: contact || "",
        rating: 0,
        tasksCompleted: 0
    };
    workers.push(worker);
    writeJSON(workersFile, workers);
    res.status(201).json(worker);
});

app.get('/workers/search', (req,res)=>{
    const { category, location } = req.query;
    const workers = readJSON(workersFile);
    const results = workers.filter(w => 
        (!category || w.category===category) && (!location || w.location.toLowerCase().includes(location.toLowerCase()))
    );
    res.json(results);
});

// ====== Task APIs ======
app.get('/tasks', (req,res) => {
    const tasks = readJSON(tasksFile);
    res.json(tasks);
});

app.post('/tasks', (req,res)=>{
    const { title, description, type, date, location, category } = req.body;
    if(!title || !type || !category) return res.status(400).json({error:"Title, type, category required"});
    const tasks = readJSON(tasksFile);
    const task = {
        id: tasks.length + 1,
        title,
        description: description || "",
        type,
        date: date || new Date().toISOString().split('T')[0],
        location: location || "",
        category,
        assignedWorkerId: null,
        status: "pending"
    };
    tasks.push(task);
    writeJSON(tasksFile, tasks);
    res.status(201).json(task);
});

app.put('/tasks/:id', (req,res)=>{
    const id = parseInt(req.params.id);
    const tasks = readJSON(tasksFile);
    const task = tasks.find(t=>t.id===id);
    if(!task) return res.status(404).json({error:"Task not found"});
    Object.assign(task, req.body);
    writeJSON(tasksFile, tasks);
    res.json(task);
});

app.delete('/tasks/:id',(req,res)=>{
    const id = parseInt(req.params.id);
    const tasks = readJSON(tasksFile);
    const index = tasks.findIndex(t=>t.id===id);
    if(index===-1) return res.status(404).json({error:"Task not found"});
    const removed = tasks.splice(index,1);
    writeJSON(tasksFile, tasks);
    res.json({message:"Task deleted", task: removed[0]});
});

// ====== Serve Frontend ======

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// For any other route, serve index.html (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Start Server =====
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
