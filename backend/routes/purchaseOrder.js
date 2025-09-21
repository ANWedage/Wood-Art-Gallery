const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Stock = require('../models/Stock');

// Create purchase order
router.post('/', async (req,res)=>{
  try {
    const { supplierId, itemName, quantity, boardSize, thickness, color, description } = req.body;
    if(!supplierId || !itemName || !quantity || !boardSize || !thickness || !color){
      return res.status(400).json({ success:false, message:'Missing required fields'});
    }
    const supplier = await Supplier.findById(supplierId);
    if(!supplier) return res.status(404).json({ success:false, message:'Supplier not found'});
    const po = await PurchaseOrder.create({ supplier: supplierId, itemName, quantity, boardSize, thickness, color, description });
    await po.populate('supplier','name email phone'); // ensure populated supplier returned
    res.json({ success:true, purchaseOrder: po });
  } catch (e){
    res.status(500).json({ success:false, message:e.message });
  }
});

// List purchase orders (optionally filter by supplier)
router.get('/', async (req,res)=>{
  try {
    const { supplierId } = req.query;
    const filter = supplierId ? { supplier: supplierId } : {};
    const list = await PurchaseOrder.find(filter).populate('supplier','name email phone').sort({ createdAt:-1 });
    res.json({ success:true, purchaseOrders: list });
  } catch (e){ res.status(500).json({ success:false, message:e.message }); }
});

// Get single PO
router.get('/:id', async (req,res)=>{
  try { const po = await PurchaseOrder.findById(req.params.id).populate('supplier','name email phone'); if(!po) return res.status(404).json({ success:false, message:'Not found'}); res.json({ success:true, purchaseOrder: po }); }
  catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// Update status or details
router.put('/:id', async (req,res)=>{
  try {
    const { status, quantity, description } = req.body;
    const update = { };
    if(status) update.status = status;
    if(status === 'received') update.receivedAt = new Date();
    if(quantity) update.quantity = quantity;
    if(description!==undefined) update.description = description;
    
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, update, { new:true, runValidators:true }).populate('supplier','name email phone');
    if(!po) return res.status(404).json({ success:false, message:'Not found'});
    
    // If status is being set to 'received', update stock
    if(status === 'received') {
      try {
        await Stock.updateFromPurchaseOrder(po);
        console.log(`Stock updated for PO ${po.poCode}: ${po.quantity} ${po.itemName} added`);
      } catch(stockError) {
        console.error('Error updating stock:', stockError);
        // Don't fail the PO update if stock update fails, just log it
      }
    }
    
    res.json({ success:true, purchaseOrder: po });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// Delete PO
router.delete('/:id', async (req,res)=>{
  try { const deleted = await PurchaseOrder.findByIdAndDelete(req.params.id); if(!deleted) return res.status(404).json({ success:false, message:'Not found'}); res.json({ success:true, message:'Purchase order deleted'}); }
  catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
