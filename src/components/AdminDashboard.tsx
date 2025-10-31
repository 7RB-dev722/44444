import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, LogOut, Package, DollarSign, RefreshCw, Tag, AlertCircle, CheckCircle, ImageIcon, Eye, EyeOff, Home, UploadCloud, LayoutDashboard, Image as LucideImage, Settings, Link as LinkIcon, Palette, PlayCircle, Move, QrCode } from 'lucide-react';
import { productService, categoryService, winningPhotosService, settingsService, purchaseImagesService, testSupabaseConnection, Product, Category, WinningPhoto, SiteSetting, PurchaseImage, supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import SiteContentEditor from './SiteContentEditor';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AVAILABLE_IMAGES = [
  { id: 'cheatloop-logo', name: 'Cheatloop Logo', path: '/cheatloop copy.png', category: 'logos' },
  { id: 'cheatloop-original', name: 'Cheatloop Original', path: '/cheatloop.png', category: 'logos' },
  { id: 'sinki-logo', name: 'Sinki Logo', path: '/sinki copy.jpg', category: 'logos' },
  { id: 'sinki-original', name: 'Sinki Original', path: '/sinki.jpg', category: 'logos' }
];

const WINNING_PHOTO_PRODUCTS = ['Cheatloop PUBG', 'Cheatloop CODM', 'Sinki'];

type AdminTab = 'dashboard' | 'products' | 'categories' | 'photos' | 'purchase-images' | 'content' | 'settings';

interface PhotoItemProps {
  photo: WinningPhoto;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onDelete: (photo: WinningPhoto) => void;
  saving: boolean;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ photo, isSelected, onSelectToggle, onDelete, saving }) => {
  return (
    <div 
      className={`relative group aspect-[4/5] bg-slate-800 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer
        ${isSelected ? 'border-green-500' : 'border-slate-700 hover:border-slate-600'}
      `}
      onClick={() => onSelectToggle(photo.id)}
    >
      <img src={photo.image_url} alt={photo.description || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="absolute top-2 left-2">
         <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectToggle(photo.id)}
            className="w-5 h-5 text-green-500 bg-slate-900/50 border-slate-600 rounded focus:ring-green-500 focus:ring-offset-slate-800 focus:ring-2 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex justify-between items-end">
          <div className="text-white overflow-hidden pr-2">
            <p className="text-xs font-semibold truncate">{photo.description || 'No description'}</p>
            {photo.created_at && <p className="text-xs text-gray-400">{new Date(photo.created_at).toLocaleDateString()}</p>}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(photo); }} 
            disabled={saving} 
            className="shrink-0 p-2 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
            title="Delete photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`${
        enabled ? 'bg-cyan-600' : 'bg-slate-600'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
    >
      <span
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [winningPhotos, setWinningPhotos] = useState<WinningPhoto[]>([]);
  const [purchaseImages, setPurchaseImages] = useState<PurchaseImage[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetProduct, setMoveTargetProduct] = useState('');
  const [photoProductFilter, setPhotoProductFilter] = useState<string>('all');
  const [newPurchaseImage, setNewPurchaseImage] = useState<{ file: File | null; name: string }>({ file: null, name: '' });


  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'created_at' | 'updated_at'>>({
    title: '', price: 0, features: [''], description: '', buy_link: '', image: '', video_link: '', is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null
  });
  const [newWinningPhotos, setNewWinningPhotos] = useState<{ files: File[]; productName: string; description: string }>({
    files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: ''
  });
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const winningPhotoFileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const purchaseImageFileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      if (isConnected) {
        await loadData();
      } else {
        setError('Failed to connect to the database. Please check your Supabase settings.');
      }
    } catch (err) {
      console.error('Connection check failed:', err);
      setConnectionStatus('disconnected');
      setError('Failed to connect to the database.');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, categoriesData, winningPhotosData, settingsData, purchaseImagesData] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
        winningPhotosService.getPhotos(),
        settingsService.getSettings(),
        purchaseImagesService.getAll()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setWinningPhotos(winningPhotosData);
      setSettings(settingsData);
      setPurchaseImages(purchaseImagesData);
      setSuccess('Data loaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data from the database.');
    } finally {
      setLoading(false);
    }
  };

  const handleWinningPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 10) {
        setError('You can upload a maximum of 10 photos at a time.');
        setNewWinningPhotos({ ...newWinningPhotos, files: selectedFiles.slice(0, 10) });
      } else {
        setError(null);
        setNewWinningPhotos({ ...newWinningPhotos, files: selectedFiles });
      }
    }
  };

  const handleAddWinningPhotos = async () => {
    if (newWinningPhotos.files.length === 0) {
      setError('Please select at least one image file.');
      return;
    }
    if (!supabase) {
      setError('Supabase client is not available.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const uploadPromises = newWinningPhotos.files.map(file => {
        const filePath = `public/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        return supabase.storage.from('winning-photos').upload(filePath, file);
      });

      const uploadResults = await Promise.all(uploadPromises);

      const uploadErrors = uploadResults.filter(result => result.error);
      if (uploadErrors.length > 0) {
        throw new Error(`Failed to upload some photos: ${uploadErrors.map(e => e.error?.message).join(', ')}`);
      }
      
      const photosToInsert = uploadResults.map(result => {
        const { data: { publicUrl } } = supabase.storage.from('winning-photos').getPublicUrl(result.data!.path);
        return {
          image_url: publicUrl,
          product_name: newWinningPhotos.productName,
          description: newWinningPhotos.description,
        };
      });

      await winningPhotosService.addPhotos(photosToInsert);

      await loadData();
      setNewWinningPhotos({ files: [], productName: WINNING_PHOTO_PRODUCTS[0], description: '' });
      if (winningPhotoFileInputRef.current) {
        winningPhotoFileInputRef.current.value = '';
      }
      setSuccess(`Successfully added ${photosToInsert.length} photos!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add winning photos.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWinningPhoto = async (photo: WinningPhoto) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    setSaving(true);
    setError(null);
    try {
      await winningPhotosService.deletePhotos([photo]);
      await loadData();
      setSuccess('Winning photo deleted successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete winning photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedPhotos.length} selected photos? This action cannot be undone.`)) return;

    setSaving(true);
    setError(null);
    try {
        const photosToDelete = winningPhotos.filter(p => selectedPhotos.includes(p.id));
        await winningPhotosService.deletePhotos(photosToDelete);
        await loadData();
        setSuccess(`${selectedPhotos.length} photos deleted successfully.`);
        setSelectedPhotos([]);
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message || 'Failed to delete selected photos.');
    } finally {
        setSaving(false);
    }
  };

  const handleMoveSelected = async () => {
    if (!moveTargetProduct) {
        setError('Please select a destination product.');
        return;
    }
    setSaving(true);
    setError(null);
    try {
        await winningPhotosService.movePhotos(selectedPhotos, moveTargetProduct);
        await loadData();
        setSuccess(`${selectedPhotos.length} photos moved successfully.`);
        setSelectedPhotos([]);
        setShowMoveModal(false);
        setMoveTargetProduct('');
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message || 'Failed to move photos.');
    } finally {
        setSaving(false);
    }
  };

  const handleTogglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAllForProduct = (productName: string, shouldSelect: boolean) => {
    const photoIdsForProduct = winningPhotos.filter(p => p.product_name === productName).map(p => p.id);
    if (shouldSelect) {
        setSelectedPhotos(prev => [...new Set([...prev, ...photoIdsForProduct])]);
    } else {
        setSelectedPhotos(prev => prev.filter(id => !photoIdsForProduct.includes(id)));
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      const settingsToUpdate: SiteSetting[] = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await settingsService.updateSettings(settingsToUpdate);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductVisibility = async (productId: string, currentHiddenStatus: boolean) => {
    try {
      setSaving(true);
      setError(null);
      await productService.updateProduct(productId, { is_hidden: !currentHiddenStatus });
      await loadData();
      setSuccess(`Product successfully ${!currentHiddenStatus ? 'hidden' : 'shown'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error toggling product visibility:', err);
      setError(err.message || 'Failed to change product visibility.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectImage = (imagePath: string) => {
    setNewProduct({ ...newProduct, image: imagePath });
    setImageUploadFile(null);
    setImagePreviewUrl(null);
    if (productImageInputRef.current) {
        productImageInputRef.current.value = '';
    }
    setShowImageSelector(false);
    setSuccess('Image selected successfully.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveImage = () => {
    setNewProduct({ ...newProduct, image: '' });
    setImageUploadFile(null);
    setImagePreviewUrl(null);
    if (productImageInputRef.current) {
        productImageInputRef.current.value = '';
    }
  };

  const handleProductImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageUploadFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        setNewProduct({ ...newProduct, image: '' });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Please enter a category name.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await categoryService.addCategory(newCategoryName);
      await loadData();
      setNewCategoryName('');
      setIsAddingCategory(false);
      setSuccess('Category added successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError(err.message || 'Failed to add category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All associated products will also be deleted.')) return;
    try {
      setSaving(true);
      setError(null);
      await categoryService.deleteCategory(id);
      await loadData();
      setSuccess('Category deleted successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category.');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const selectedCategory = categories.find(c => c.id === categoryId);
    setNewProduct({
      ...newProduct, 
      category_id: categoryId,
      category: selectedCategory?.slug as 'pubg' | 'codm' || 'pubg'
    });
  };
  
  const handleProductSubmit = async (isUpdate: boolean) => {
    if (!newProduct.title || !newProduct.price || (!newProduct.buy_link && !newProduct.purchase_image_id) || !newProduct.category_id) {
        setError('Please fill all required fields: Name, Price, Category, and either a Buy Link or a Purchase Image.');
        return;
    }

    try {
        setSaving(true);
        setError(null);
        
        let imageUrl = newProduct.image;
        if (imageUploadFile) {
            if (!supabase) throw new Error("Supabase client not available");
            const filePath = `public/${Date.now()}-${imageUploadFile.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageUploadFile);
            if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }

        const productPayload: Partial<Product> = { 
            ...newProduct, 
            image: imageUrl,
            features: newProduct.features.filter(f => f.trim() !== ''),
            buy_link: newProduct.purchase_image_id ? '' : newProduct.buy_link,
            purchase_image_id: newProduct.buy_link ? null : newProduct.purchase_image_id
        };
        
        if (isUpdate) {
            await productService.updateProduct(editingProduct!, productPayload);
        } else {
            await productService.addProduct(productPayload as any);
        }

        await loadData();
        resetProductForm();
        if (isUpdate) {
            setEditingProduct(null);
        } else {
            setIsAddingProduct(false);
        }
        setSuccess(`Product ${isUpdate ? 'updated' : 'added'} successfully.`);
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        console.error(`Error ${isUpdate ? 'updating' : 'adding'} product:`, err);
        setError(err.message || `Failed to ${isUpdate ? 'update' : 'add'} product.`);
    } finally {
        setSaving(false);
    }
  };

  const handleAddProduct = () => handleProductSubmit(false);
  const handleUpdateProduct = () => handleProductSubmit(true);

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      setSaving(true);
      setError(null);
      await productService.deleteProduct(id);
      await loadData();
      setSuccess('Product deleted successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    resetProductForm();
    setNewProduct({
      title: product.title, price: product.price, features: product.features, description: product.description,
      buy_link: product.buy_link, image: product.image || '', video_link: product.video_link || '', is_popular: product.is_popular || false,
      category: product.category, category_id: product.category_id || '', is_hidden: product.is_hidden || false,
      purchase_image_id: product.purchase_image_id || null
    });
  };

  const resetProductForm = () => {
    setNewProduct({
      title: '', price: 0, features: [''], description: '', buy_link: '', image: '', video_link: '',
      is_popular: false, category: 'pubg', category_id: '', is_hidden: false, purchase_image_id: null
    });
    setImageUploadFile(null);
    setImagePreviewUrl(null);
    if (productImageInputRef.current) productImageInputRef.current.value = '';
  };

  const addFeature = () => setNewProduct({ ...newProduct, features: [...newProduct.features, ''] });
  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...newProduct.features];
    updatedFeatures[index] = value;
    setNewProduct({ ...newProduct, features: updatedFeatures });
  };
  const removeFeature = (index: number) => {
    const updatedFeatures = newProduct.features.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, features: updatedFeatures });
  };

  const handlePurchaseImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPurchaseImage({ ...newPurchaseImage, file: e.target.files[0] });
    }
  };

  const handleAddPurchaseImage = async () => {
    if (!newPurchaseImage.file || !newPurchaseImage.name) {
      setError('Please provide a name and select an image file.');
      return;
    }
    if (!supabase) {
      setError('Supabase client is not available.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const filePath = `public/${Date.now()}-${newPurchaseImage.file.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('purchase-images').upload(filePath, newPurchaseImage.file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('purchase-images').getPublicUrl(filePath);
      await purchaseImagesService.addImage(newPurchaseImage.name, publicUrl);
      
      await loadData();
      setNewPurchaseImage({ file: null, name: '' });
      if (purchaseImageFileInputRef.current) {
        purchaseImageFileInputRef.current.value = '';
      }
      setSuccess('Purchase image added successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add purchase image.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePurchaseImage = async (image: PurchaseImage) => {
    if (!confirm(`Are you sure you want to delete the image "${image.name}"?`)) return;
    setSaving(true);
    setError(null);
    try {
      await purchaseImagesService.deleteImage(image);
      await loadData();
      setSuccess('Purchase image deleted successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete purchase image.');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  const getFilteredImages = () => selectedImageCategory === 'all' ? AVAILABLE_IMAGES : AVAILABLE_IMAGES.filter(img => img.category === selectedImageCategory);

  const groupedWinningPhotos = WINNING_PHOTO_PRODUCTS.reduce((acc, productName) => {
    acc[productName] = winningPhotos.filter(p => p.product_name === productName);
    return acc;
  }, {} as Record<string, WinningPhoto[]>);

  const TabButton = ({ tab, label, icon: Icon }: { tab: AdminTab; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2
        ${activeTab === tab 
          ? 'border-cyan-400 text-cyan-300' 
          : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-700/50'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  if (connectionStatus === 'checking' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">
            {connectionStatus === 'checking' ? 'Checking connection...' : 'Loading admin panel...'}
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connection Failed</h2>
          <p className="text-gray-300 mb-6">Could not connect to the database. Please check your Supabase settings.</p>
          <button onClick={checkConnection} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Cheatloop Admin</h1>
            <div className="flex items-center space-x-1"><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-green-400 text-sm">Connected</span></div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg bg-slate-700 hover:bg-slate-600"><Home className="w-5 h-5" /></Link>
            <button onClick={loadData} disabled={loading} className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={onLogout} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        <div className="border-b border-slate-700">
          <nav className="flex space-x-2" aria-label="Tabs">
            <TabButton tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <TabButton tab="products" label="Products" icon={Package} />
            <TabButton tab="categories" label="Categories" icon={Tag} />
            <TabButton tab="photos" label="Winning Photos" icon={LucideImage} />
            <TabButton tab="purchase-images" label="Purchase Images" icon={QrCode} />
            <TabButton tab="content" label="Site Customization" icon={Palette} />
            <TabButton tab="settings" label="Settings" icon={Settings} />
          </nav>
        </div>

        <div className="p-6 relative">
          {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-center flex items-center justify-center space-x-2"><CheckCircle className="w-5 h-5" /><span>{success}</span></div>}
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-center flex items-center justify-center space-x-2"><AlertCircle className="w-5 h-5" /><span>{error}</span><button onClick={() => setError(null)} className="ml-4 text-red-300 hover:text-red-200">✕</button></div>}

          {activeTab === 'dashboard' && (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700"><div className="flex items-center space-x-3"><Package className="w-8 h-8 text-cyan-400" /><div><p className="text-gray-400 text-sm">Total Products</p><p className="text-2xl font-bold text-white">{products.length}</p></div></div></div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700"><div className="flex items-center space-x-3"><Tag className="w-8 h-8 text-purple-400" /><div><p className="text-gray-400 text-sm">Total Categories</p><p className="text-2xl font-bold text-white">{categories.length}</p></div></div></div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700"><div className="flex items-center space-x-3"><ImageIcon className="w-8 h-8 text-yellow-400" /><div><p className="text-gray-400 text-sm">Winning Photos</p><p className="text-2xl font-bold text-white">{winningPhotos.length}</p></div></div></div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700"><div className="flex items-center space-x-3"><QrCode className="w-8 h-8 text-green-400" /><div><p className="text-gray-400 text-sm">Purchase Images</p><p className="text-2xl font-bold text-white">{purchaseImages.length}</p></div></div></div>
            </div>
          )}
          
          {activeTab === 'content' && (
            <SiteContentEditor 
              settings={settings}
              onSettingsChange={setSettings}
              onSave={handleSaveSettings}
              saving={saving}
              setSaving={setSaving}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}

          {activeTab === 'purchase-images' && (
            <div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">Add New Purchase Image</h3>
                <div className="grid md:grid-cols-3 gap-6 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Image Name *</label>
                    <input type="text" value={newPurchaseImage.name} onChange={(e) => setNewPurchaseImage({ ...newPurchaseImage, name: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="e.g., ZainCash QR" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Image File *</label>
                    <input type="file" ref={purchaseImageFileInputRef} onChange={handlePurchaseImageFileChange} accept="image/png, image/jpeg, image/webp, image/gif" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20" />
                  </div>
                  <div>
                    <button onClick={handleAddPurchaseImage} disabled={saving} className="w-full flex justify-center items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50"><UploadCloud className="w-5 h-5" /><span>{saving ? 'Uploading...' : 'Add Image'}</span></button>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4">Manage Purchase Images ({purchaseImages.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {purchaseImages.map(image => (
                  <div key={image.id} className="relative group bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <img src={image.image_url} alt={image.name} className="w-full h-40 object-contain rounded-md bg-slate-700" />
                    <p className="text-white text-sm font-medium mt-2 truncate text-center">{image.name}</p>
                    <button onClick={() => handleDeletePurchaseImage(image)} disabled={saving} className="absolute top-2 right-2 p-2 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100" title="Delete image">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">Upload New Winning Photos</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="winning-photo-upload" className="block text-sm font-medium text-gray-300 mb-2">Image Files (up to 10) *</label>
                    <input type="file" id="winning-photo-upload" ref={winningPhotoFileInputRef} multiple onChange={handleWinningPhotoFileChange} accept="image/png, image/jpeg, image/webp, image/gif" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"/>
                    {newWinningPhotos.files.length > 0 && <p className="text-xs text-gray-400 mt-2">{newWinningPhotos.files.length} photos selected.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Related Product *</label>
                    <select value={newWinningPhotos.productName} onChange={(e) => setNewWinningPhotos({...newWinningPhotos, productName: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                      {WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                    <input type="text" value={newWinningPhotos.description} onChange={(e) => setNewWinningPhotos({...newWinningPhotos, description: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="Short description for photos"/>
                  </div>
                </div>
                <div className="mt-6">
                  <button onClick={handleAddWinningPhotos} disabled={saving} className="w-full flex justify-center items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50"><UploadCloud className="w-5 h-5"/><span>{saving ? 'Uploading...' : 'Upload Selected Photos'}</span></button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">Manage Photos ({winningPhotos.length})</h3>
              
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 bg-slate-900/50 backdrop-blur-sm p-3 rounded-xl max-w-2xl mx-auto">
                <button
                    onClick={() => setPhotoProductFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        photoProductFilter === 'all'
                            ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    All Products
                </button>
                {WINNING_PHOTO_PRODUCTS.map(productName => (
                    <button
                        key={productName}
                        onClick={() => setPhotoProductFilter(productName)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            photoProductFilter === productName
                                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        {productName}
                    </button>
                ))}
              </div>

              <div className="space-y-12">
                {Object.entries(groupedWinningPhotos)
                  .filter(([productName]) => photoProductFilter === 'all' || productName === photoProductFilter)
                  .map(([productName, photos]) => {
                    const allInGroupSelected = photos.length > 0 && photos.every(p => selectedPhotos.includes(p.id));
                    return (
                      <div key={productName} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-cyan-400">{productName} ({photos.length})</h4>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`select-all-${productName}`}
                              checked={allInGroupSelected}
                              onChange={(e) => handleSelectAllForProduct(productName, e.target.checked)}
                              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                            />
                            <label htmlFor={`select-all-${productName}`} className="text-sm text-gray-300">Select All</label>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {photos.map(photo => (
                            <PhotoItem 
                              key={photo.id} 
                              photo={photo} 
                              onDelete={handleDeleteWinningPhoto} 
                              saving={saving}
                              isSelected={selectedPhotos.includes(photo.id)}
                              onSelectToggle={handleTogglePhotoSelection}
                            />
                          ))}
                        </div>
                        {photos.length === 0 && <p className="text-gray-500 text-center py-8">No photos for this product.</p>}
                      </div>
                    )
                })}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2"><LinkIcon className="w-5 h-5 text-cyan-400"/><span>Social Links</span></h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Discord URL</label>
                    <input type="url" value={settings.discord_url || ''} onChange={(e) => setSettings({...settings, discord_url: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="https://discord.gg/..."/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp URL</label>
                    <input type="url" value={settings.whatsapp_url || ''} onChange={(e) => setSettings({...settings, whatsapp_url: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="https://api.whatsapp.com/send?phone=..."/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telegram URL</label>
                    <input type="url" value={settings.telegram_url || ''} onChange={(e) => setSettings({...settings, telegram_url: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="https://t.me/..."/>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2"><Package className="w-5 h-5 text-purple-400"/><span>Product Card Display</span></h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Important Note Text</label>
                        <textarea
                            value={settings.product_card_note || ''}
                            onChange={(e) => setSettings({...settings, product_card_note: e.target.value})}
                            rows={3}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                            placeholder="e.g., After purchase, contact us to get your key and product"
                        />
                    </div>
                    <ToggleSwitch
                        label="Show WhatsApp Button in Card"
                        enabled={settings.show_whatsapp_button === 'true'}
                        onChange={(enabled) => setSettings({...settings, show_whatsapp_button: String(enabled)})}
                    />
                    <ToggleSwitch
                        label="Show Telegram Button in Card"
                        enabled={settings.show_telegram_button === 'true'}
                        onChange={(enabled) => setSettings({...settings, show_telegram_button: String(enabled)})}
                    />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveSettings} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex justify-end mb-6">
                <button onClick={() => setIsAddingProduct(true)} className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all duration-300"><Plus className="w-5 h-5" /><span>Add Product</span></button>
              </div>
              {(isAddingProduct || editingProduct) && (
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                  <h2 className="text-xl font-bold text-white mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label><input type="text" value={newProduct.title} onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="Enter product name" required/></div>
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Price ($) *</label><input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="Enter price" required/></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-300 mb-2">Category *</label><select value={newProduct.category_id} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" required><option value="">Select Category</option>{categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}</select></div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Method *</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="purchase_method" 
                                    checked={newProduct.purchase_image_id === null} 
                                    onChange={() => setNewProduct({...newProduct, purchase_image_id: null})} 
                                    className="text-cyan-500 focus:ring-cyan-500" 
                                /> 
                                <span className="text-gray-300">External Link</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="purchase_method" 
                                    checked={newProduct.purchase_image_id !== null} 
                                    onChange={() => setNewProduct({...newProduct, buy_link: '', purchase_image_id: ''})} 
                                    className="text-cyan-500 focus:ring-cyan-500" 
                                /> 
                                <span className="text-gray-300">QR Code Image</span>
                            </label>
                        </div>
                    </div>

                    {newProduct.purchase_image_id === null ? (
                      <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-300 mb-2">Buy Link *</label><input type="url" value={newProduct.buy_link} onChange={(e) => setNewProduct({...newProduct, buy_link: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="https://..." required/></div>
                    ) : (
                      <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-300 mb-2">Purchase Image *</label><select value={newProduct.purchase_image_id || ''} onChange={(e) => setNewProduct({...newProduct, purchase_image_id: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" required><option value="">Select a purchase image</option>{purchaseImages.map((img) => (<option key={img.id} value={img.id}>{img.name}</option>))}</select></div>
                    )}

                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Gameplay Video Link</label><input type="url" value={newProduct.video_link || ''} onChange={(e) => setNewProduct({...newProduct, video_link: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="Enter YouTube/video link (optional)"/></div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Product Image</label>
                        <div className="mt-2 flex items-center space-x-6">
                            <div className="shrink-0">
                                <img className="h-20 w-20 object-contain rounded-lg border border-slate-600" src={imagePreviewUrl || newProduct.image || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/100x100/1f2937/38bdf8?text=No+Image'} alt="Product preview"/>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                    <button type="button" onClick={() => productImageInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                        <UploadCloud className="w-4 h-4" />
                                        <span>Upload</span>
                                    </button>
                                    <input ref={productImageInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleProductImageFileChange}/>
                                    <button type="button" onClick={() => setShowImageSelector(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors text-sm">
                                        <ImageIcon className="w-4 h-4" />
                                        <span>Library</span>
                                    </button>
                                    {(newProduct.image || imageUploadFile) && (
                                        <button type="button" onClick={handleRemoveImage} className="flex items-center space-x-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 rounded-xl transition-colors text-sm">
                                            <Trash2 className="w-4 h-4" />
                                            <span>Remove</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Upload a new image or select one from the library.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3"><input type="checkbox" id="isPopular" checked={newProduct.is_popular} onChange={(e) => setNewProduct({...newProduct, is_popular: e.target.checked})} className="w-5 h-5 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"/><label htmlFor="isPopular" className="text-sm font-medium text-gray-300">Popular Product</label></div>
                    <div className="flex items-center space-x-3"><input type="checkbox" id="isHidden" checked={newProduct.is_hidden} onChange={(e) => setNewProduct({...newProduct, is_hidden: e.target.checked})} className="w-5 h-5 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"/><label htmlFor="isHidden" className="text-sm font-medium text-gray-300">Hidden Product</label></div>
                  </div>
                  <div className="mt-6"><label className="block text-sm font-medium text-gray-300 mb-2">Description</label><textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} rows={3} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="Enter product description"/></div>
                  <div className="mt-6"><label className="block text-sm font-medium text-gray-300 mb-2">Features</label>{newProduct.features.map((feature, index) => (<div key={index} className="flex items-center space-x-2 mb-2"><input type="text" value={feature} onChange={(e) => updateFeature(index, e.target.value)} className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="Enter a product feature"/>{newProduct.features.length > 1 && (<button onClick={() => removeFeature(index)} className="p-2 text-red-400 hover:text-red-300 transition-colors"><X className="w-5 h-5" /></button>)}</div>))}<button onClick={addFeature} className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">+ Add another feature</button></div>
                  <div className="flex justify-end space-x-4 mt-6"><button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); resetProductForm(); }} disabled={saving} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors disabled:opacity-50">Cancel</button><button onClick={editingProduct ? handleUpdateProduct : handleAddProduct} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50">{saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}</button></div>
                </div>
              )}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-700"><tr><th className="text-left p-4 text-gray-300 font-medium">Product</th><th className="text-left p-4 text-gray-300 font-medium">Price</th><th className="text-left p-4 text-gray-300 font-medium">Category</th><th className="text-left p-4 text-gray-300 font-medium">Purchase Type</th><th className="text-left p-4 text-gray-300 font-medium">Status</th><th className="text-left p-4 text-gray-300 font-medium">Actions</th></tr></thead><tbody>{products.map((product) => (<tr key={product.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"><td className="p-4"><div className="flex items-center space-x-3">{product.image && (<img src={product.image} alt={product.title} className="w-10 h-10 object-contain rounded-lg border border-slate-600" onError={(e) => {(e.target as HTMLImageElement).style.display = 'none';}}/>)}<div><p className="text-white font-medium">{product.title}</p><p className="text-gray-400 text-sm">{product.features.join(', ')}</p></div></div></td><td className="p-4 text-cyan-400 font-bold">${product.price}</td><td className="p-4 text-gray-300">{getCategoryName(product.category_id || '')}</td><td className="p-4 text-gray-300">{product.purchase_image_id ? <div className="flex items-center space-x-2"><QrCode className="w-4 h-4 text-green-400"/><span>QR Code</span></div> : <div className="flex items-center space-x-2"><LinkIcon className="w-4 h-4 text-blue-400"/><span>Link</span></div>}</td><td className="p-4"><div className="flex items-center space-x-2">{product.is_popular && (<span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">Popular</span>)}{product.is_hidden && (<span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">Hidden</span>)}{!product.is_popular && !product.is_hidden && (<span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Visible</span>)}</div></td><td className="p-4"><div className="flex items-center space-x-2"><button onClick={() => handleToggleProductVisibility(product.id, product.is_hidden || false)} disabled={saving} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50" title={product.is_hidden ? 'Show Product' : 'Hide Product'}>{product.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button><button onClick={() => handleEditProduct(product)} disabled={saving} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteProduct(product.id)} disabled={saving} className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-end mb-6">
                <button onClick={() => setIsAddingCategory(true)} className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl transition-all duration-300"><Tag className="w-5 h-5" /><span>Add Category</span></button>
              </div>
              {isAddingCategory && (
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                  <h2 className="text-xl font-bold text-white mb-6">Add New Category</h2>
                  <div className="flex items-center space-x-4">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="Enter category name"/>
                    <button onClick={handleAddCategory} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50">{saving ? 'Adding...' : 'Add'}</button>
                    <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} disabled={saving} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors disabled:opacity-50">Cancel</button>
                  </div>
                </div>
              )}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700"><h2 className="text-xl font-bold text-white">Categories ({categories.length})</h2></div>
                <div className="p-6"><div className="grid md:grid-cols-3 gap-4">{categories.map((category) => (<div key={category.id} className="bg-slate-700 rounded-xl p-4 flex items-center justify-between"><div><h3 className="text-white font-medium">{category.name}</h3><p className="text-gray-400 text-sm">{category.slug}</p></div><button onClick={() => handleDeleteCategory(category.id)} disabled={saving} className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><X className="w-4 h-4" /></button></div>))}</div></div>
              </div>
            </div>
          )}
          
          {selectedPhotos.length > 0 && activeTab === 'photos' && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-700 rounded-xl p-3 flex items-center gap-4 shadow-2xl animate-fade-in-up">
                <span className="text-white font-medium px-2">{selectedPhotos.length} photos selected</span>
                <button onClick={() => setShowMoveModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                  <Move className="w-4 h-4" /> Move
                </button>
                <button onClick={handleDeleteSelected} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> {saving ? 'Deleting...' : 'Delete'}
                </button>
                <button onClick={() => setSelectedPhotos([])} className="p-2 text-gray-400 hover:text-white rounded-full bg-slate-700 hover:bg-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showImageSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-white">Select an Image</h3><button onClick={() => setShowImageSelector(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
            <div className="mb-6"><div className="flex items-center space-x-4"><span className="text-gray-300 text-sm">Filter:</span><select value={selectedImageCategory} onChange={(e) => setSelectedImageCategory(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"><option value="all">All Images</option><option value="logos">Logos</option></select></div></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{getFilteredImages().map((image) => (<div key={image.id} className="bg-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-600 transition-colors border-2 border-transparent hover:border-cyan-500" onClick={() => handleSelectImage(image.path)}><img src={image.path} alt={image.name} className="w-full h-24 object-contain rounded-lg mb-3"/><p className="text-white text-sm font-medium text-center">{image.name}</p><p className="text-gray-400 text-xs text-center mt-1 capitalize">{image.category}</p></div>))}{getFilteredImages().length === 0 && (<div className="text-center py-8"><ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-400">No images in this category.</p></div>)}</div>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-4">Move Selected Photos</h3>
            <p className="text-gray-400 mb-6">Move {selectedPhotos.length} photos to another product category.</p>
            <select 
              value={moveTargetProduct} 
              onChange={(e) => setMoveTargetProduct(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select destination product</option>
              {WINNING_PHOTO_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">Cancel</button>
              <button onClick={handleMoveSelected} disabled={!moveTargetProduct || saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Moving...' : 'Move Photos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
