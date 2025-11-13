import React, { useState, useMemo } from 'react';
import { Product, ProductKey, productKeysService } from '../lib/supabase';
import { Plus, Trash2, Filter } from 'lucide-react';

interface ProductKeysManagerProps {
  products: Product[];
  keys: ProductKey[];
  onKeysUpdate: () => void; // To trigger a data refresh in the parent
  saving: boolean;
  setSaving: (s: boolean) => void;
  setError: (e: string | null) => void;
  setSuccess: (s: string | null) => void;
}

const ProductKeysManager: React.FC<ProductKeysManagerProps> = ({ products, keys, onKeysUpdate, saving, setSaving, setError, setSuccess }) => {
  const [newKeysData, setNewKeysData] = useState({ productId: '', keys: '' });
  const [filters, setFilters] = useState({ productId: 'all', status: 'all' });

  const handleAddKeys = async () => {
    if (!newKeysData.productId || !newKeysData.keys.trim()) {
      setError('Please select a product and enter at least one key.');
      return;
    }
    const keysArray = newKeysData.keys.split('\n').map(k => k.trim()).filter(Boolean);
    if (keysArray.length === 0) {
      setError('Please enter at least one valid key.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await productKeysService.addKeys(newKeysData.productId, keysArray);
      setSuccess(`Successfully added ${keysArray.length} keys.`);
      setNewKeysData({ productId: '', keys: '' });
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this key? This cannot be undone.')) return;
    setSaving(true);
    setError(null);
    try {
        await productKeysService.deleteKey(keyId);
        setSuccess('Key deleted successfully.');
        onKeysUpdate();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const filteredKeys = useMemo(() => {
    return keys.filter(key => {
      const productMatch = filters.productId === 'all' || key.product_id === filters.productId;
      const statusMatch = filters.status === 'all' || (filters.status === 'used' ? key.is_used : !key.is_used);
      return productMatch && statusMatch;
    });
  }, [keys, filters]);

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.title || 'Unknown Product';
  
  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-8">
      {/* Add Keys Form */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">Add New Product Keys</h3>
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Product *</label>
            <select value={newKeysData.productId} onChange={(e) => setNewKeysData({ ...newKeysData, productId: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500">
              <option value="">Select a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Keys (one per line) *</label>
            <textarea value={newKeysData.keys} onChange={(e) => setNewKeysData({ ...newKeysData, keys: e.target.value })} rows={5} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="KEY-1234-ABCD..."></textarea>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleAddKeys} disabled={saving} className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50">
            <Plus className="w-5 h-5" />
            <span>{saving ? 'Adding...' : 'Add Keys'}</span>
          </button>
        </div>
      </div>
      
      {/* Keys Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white">Manage Product Keys ({filteredKeys.length})</h3>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select value={filters.productId} onChange={e => setFilters({...filters, productId: e.target.value})} className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500">
                        <option value="all">All Products</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500">
                        <option value="all">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="used">Used</option>
                    </select>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="p-3 text-left font-medium text-gray-300">Key</th>
                <th className="p-3 text-left font-medium text-gray-300">Product</th>
                <th className="p-3 text-left font-medium text-gray-300">Status</th>
                <th className="p-3 text-left font-medium text-gray-300">Used By</th>
                <th className="p-3 text-left font-medium text-gray-300">Used At</th>
                <th className="p-3 text-left font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map(key => (
                <tr key={key.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                  <td className="p-3 text-gray-300 font-mono" title={key.key_value}>{maskKey(key.key_value)}</td>
                  <td className="p-3 text-white">{getProductName(key.product_id)}</td>
                  <td className="p-3">
                    {key.is_used ? <span className="px-2 py-1 text-xs font-medium text-red-300 bg-red-500/20 rounded-full">Used</span> : <span className="px-2 py-1 text-xs font-medium text-green-300 bg-green-500/20 rounded-full">Available</span>}
                  </td>
                  <td className="p-3 text-gray-400">{key.used_by_email || 'N/A'}</td>
                  <td className="p-3 text-gray-400">{key.used_at ? new Date(key.used_at).toLocaleString() : 'N/A'}</td>
                  <td className="p-3">
                    {!key.is_used && (
                      <button onClick={() => handleDeleteKey(key.id)} disabled={saving} className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredKeys.length === 0 && <p className="text-center text-gray-500 py-8">No keys match the current filters.</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductKeysManager;
