const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');

// Create supplier
router.post('/', async (req,res)=>{
  try {
    const { name, email, phone, address } = req.body;
    if(!name || !email || !phone || !address) return res.status(400).json({ success:false, message:'All fields required' });
    const supplier = await Supplier.create({ name, email, phone, address });
    res.json({ success:true, supplier });
  } catch (e){
    res.status(500).json({ success:false, message:e.message });
  }
});

// List suppliers
router.get('/', async (req,res)=>{
  try {
    const suppliers = await Supplier.find({}).sort({ createdAt:-1 });
    res.json({ success:true, suppliers });
  } catch (e){
    res.status(500).json({ success:false, message:e.message });
  }
});

// Update supplier
router.put('/:id', async (req,res)=>{
  try {
    const { id } = req.params;
    const { name, email, phone, address, active } = req.body;
    const updated = await Supplier.findByIdAndUpdate(id, { name, email, phone, address, active }, { new:true, runValidators:true });
    if(!updated) return res.status(404).json({ success:false, message:'Supplier not found' });
    res.json({ success:true, supplier: updated });
  } catch (e){
    res.status(500).json({ success:false, message:e.message });
  }
});

// Delete supplier
router.delete('/:id', async (req,res)=>{
  try {
    const { id } = req.params;
    const deleted = await Supplier.findByIdAndDelete(id);
    if(!deleted) return res.status(404).json({ success:false, message:'Supplier not found' });
    res.json({ success:true, message:'Supplier deleted' });
  } catch (e){
    res.status(500).json({ success:false, message:e.message });
  }
});

module.exports = router;
