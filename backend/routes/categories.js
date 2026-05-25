const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// GET ALL CATEGORIES
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW CATEGORY
router.post("/", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        if (!name) return res.status(400).json({ message: "Tên danh mục không được để trống." });

        const existing = await Category.findOne({ name: new RegExp(`^${name}$`, "i") });
        if (existing) return res.status(400).json({ message: "Danh mục đã tồn tại." });

        const category = new Category({ name });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE CATEGORY
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy danh mục." });
        res.json({ message: "Xóa danh mục thành công." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE CATEGORY
router.put("/:id", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        if (!name) return res.status(400).json({ message: "Tên danh mục không được để trống." });

        const existing = await Category.findOne({
            name: new RegExp(`^${name}$`, "i"),
            _id: { $ne: req.params.id }
        });
        if (existing) return res.status(400).json({ message: "Danh mục đã tồn tại." });

        const updated = await Category.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Không tìm thấy danh mục." });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
