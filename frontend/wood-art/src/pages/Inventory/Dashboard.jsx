import React, { useState, useEffect } from 'react';
import InventoryNavbar from '../../components/Navbar/InventoryNavbar';
import { useAuth } from '../../context/AuthContext';
import InventoryOverview from './InventoryOverview';
import Marketplace from './Marketplace';
import AvailableStock from './AvailableStock';
import Suppliers from './Suppliers';
import PurchaseOrders from './PurchaseOrders';
import StockRelease from './StockRelease';
import StockAlerts from './StockAlerts';
import InventoryReports from './InventoryReports';
import './Dashboard.css';

export default function InventoryDashboard() {
  const { user } = useAuth(); // Get current logged-in user
  const [activePage, setActivePage] = useState('overview');
  const [rawOpen, setRawOpen] = useState(true);
  const [marketItems, setMarketItems] = useState([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState(null);
  const emptySupplier = { name:'', email:'', phone:'', address:'' };
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [showPOModal, setShowPOModal] = useState(false);
  const [currentSupplierPO, setCurrentSupplierPO] = useState(null);
  const initialPOForm = { itemName:'', quantity:'', boardSize:'', thickness:'', color:'', description:'' };
  const [poForm, setPOForm] = useState(initialPOForm);
  const [submittingPO, setSubmittingPO] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poLoading, setPOLoading] = useState(false);
  const [poError, setPOError] = useState(null);
  const [updatingPOId, setUpdatingPOId] = useState(null);
  const [deletingPOId, setDeletingPOId] = useState(null);
  
  // Stock management state
  const [stockItems, setStockItems] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [stockSummary, setStockSummary] = useState({});
  const [stockFilter, setStockFilter] = useState({
    material: '',
    boardSize: '',
    thickness: '',
    color: ''
  });
  
  // Stock release state
  const [stockReleases, setStockReleases] = useState([]);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [submittingRelease, setSubmittingRelease] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseError, setReleaseError] = useState(null);
  
  // Low stock notification state
  const [lowStockCount, setLowStockCount] = useState(0);
  
  const initialReleaseForm = {
    designerName: 'Staff Designer',
    designerEmail: 'staff@gmail.com',
    material: '',
    boardSize: '',
    thickness: '',
    color: '',
    quantity: ''
  };
  const [releaseForm, setReleaseForm] = useState(initialReleaseForm);

  // helper to set page and ensure raw submenu is open when selecting a raw subpage
  const goTo = (page) => {
    if (page && page.startsWith('raw-')) setRawOpen(true);
    setActivePage(page);
  };

  useEffect(() => {
    if (activePage === 'marketplace') {
      loadMarketplaceItems();
    } else if (activePage === 'raw-suppliers') {
      loadSuppliers();
    } else if (activePage === 'raw-purchase-orders') {
      loadPurchaseOrders();
    } else if (activePage === 'raw-available') {
      loadStockItems();
      loadStockSummary();
    } else if (activePage === 'raw-stock-release') {
      loadStockReleases();
    } else if (activePage === 'stock-alerts') {
      loadStockItems(); // Load stock items for low stock filtering
    } else if (activePage === 'overview') {
      loadStockSummary();
    }
    
    // Always load low stock count for notification badge
    loadLowStockCount();
  }, [activePage]);

  // Reload stock when filters change
  useEffect(() => {
    if (activePage === 'raw-available') {
      loadStockItems();
    }
  }, [stockFilter]);

  // Reset release form with staff designer credentials when modal opens
  useEffect(() => {
    if (showReleaseModal) {
      setReleaseForm({
        designerName: 'Staff Designer',
        designerEmail: 'staff@gmail.com',
        material: '',
        boardSize: '',
        thickness: '',
        color: '',
        quantity: ''
      });
    }
  }, [showReleaseModal]);

  const loadMarketplaceItems = async () => {
    try {
      setMarketLoading(true);
      setMarketError(null);
      const res = await fetch('/api/design/all-designs');
      const data = await res.json();
      if (data.success) {
        setMarketItems(data.designs);
      } else {
        setMarketError(data.message || 'Failed to load items');
      }
    } catch (e) {
      setMarketError('Error loading marketplace items');
    } finally {
      setMarketLoading(false);
    }
  };

  const deleteMarketplaceItem = async (id) => {
    if (!window.confirm('Remove this item from marketplace? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/design/admin-delete/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMarketItems(items => items.filter(i => i._id !== id));
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (e) {
      alert('Error deleting item');
    } finally {
      setDeletingId(null);
    }
  };

  const loadSuppliers = async () => {
    try {
      setSupplierLoading(true); setSupplierError(null);
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if(data.success){ setSuppliers(data.suppliers); } else { setSupplierError(data.message||'Failed to load suppliers'); }
    } catch(e){ setSupplierError('Error loading suppliers'); } finally { setSupplierLoading(false); }
  };

  // Purchase Orders
  const loadPurchaseOrders = async () => {
    try {
      setPOLoading(true); setPOError(null);
      const res = await fetch('/api/purchase-orders');
      const data = await res.json();
      if(data.success){ setPurchaseOrders(data.purchaseOrders); } else { setPOError(data.message||'Failed to load purchase orders'); }
    } catch(e){ setPOError('Error loading purchase orders'); } finally { setPOLoading(false); }
  };

  // Stock management functions
  const loadStockItems = async () => {
    try {
      setStockLoading(true);
      setStockError(null);
      
      // Build query params for filtering
      const params = new URLSearchParams();
      if (stockFilter.material) params.append('material', stockFilter.material);
      if (stockFilter.boardSize) params.append('boardSize', stockFilter.boardSize);
      if (stockFilter.thickness) params.append('thickness', stockFilter.thickness);
      if (stockFilter.color) params.append('color', stockFilter.color);
      
      const url = `/api/stock${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setStockItems(data.stock);
      } else {
        setStockError(data.message || 'Failed to load stock items');
      }
    } catch (error) {
      setStockError('Error loading stock items');
    } finally {
      setStockLoading(false);
    }
  };

  const loadStockSummary = async () => {
    try {
      const res = await fetch('/api/stock/summary');
      const data = await res.json();
      if (data.success) {
        setStockSummary(data.summary);
      }
    } catch (error) {
      console.error('Error loading stock summary:', error);
    }
  };

  const initializeStock = async () => {
    try {
      const res = await fetch('/api/stock/initialize', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Stock combinations initialized successfully!');
        loadStockItems();
        loadStockSummary();
      } else {
        alert(data.message || 'Failed to initialize stock');
      }
    } catch (error) {
      alert('Error initializing stock');
    }
  };

  // Reset stock to clear and reinitialize
  const resetStock = async () => {
    try {
      setStockLoading(true);
      setStockError(null);
      const res = await fetch('/api/stock/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Stock reset successfully!');
        loadStockItems();
        loadStockSummary();
        loadLowStockCount(); // Update notification badge
      } else {
        setStockError(data.message || 'Failed to reset stock');
      }
    } catch (e) {
      setStockError('Error resetting stock: ' + e.message);
    } finally {
      setStockLoading(false);
    }
  };

  // Stock release functions
  const loadStockReleases = async () => {
    try {
      setReleaseLoading(true);
      setReleaseError(null);
      const res = await fetch('/api/stock/releases');
      const data = await res.json();
      if (data.success) {
        setStockReleases(data.releases);
      } else {
        setReleaseError(data.message || 'Failed to load stock releases');
      }
    } catch (e) {
      setReleaseError('Error loading stock releases: ' + e.message);
    } finally {
      setReleaseLoading(false);
    }
  };

  // Load low stock count for notification badge
  const loadLowStockCount = async () => {
    try {
      const res = await fetch('/api/stock/low-stock-count');
      const data = await res.json();
      if (data.success) {
        setLowStockCount(data.count);
      }
    } catch (e) {
      console.error('Error loading low stock count:', e);
    }
  };
  
  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!releaseForm.designerName || !releaseForm.designerEmail || !releaseForm.material || 
        !releaseForm.boardSize || !releaseForm.thickness || !releaseForm.color || !releaseForm.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (releaseForm.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    
    try {
      setSubmittingRelease(true);
      const res = await fetch('/api/stock/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(releaseForm)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Stock released successfully!');
        setReleaseForm(initialReleaseForm);
        setShowReleaseModal(false);
        loadStockReleases();
        loadStockItems(); // Refresh stock items to show updated quantities
        loadStockSummary();
        loadLowStockCount(); // Update notification badge
      } else {
        alert('Error: ' + (data.message || 'Failed to release stock'));
      }
    } catch (e) {
      alert('Error releasing stock: ' + e.message);
    } finally {
      setSubmittingRelease(false);
    }
  };

  const onStockFilterChange = (e) => {
    const { name, value } = e.target;
    setStockFilter(prev => ({ ...prev, [name]: value }));
  };

  const openPOModal = (supplier) => {
    setCurrentSupplierPO(supplier);
    setPOForm(initialPOForm);
    setShowPOModal(true);
  };
  const closePOModal = () => { if(!submittingPO) { setShowPOModal(false); setCurrentSupplierPO(null); } };
  const onPOChange = (e) => { const { name, value } = e.target; setPOForm(f=>({...f,[name]:value})); };

  const submitPO = async (e) => {
    e.preventDefault();
    if(!currentSupplierPO) { alert('Supplier missing'); return; }
    const { itemName, quantity, boardSize, thickness, color } = poForm;
    if(!itemName || !quantity || !boardSize || !thickness || !color){ alert('Please fill required fields'); return; }
    try {
      setSubmittingPO(true);
      const payload = { supplierId: currentSupplierPO._id, itemName, quantity: Number(quantity), boardSize, thickness, color, description: poForm.description };
      const res = await fetch('/api/purchase-orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if(data.success){
        setPurchaseOrders(list=>[data.purchaseOrder, ...list]);
        setShowPOModal(false);
        setPOForm(initialPOForm);
        alert('Purchase order created');
      } else {
        alert(data.message || 'Failed to create purchase order');
      }
    } catch(err){ alert('Error creating purchase order'); } finally { setSubmittingPO(false); }
  };

  const updatePOStatus = async (id, nextStatus) => {
    try {
      setUpdatingPOId(id);
      const res = await fetch(`/api/purchase-orders/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: nextStatus }) });
      const data = await res.json();
      if(data.success){
        setPurchaseOrders(list => list.map(po => {
          if(po._id !== id) return po;
          const updated = { ...data.purchaseOrder };
          // If backend did not repopulate supplier, keep previous populated supplier object
          if(!updated.supplier && po.supplier) {
            updated.supplier = po.supplier;
          }
          return updated;
        }));
        
        // If marked as received, reload stock to show updated quantities
        if(nextStatus === 'received') {
          loadStockItems();
          loadStockSummary();
        }
      }
      else alert(data.message||'Failed to update status');
    } catch(e){ alert('Error updating status'); } finally { setUpdatingPOId(null); }
  };

  const deletePO = async (id) => {
    if(!window.confirm('Delete this purchase order?')) return;
    try { setDeletingPOId(id); const res = await fetch(`/api/purchase-orders/${id}`, { method:'DELETE' }); const data = await res.json(); if(data.success){ setPurchaseOrders(list=>list.filter(po=>po._id!==id)); } else { alert(data.message||'Failed to delete'); } } catch(e){ alert('Error deleting purchase order'); } finally { setDeletingPOId(null); }
  };

  const openAddSupplier = () => { setEditingSupplier(null); setSupplierForm(emptySupplier); setShowSupplierModal(true); };
  const openEditSupplier = (s) => { setEditingSupplier(s); setSupplierForm({ name:s.name, email:s.email, phone:s.phone, address:s.address }); setShowSupplierModal(true); };
  const closeSupplierModal = () => { if(!savingSupplier) setShowSupplierModal(false); };
  const onSupplierChange = (e) => { const { name, value } = e.target; setSupplierForm(f=>({...f,[name]:value})); };

  const submitSupplier = async (e) => {
    e.preventDefault();
    const { name, email, phone, address } = supplierForm;
    if(!name||!email||!phone||!address){ alert('All fields required'); return; }
    try {
      setSavingSupplier(true);
      const method = editingSupplier ? 'PUT' : 'POST';
      const url = editingSupplier ? `/api/suppliers/${editingSupplier._id}` : '/api/suppliers';
      const res = await fetch(url,{ method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(supplierForm) });
      const data = await res.json();
      if(data.success){
        if(editingSupplier){ setSuppliers(list=>list.map(s=>s._id===editingSupplier._id? data.supplier : s)); }
        else { setSuppliers(list=>[data.supplier, ...list]); }
        setShowSupplierModal(false);
      } else { alert(data.message||'Failed to save supplier'); }
    } catch(err){ alert('Error saving supplier'); } finally { setSavingSupplier(false); }
  };

  const deleteSupplier = async (id) => {
    if(!window.confirm('Delete this supplier?')) return;
    try { setDeletingSupplierId(id); const res = await fetch(`/api/suppliers/${id}`, { method:'DELETE' }); const data = await res.json(); if(data.success){ setSuppliers(list=>list.filter(s=>s._id!==id)); } else { alert(data.message||'Failed to delete'); } } catch(e){ alert('Error deleting supplier'); } finally { setDeletingSupplierId(null); }
  };

  const formatItemCode = (item) => {
    const raw = item.itemCode || item._id || '';
    if (!raw) return '';
    // Remove common prefix and separators
    const cleaned = raw.replace(/ITM-/i, '').replace(/-/g, '');
    // If already short just return upper-case
    if (cleaned.length <= 8) return cleaned.toUpperCase();
    // Build short: first 3 + last 3 (or 4) chars for readability
    return (cleaned.slice(0,3) + '-' + cleaned.slice(-4)).toUpperCase();
  };

  const statusNext = { pending:'approved', approved:'ordered', ordered:'received' }; // linear progression

  const renderContent = () => {
    switch(activePage) {
      case 'overview':
        return (
          <InventoryOverview stockSummary={stockSummary} />
        );
      case 'marketplace':
        return (
          <Marketplace
            marketItems={marketItems}
            marketLoading={marketLoading}
            marketError={marketError}
            deletingId={deletingId}
            loadMarketplaceItems={loadMarketplaceItems}
            deleteMarketplaceItem={deleteMarketplaceItem}
            formatItemCode={formatItemCode}
          />
        );
      case 'raw-available':
        return (
          <AvailableStock
            stockItems={stockItems}
            stockLoading={stockLoading}
            stockError={stockError}
            stockFilter={stockFilter}
            initializeStock={initializeStock}
            resetStock={resetStock}
            loadStockItems={loadStockItems}
            onStockFilterChange={onStockFilterChange}
            setStockFilter={setStockFilter}
          />
        );
      case 'raw-suppliers':
        return (
          <Suppliers
            suppliers={suppliers}
            supplierLoading={supplierLoading}
            supplierError={supplierError}
            showSupplierModal={showSupplierModal}
            savingSupplier={savingSupplier}
            editingSupplier={editingSupplier}
            deletingSupplierId={deletingSupplierId}
            supplierForm={supplierForm}
            showPOModal={showPOModal}
            currentSupplierPO={currentSupplierPO}
            poForm={poForm}
            submittingPO={submittingPO}
            initialPOForm={initialPOForm}
            loadSuppliers={loadSuppliers}
            openAddSupplier={openAddSupplier}
            openEditSupplier={openEditSupplier}
            deleteSupplier={deleteSupplier}
            closeSupplierModal={closeSupplierModal}
            onSupplierChange={onSupplierChange}
            submitSupplier={submitSupplier}
            openPOModal={openPOModal}
            closePOModal={closePOModal}
            onPOChange={onPOChange}
            submitPO={submitPO}
          />
        );
      case 'raw-purchase-orders':
        return (
          <PurchaseOrders
            purchaseOrders={purchaseOrders}
            poLoading={poLoading}
            poError={poError}
            updatingPOId={updatingPOId}
            deletingPOId={deletingPOId}
            loadPurchaseOrders={loadPurchaseOrders}
            updatePOStatus={updatePOStatus}
          />
        );
      case 'raw-stock-release':
        return (
          <StockRelease
            stockReleases={stockReleases}
            releaseLoading={releaseLoading}
            releaseError={releaseError}
            showReleaseModal={showReleaseModal}
            submittingRelease={submittingRelease}
            releaseForm={releaseForm}
            setShowReleaseModal={setShowReleaseModal}
            setReleaseForm={setReleaseForm}
            handleReleaseSubmit={handleReleaseSubmit}
          />
        );
      case 'stock-alerts':
        return (
          <StockAlerts
            stockItems={stockItems}
            stockLoading={stockLoading}
            stockError={stockError}
            lowStockCount={lowStockCount}
          />
        );
      case 'inventory-reports':
        return (
          <InventoryReports />
        );
      case 'quality-control':
        return (
          <div className="quality-control">
            <h1 className="inventory-dashboard-title">Quality Control</h1>
            <p>Manage quality standards and inspections.</p>
          </div>
        );
      default:
        return (
          <div className="wood-materials">
            <h1 className="inventory-dashboard-title">Wood Materials</h1>
            <p className="section-description">Manage different types of wood, sizes, thicknesses, and colors available.</p>
          </div>
        );
    }
  };

  return (
    <>
      <InventoryNavbar />
      <div className="inventory-dashboard-root">
        <aside className="inventory-sidebar">
          <div className="sidebar-header">
            <h2>Inventory Management</h2>
          </div>
          <ul>
            <li className={activePage === 'overview' ? 'active' : ''} onClick={() => goTo('overview')}>
              <div className="menu-icon">📊</div>
              <span>Overview</span>
            </li>
            <li className={activePage === 'marketplace' ? 'active' : ''} onClick={() => goTo('marketplace')}>
              <div className="menu-icon">🛒</div>
              <span>Marketplace Item Management</span>
            </li>

            <li className={`raw-header ${rawOpen ? 'open' : ''}`} onClick={() => setRawOpen(!rawOpen)}>
              <div className="menu-icon">🌳</div>
              <span>Raw Material Management</span>
              <div className={`caret ${rawOpen ? 'down' : 'right'}`}></div>
            </li>
            {rawOpen && (
              <ul className="submenu">
                <li className={activePage === 'raw-available' ? 'active sub-item' : 'sub-item'} onClick={() => goTo('raw-available')}>
                  <span>Available Stock</span>
                </li>
                <li className={activePage === 'raw-suppliers' ? 'active sub-item' : 'sub-item'} onClick={() => goTo('raw-suppliers')}>
                  <span>Suppliers</span>
                </li>
                <li className={activePage === 'raw-purchase-orders' ? 'active sub-item' : 'sub-item'} onClick={() => goTo('raw-purchase-orders')}>
                  <span>Purchase Orders</span>
                </li>
                <li className={activePage === 'raw-stock-release' ? 'active sub-item' : 'sub-item'} onClick={() => goTo('raw-stock-release')}>
                  <span>Stock Release</span>
                </li>
              </ul>
            )}

            <li className={activePage === 'stock-alerts' ? 'active' : ''} onClick={() => goTo('stock-alerts')}>
              <div className="menu-icon">⚠️</div>
              <span>Low Stock Alert</span>
              {lowStockCount > 0 && (
                <div className="notification-badge">{lowStockCount}</div>
              )}
            </li>
            <li className={activePage === 'inventory-reports' ? 'active' : ''} onClick={() => goTo('inventory-reports')}>
              <div className="menu-icon">📈</div>
              <span>Report Generate</span>
            </li>
            
          </ul>
        </aside>
        <main className="inventory-dashboard-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
