const express = require('express');
const authManager = require('../managers/authManager');
const challengeManager = require("../managers/challengeManager");
const router = express.Router();

router.get("/", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    res.json(challengeManager.getUserChallenges(decoded.id));
});

router.post("/:id/claim", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = challengeManager.claimReward(decoded.id, req.params.id);
    if (result.error) return res.status(400).json({ error: result.error });
    if (result.xp) authManager.updateStats(decoded.id, 'challenge', { xp: result.xp });
    res.json(result);
});

module.exports = router;
