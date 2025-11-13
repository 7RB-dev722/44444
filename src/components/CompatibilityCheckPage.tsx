import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService, Product } from '../lib/supabase';
import { AnimatedBackground } from './AnimatedBackground';
import { AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, ShoppingCart, Cpu, Check, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '../contexts/LanguageContext';

type Lang = 'en' | 'ar' | 'tr';

const SelectionGroup = ({ legend, value, onValueChange, options, gridCols = 2 }: { legend: string, value: string, onValueChange: (value: any) => void, options: {value: string, label: string, icon?: React.ReactNode}[], gridCols?: number }) => {
    const gridClass = gridCols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2';

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300 text-center sm:text-left">{legend}</h3>
            <RadioGroup value={value} onValueChange={onValueChange} className={`grid ${gridClass} gap-4`}>
                {options.map(opt => (
                    <Label 
                        key={opt.value} 
                        htmlFor={`${legend.replace(/\s/g, '-')}-${opt.value}`}
                        className={`
                            relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1
                            ${value === opt.value 
                                ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                                : 'bg-slate-700/40 border-slate-600 hover:border-slate-500'
                            }
                        `}
                    >
                        <RadioGroupItem value={opt.value} id={`${legend.replace(/\s/g, '-')}-${opt.value}`} className="sr-only" />
                        {opt.icon && <div className={`mb-2 transition-colors ${value === opt.value ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-300'}`}>{opt.icon}</div>}
                        <span className={`font-semibold text-center transition-colors ${value === opt.value ? 'text-white' : 'text-gray-300'}`}>{opt.label}</span>
                        {value === opt.value && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center animate-fade-in-up">
                                <Check size={12} className="text-slate-900" />
                            </div>
                        )}
                    </Label>
                ))}
            </RadioGroup>
        </div>
    );
};

const CompatibilityCheckPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { lang, setLang, t } = useLanguage();

    const [cpuType, setCpuType] = useState<'intel' | 'amd' | ''>('');
    const [gpuType, setGpuType] = useState<'nvidia' | 'amd' | 'intel' | ''>('');
    const [hasIntelIGPU, setHasIntelIGPU] = useState<'yes' | 'no' | ''>('');

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [checkResult, setCheckResult] = useState<'pending' | 'compatible' | 'incompatible'>('pending');
    
    useEffect(() => {
        const fetchData = async () => {
            if (!productId) {
                setError(t.error);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setCheckResult('pending');
                const [productData, allProductsData] = await Promise.all([
                    productService.getProductById(productId),
                    productService.getVisibleProducts()
                ]);

                if (productData && (productData.title.toLowerCase().includes('codm') || productData.title.toLowerCase().includes('call of duty'))) {
                    navigate(`/pre-purchase/${productData.id}`, { replace: true });
                    return;
                }

                setProduct(productData);
                setAllProducts(allProductsData);
            } catch (err: any) {
                setError(t.error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [productId, t.error, navigate]);

    const isFormComplete = cpuType && gpuType && hasIntelIGPU;

    const checkProductCompatibility = (productToCheck: Product, hardware: { gpuType: string; hasIntelIGPU: string }): { compatible: boolean; reason: 'sinki' | 'cheatloop' | null } => {
        const title = productToCheck.title.toLowerCase();
        
        if (title.includes('codm') || title.includes('call of duty')) {
            return { compatible: true, reason: null };
        }

        const brand = title.includes('sinki') ? 'sinki' : 'cheatloop';

        if (brand === 'sinki' && hardware.gpuType !== 'nvidia') {
            return { compatible: false, reason: 'sinki' };
        }

        if (brand === 'cheatloop' && hardware.hasIntelIGPU === 'yes') {
            return { compatible: false, reason: 'cheatloop' };
        }
        
        return { compatible: true, reason: null };
    };

    const handleCheckCompatibility = () => {
        if (!isFormComplete || !product) return;

        const { compatible } = checkProductCompatibility(product, { gpuType, hasIntelIGPU });

        if (compatible) {
            setCheckResult('compatible');
        } else {
            setCheckResult('incompatible');
            findSuggestions();
        }
    };

    const findSuggestions = () => {
        if (!isFormComplete) return;

        const hardware = { gpuType, hasIntelIGPU };
        const suggestions = allProducts.filter(p => {
            if (p.id === productId) return false;
            const { compatible } = checkProductCompatibility(p, hardware);
            return compatible;
        });
        setSuggestedProducts(suggestions);
    };

    const handleProceed = () => {
        if (!product) return;
        navigate(`/pre-purchase/${product.id}`);
    };

    const LangButton = ({ targetLang, children }: { targetLang: Lang, children: React.ReactNode }) => (
        <button
            onClick={() => setLang(targetLang)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                lang === targetLang
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 hover:text-white'
            }`}
        >
            {children}
        </button>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative flex items-center justify-center">
                <AnimatedBackground />
                <div className="text-center z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-white">{t.loading}</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
             <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg z-10">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
                    <p className="text-red-300 mb-6">{error || 'Product not found.'}</p>
                    <Link to="/" className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>{t.goBack}</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative text-white py-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            <div className="relative z-10 container mx-auto px-6">
                <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
                    <div className="flex justify-center space-x-2 mb-8">
                        <LangButton targetLang="en">English</LangButton>
                        <LangButton targetLang="ar">العربية</LangButton>
                        <LangButton targetLang="tr">Türkçe</LangButton>
                    </div>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            {t.compatibilityTitle}
                        </h1>
                        <p className="text-gray-300">{t.compatibilitySubtitle}</p>
                        <p className="text-lg font-semibold text-cyan-300 mt-4">{t.checkingFor} <span className="font-bold">{product.title}</span></p>
                    </div>

                    {checkResult === 'pending' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <SelectionGroup 
                                legend={t.cpuLabel} 
                                value={cpuType} 
                                onValueChange={setCpuType} 
                                options={[
                                    {value: 'intel', label: t.cpuIntel, icon: <Cpu size={28} />}, 
                                    {value: 'amd', label: t.cpuAmd, icon: <Cpu size={28} />}
                                ]} 
                            />
                            <SelectionGroup 
                                legend={t.gpuLabel} 
                                value={gpuType} 
                                onValueChange={setGpuType} 
                                options={[
                                    {value: 'nvidia', label: t.gpuNvidia, icon: <Cpu size={28} />}, 
                                    {value: 'amd', label: t.gpuAmd, icon: <Cpu size={28} />}, 
                                    {value: 'intel', label: t.gpuIntel, icon: <Cpu size={28} />}
                                ]}
                                gridCols={3} 
                            />
                            <SelectionGroup 
                                legend={t.igpuLabel} 
                                value={hasIntelIGPU} 
                                onValueChange={setHasIntelIGPU} 
                                options={[
                                    {value: 'yes', label: t.igpuYes, icon: <Check size={28} />}, 
                                    {value: 'no', label: t.igpuNo, icon: <X size={28} />}
                                ]} 
                            />
                            
                            <div className="pt-4">
                                <button 
                                    onClick={handleCheckCompatibility} 
                                    disabled={!isFormComplete}
                                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-bold px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span>{t.checkButton}</span>
                                </button>
                                {!isFormComplete && <p className="text-center text-sm text-yellow-400 mt-3">{t.fillAllFields}</p>}
                            </div>
                        </div>
                    )}

                    {checkResult === 'compatible' && (
                        <div className="text-center p-8 bg-green-500/10 border border-green-500/20 rounded-2xl animate-fade-in-up">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-white mb-2">{t.compatibleTitle}</h2>
                            <p className="text-green-300 mb-6">{t.compatibleMessage}</p>
                            
                            <button onClick={handleProceed} className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                                <span>{t.proceedButton}</span>
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    )}

                    {checkResult === 'incompatible' && (
                        <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl animate-fade-in-up">
                            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-white mb-2">{t.incompatibleTitle}</h2>
                            <p className="text-red-300 mb-6">
                                {t.incompatibleMessageGeneral}
                            </p>
                            
                            {suggestedProducts.length > 0 ? (
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-cyan-300 mb-4">{t.suggestionsTitle}</h3>
                                    <div className="space-y-3">
                                        {suggestedProducts.map(p => (
                                            <Link 
                                                key={p.id} 
                                                to={`/check-compatibility/${p.id}`} 
                                                className="block p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-white">{p.title}</span>
                                                    <ArrowRight className="w-5 h-5 text-cyan-400" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                 <p className="text-yellow-400 mt-4">{t.noSuggestions}</p>
                            )}
                        </div>
                    )}
                     <div className="mt-8 text-center">
                        <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center space-x-2">
                            <ShoppingCart className="w-4 h-4" />
                            <span>{t.backToProducts}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompatibilityCheckPage;
