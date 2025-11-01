import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, purchaseImagesService, Product, PurchaseImage } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { AnimatedBackground } from './AnimatedBackground';
import { Home, AlertTriangle, Camera, Send, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import { Translations } from '../translations/en';

type Lang = 'en' | 'ar' | 'tr';

const ImagePaymentPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [purchaseImage, setPurchaseImage] = useState<PurchaseImage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { settings, loading: settingsLoading } = useSettings();
    const { lang, setLang, t } = useLanguage();
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (productId) {
            const fetchPaymentDetails = async () => {
                try {
                    setLoading(true);
                    const productData = await productService.getProductById(productId);
                    setProduct(productData);

                    if (!productData.purchase_image_id) {
                        setError("Image-based payment is not available for this product.");
                    } else {
                        const imageData = await purchaseImagesService.getById(productData.purchase_image_id);
                        setPurchaseImage(imageData);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to load payment details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPaymentDetails();
        }
    }, [productId]);
    
    const instructions = Array.from({ length: 5 }, (_, i) => {
        const step = i + 1;
        const textKey = `payment_instruction_step_${step}` as keyof Translations;
        const altKey = `payment_instruction_alt_${step}` as keyof Translations;
        
        return {
            text: settings[`payment_instruction_step_${step}_${lang}`] || t[textKey] || `Default text for step ${step}`,
            imageKey: `payment_instruction_image_${step}`,
            alt: t[altKey] || `Alt text for step ${step}`
        };
    });

    const openLightbox = (imageUrl: string) => {
        setLightboxImage(imageUrl);
    };

    const closeLightbox = () => {
        setLightboxImage(null);
    };

    const handleDetailsSubmit = (details: { email: string; phone: string; anydesk: string; }) => {
        const contactUrl = settings.telegram_purchase_url || settings.telegram_url;
        if (!product || !contactUrl) return;
        
        const message = `
        New Purchase Confirmation: ${product.title}
        Price: $${product.price}
        ---
        Email: ${details.email}
        Phone: ${details.phone || 'Not provided'}
        AnyDesk: ${details.anydesk || 'Not provided'}
        `;
        
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(contactUrl)}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
        
        setIsModalOpen(false);
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

    if (loading || settingsLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
                <AnimatedBackground />
                <div className="min-h-screen flex items-center justify-center relative z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                        <p className="text-white">{t.loading}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !purchaseImage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
                <AnimatedBackground />
                <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
                    <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
                        <p className="text-red-300 mb-6">{error || t.errorLoadingImage}</p>
                        <Link to="/" className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors">
                            <Home className="w-5 h-5" />
                            <span>{t.backToHome}</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            <div className="relative z-10 container mx-auto px-6 py-12">
                <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
                    <div className="flex justify-center space-x-2 mb-8">
                        <LangButton targetLang="en">English</LangButton>
                        <LangButton targetLang="ar">العربية</LangButton>
                        <LangButton targetLang="tr">Türkçe</LangButton>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            {t.payFor} {product.title}
                        </h1>
                        <p className="text-2xl font-bold text-cyan-300">${product.price}</p>
                    </div>

                    <div className="mb-8">
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-600 flex justify-center">
                            <div className="relative">
                                <img 
                                    src={purchaseImage.image_url} 
                                    alt={`${t.paymentFor} ${product.title}`} 
                                    className="rounded-lg max-w-xs w-full cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openLightbox(purchaseImage.image_url)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-3 rtl:space-x-reverse"><Camera className="w-6 h-6 text-cyan-400" /><span>{t.instructionsTitle}</span></h2>
                            <ol className="space-y-4 text-gray-300">
                                {instructions.map((item, i) => (
                                    <li key={i} className="flex items-start space-x-3 rtl:space-x-reverse">
                                        <span className="flex-shrink-0 bg-cyan-500/20 text-cyan-300 font-bold rounded-full h-6 w-6 flex items-center justify-center text-sm">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 pt-0.5">
                                            <p>{item.text}</p>
                                            {item.imageKey && settings[item.imageKey] && (
                                                <img 
                                                    src={settings[item.imageKey]} 
                                                    alt={item.alt} 
                                                    className="rounded-lg border border-slate-500 max-w-full h-auto mt-3 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => openLightbox(settings[item.imageKey] as string)}
                                                />
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>

                         <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600 text-center">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center space-x-3 rtl:space-x-reverse">
                                <Send className="w-6 h-6 text-blue-400" />
                                <span>{t.deliveryTitle}</span>
                            </h2>
                            <p className="text-gray-300 mb-6">{t.deliverySubtitle}</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full max-w-xs mx-auto py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                            >
                                {t.iHavePaidButton}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center space-x-2 rtl:space-x-reverse">
                            <Home className="w-4 h-4" />
                            <span>{t.backToProducts}</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            {lightboxImage && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
                    onClick={closeLightbox}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); closeLightbox(); }} 
                        className="absolute top-4 right-4 text-white hover:text-cyan-400 transition-colors p-2 z-[60] rounded-full bg-black/50"
                    >
                        <X size={32} />
                    </button>
                    
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={lightboxImage} 
                            alt="Enlarged instruction"
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl shadow-cyan-500/20"
                        />
                    </div>
                </div>
            )}

            {product && (
                <PurchaseDetailsModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSubmit={handleDetailsSubmit}
                  translations={t}
                />
            )}
        </div>
    );
};

export default ImagePaymentPage;
