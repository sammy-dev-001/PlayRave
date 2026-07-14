const express = require('express');
const authManager = require('../managers/authManager');
const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { email, password, username, guestData } = req.body;
        if (!email || !password || !username) return res.status(400).json({ error: "All fields required" });
        if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
        const result = await authManager.register(email, password, username, guestData);
        if (result.error) return res.status(400).json({ error: result.error });
        res.json(result);
    } catch (e) { console.error("Register error:", e); res.status(500).json({ error: "Server error" }); }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });
        const result = await authManager.login(email, password);
        if (result.error) return res.status(401).json({ error: result.error });
        res.json(result);
    } catch (e) { console.error("Login error:", e); res.status(500).json({ error: "Server error" }); }
});

router.get("/me", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });
    const user = await authManager.getUserByToken(token);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    res.json({ user });
});

router.get("/users/:id", async (req, res) => {
    const user = await authManager.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
});

router.get("/leaderboard", async (req, res) => {
    const leaderboard = await authManager.getLeaderboard(50);
    res.json({ leaderboard });
});

router.post("/stats/update", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const { gameType, stats } = req.body;
    const result = await authManager.updateStats(decoded.id, gameType, stats);
    res.json(result);
});

module.exports = router;
