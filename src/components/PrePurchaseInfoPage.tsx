import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, purchaseIntentsService, Product } from '../lib/supabase';
import { AnimatedBackground } from './AnimatedBackground';
import { AlertTriangle, ArrowRight, Home, Mail, Phone, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { countries } from '../data/countries';
import SearchableSelect from './SearchableSelect';

type Lang = 'en' | 'ar' | 'tr';

const PrePurchaseInfoPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    
    const { lang, setLang, t } = useLanguage();

    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<{ country?: string, email?: string; phone?: string; general?: string }>({});

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) {
                setFetchError(t.error);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const productData = await productService.getProductById(productId);
                setProduct(productData);
            } catch (err: any) {
                setFetchError(t.error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId, t.error]);

    const validateForm = () => {
        const newErrors: { country?: string, email?: string; phone?: string; general?: string } = {};
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            newErrors.email = t.emailRequired;
        } else if (!emailRegex.test(email)) {
            newErrors.email = t.emailInvalid;
        }

        const phoneRegex = /^[+]?[0-9\s-]{7,20}$/;
        if (!phone) {
            newErrors.phone = t.phoneRequired;
        } else if (!phoneRegex.test(phone)) {
            newErrors.phone = t.phoneInvalid;
        }

        if (!country) {
            newErrors.country = t.countryRequired;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !product) {
            return;
        }
        
        setSaving(true);
        setErrors({});

        try {
            await purchaseIntentsService.addIntent({
                product_id: product.id,
                product_title: product.title,
                country,
                email,
                phone_number: phone,
            });

            if (product.purchase_image_id) {
                navigate(`/pay/${product.id}`);
            } else if (product.buy_link) {
                navigate(`/link-pay/${product.id}`);
            } else {
                setErrors({ general: 'No payment method configured for this product.' });
                setSaving(false);
            }
        } catch (err: any) {
            setErrors({ general: err.message || 'Failed to save your information.' });
            setSaving(false);
        }
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

    if (fetchError || !product) {
        return (
             <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg z-10">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
                    <p className="text-red-300 mb-6">{fetchError || 'Product not found.'}</p>
                    <Link to="/" className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors">
                        <Home className="w-5 h-5" />
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
                            {t.prePurchaseTitle}
                        </h1>
                        <p className="text-gray-300">{t.prePurchaseSubtitle}</p>
                        <p className="text-lg font-semibold text-cyan-300 mt-4">{product.title}</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <SearchableSelect
                              label={t.countryLabel}
                              options={countries.map(c => c.name)}
                              value={country}
                              onChange={setCountry}
                              placeholder={t.countryPlaceholder}
                            />
                            {errors.country && <p className="text-red-400 text-xs mt-1 px-1">{errors.country}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t.emailLabel}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500" placeholder={t.emailPlaceholder} />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1 px-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t.phoneLabel}</label>
                            <div className="relative">
                                <Phone className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500" placeholder={t.phonePlaceholder} />
                            </div>
                            {errors.phone && <p className="text-red-400 text-xs mt-1 px-1">{errors.phone}</p>}
                        </div>
                    </div>
                    
                    <div className="pt-8">
                        {errors.general && (
                            <div className="text-center text-sm text-red-400 mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                {errors.general}
                            </div>
                        )}
                        <button 
                            onClick={handleSubmit} 
                            disabled={saving}
                            className="w-full flex items-center justify-center space-x-3 rtl:space-x-reverse bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-bold px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    <span>{t.savingInfo}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t.proceedToPurchaseButton}</span>
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center space-x-2 rtl:space-x-reverse">
                            <Home className="w-4 h-4" />
                            <span>{t.backToProducts}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrePurchaseInfoPage;
