const express = require('express');
const authManager = require('../managers/authManager');
const customPackManager = require("../managers/customPackManager");
const router = express.Router();

router.post("/", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.createPack(decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

router.get("/mine", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    res.json({ packs: customPackManager.getUserPacks(decoded.id) });
});

router.get("/public", (req, res) => {
    const { type, limit } = req.query;
    res.json({ packs: customPackManager.getPublicPacks(type, parseInt(limit) || 50) });
});

router.get("/:id", (req, res) => {
    const pack = customPackManager.getPack(req.params.id);
    if (!pack) return res.status(404).json({ error: "Pack not found" });
    res.json({ pack });
});

router.put("/:id", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.updatePack(req.params.id, decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

router.delete("/:id", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.deletePack(req.params.id, decoded.id);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

router.post("/:id/items", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    const result = customPackManager.addItem(req.params.id, decoded.id, req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
});

router.post("/:id/like", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = authManager.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    res.json(customPackManager.toggleLike(req.params.id, decoded.id));
});

module.exports = router;
