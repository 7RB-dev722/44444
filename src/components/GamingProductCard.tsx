import React from 'react';
import { Eye, Target, Zap, Shield, MessageCircle, Phone, Star, Crown, Gem, Image as ImageIcon, PlayCircle, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '@/lib/utils';

interface GamingProductCardProps {
  id?: string;
  title: string;
  price: number;
  features: string[];
  description: string;
  safety: string;
  buyLink?: string | null;
  videoLink?: string | null;
  tier: 'basic' | 'premium' | 'exclusive';
  isPopular?: boolean;
  image?: string;
  brand: 'cheatloop' | 'sinki';
  purchase_image_id?: string | null;
}

export const GamingProductCard: React.FC<GamingProductCardProps> = ({
  id,
  title,
  price,
  features,
  description,
  safety,
  buyLink,
  videoLink,
  tier,
  isPopular = false,
  image,
  brand,
  purchase_image_id
}) => {
  const { settings, loading } = useSettings();
  const cardSize = settings.product_card_size || 'default';

  const sizeStyles = {
    compact: {
      wrapper: 'p-4 max-w-xs',
      image: 'w-16 h-16',
      title: 'text-lg mb-2',
      price: 'text-3xl',
      features: 'space-y-2 mb-4',
      featureText: 'text-xs',
      description: 'text-xs',
      buyButton: 'py-3 px-6 text-base',
      contactButton: 'p-2',
      contactText: 'text-xs',
    },
    default: {
      wrapper: 'p-6 max-w-sm',
      image: 'w-20 h-20',
      title: 'text-xl mb-3',
      price: 'text-4xl',
      features: 'space-y-3 mb-6',
      featureText: 'text-sm',
      description: 'text-sm',
      buyButton: 'py-4 px-8 text-lg',
      contactButton: 'p-3',
      contactText: 'text-sm',
    },
    large: {
      wrapper: 'p-8 max-w-md',
      image: 'w-24 h-24',
      title: 'text-2xl mb-4',
      price: 'text-5xl',
      features: 'space-y-3 mb-8',
      featureText: 'text-base',
      description: 'text-base',
      buyButton: 'py-5 px-10 text-xl',
      contactButton: 'p-4',
      contactText: 'text-base',
    }
  };

  const styles = sizeStyles[cardSize as keyof typeof sizeStyles] || sizeStyles.default;

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('esp')) return <Eye className="w-4 h-4" />;
    if (feature.toLowerCase().includes('aimbot')) return <Target className="w-4 h-4" />;
    if (feature.toLowerCase().includes('magic bullet')) return <Zap className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getTierIcon = () => {
    switch (tier) {
      case 'basic': return <Star className="w-4 h-4" />;
      case 'premium': return <Crown className="w-4 h-4" />;
      case 'exclusive': return <Gem className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'basic': return 'from-green-500 to-emerald-500';
      case 'premium': return 'from-purple-500 to-pink-500';
      case 'exclusive': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getBrandColors = () => {
    if (brand === 'cheatloop') {
      return {
        gradient: 'from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700',
        border: 'border-cyan-500/20',
        noteColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        accent: 'text-cyan-400',
        buyButton: {
          bg: 'bg-gradient-to-r from-cyan-600 to-blue-600',
          hoverBg: 'hover:from-blue-600 hover:to-pink-600',
          border: 'border-cyan-500',
          hoverBorder: 'hover:border-pink-500',
          electricColor1: '#00d4ff', // cyan electric
          electricColor2: '#ff6bff'  // pink electric
        }
      };
    } else {
      return {
        gradient: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
        border: 'border-purple-500/20',
        noteColor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        accent: 'text-purple-400',
        buyButton: {
          bg: 'bg-gradient-to-r from-purple-600 to-pink-600',
          hoverBg: 'hover:from-blue-600 hover:to-pink-600',
          border: 'border-purple-500',
          hoverBorder: 'hover:border-blue-500',
          electricColor1: '#a855f7', // purple electric
          electricColor2: '#3b82f6'  // blue electric
        }
      };
    }
  };

  const getGalleryLink = () => {
    let productQuery = 'Cheatloop PUBG'; // Default for Cheatloop
    if (brand === 'sinki') {
        productQuery = 'Sinki';
    } else if (title.toLowerCase().includes('codm')) {
        productQuery = 'Cheatloop CODM';
    }
    return `/winning-photos?product=${encodeURIComponent(productQuery)}`;
  };

  const colors = getBrandColors();

  const BuyButtonContent = () => {
    const commonClasses = cn(`
      block w-full text-center text-white 
      rounded-[5rem] border-[5px] 
      leading-none tracking-wider transition-all duration-300
      hover:cursor-pointer relative z-10
      flex items-center justify-center space-x-2
      `,
      styles.buyButton,
      colors.buyButton.bg,
      colors.buyButton.hoverBg,
      colors.buyButton.border,
      colors.buyButton.hoverBorder,
      'hover:shadow-lg hover:shadow-current/25'
    );

    const isCodmProduct = title.toLowerCase().includes('codm') || title.toLowerCase().includes('call of duty');
    const destination = buyLink ? buyLink : (id && purchase_image_id ? `/pay/${id}` : null);
    
    if (!id || !destination) {
      return (
        <button disabled className="w-full py-4 px-6 rounded-xl font-bold text-gray-400 bg-gray-600 cursor-not-allowed opacity-50">
          Coming Soon
        </button>
      );
    }
    
    const compatibilityCheckUrl = `/check-compatibility/${id}?redirect=${encodeURIComponent(destination)}`;
    const finalUrl = isCodmProduct ? destination : compatibilityCheckUrl;

    return (
      <Link to={finalUrl} className={commonClasses}>
        {purchase_image_id && <QrCode className="w-5 h-5" />}
        <span>{purchase_image_id ? 'Pay with QR' : 'Buy Now'}</span>
      </Link>
    );
  };

  return (
    <div className={cn(`
      relative group mx-auto w-full
      bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-black/60 
      backdrop-blur-xl rounded-2xl border transition-all duration-300
      hover:scale-[1.02] hover:-translate-y-1
      `,
      styles.wrapper,
      isPopular ? `${colors.border}` : 'border-slate-700/30 hover:border-cyan-500/20'
    )}>
      
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className={`
            bg-gradient-to-r ${colors.gradient} 
            text-white px-4 py-2 rounded-full text-sm font-bold
            shadow-md animate-bounce
            flex items-center space-x-2
          `}>
            <Star className="w-4 h-4 animate-spin-slow" />
            <span>MOST POPULAR</span>
            <Star className="w-4 h-4 animate-reverse-spin" />
          </div>
        </div>
      )}

      <div className="absolute -top-2 -right-2 z-10">
        <div className={`
          bg-gradient-to-r ${getTierColor()}
          text-white p-2 rounded-full shadow-md
          transform rotate-12 group-hover:rotate-0 transition-transform duration-300
        `}>
          {getTierIcon()}
        </div>
      </div>
      
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-r ${colors.gradient} rounded-full opacity-5 animate-float`}></div>
        <div className={`absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-r ${colors.gradient} rounded-full opacity-5 animate-float`} style={{ animationDelay: '2s' }}></div>
      </div>
      
      {image && (
        <div className="mb-6 flex justify-center relative">
          <div className="relative group-hover:scale-105 transition-transform duration-300">
            <img 
              src={image} 
              alt={title} 
              className={cn("object-contain filter drop-shadow-lg", styles.image)}
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} rounded-lg blur-xl opacity-10 -z-10 animate-pulse`}></div>
          </div>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className={cn("font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300", styles.title)}>
          {title}
        </h3>
        <div className="relative">
          <div className={cn(`font-bold mb-2 animate-pulse ${colors.accent}`, styles.price)}>
            ${price}
          </div>
          <div className="text-sm text-gray-400 uppercase tracking-wider font-medium">
            {tier} Edition
          </div>
        </div>
      </div>
      
      <div className={cn("mb-6", styles.features)}>
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-3 text-gray-300 group-hover:text-white transition-colors duration-300"
            style={{ 
              animation: `slideInRight 0.5s ease-out ${index * 0.1}s both` 
            }}
          >
            <div className={`${colors.accent} group-hover:scale-110 transition-transform duration-300`}>
              {getFeatureIcon(feature)}
            </div>
            <span className={cn("font-medium", styles.featureText)}>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <Shield className="w-5 h-5 text-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-bold">{safety}</span>
        </div>
      </div>

      <div className="mb-6">
        <p className={cn("text-gray-400 leading-relaxed line-clamp-3 group-hover:text-gray-300 transition-colors duration-300", styles.description)}>
          {description}
        </p>
      </div>

      <div className={`mb-6 p-4 ${colors.noteColor} border rounded-xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-gradient-shift"></div>
        <div className="relative z-10">
          <div>
            {!loading && settings.show_product_card_note !== 'false' && settings.product_card_note && (
              <div className="flex items-start space-x-2 mb-4">
                <div className="text-current mt-0.5 animate-bounce">⚠️</div>
                <div>
                  <p className="text-current text-sm font-bold mb-2">Important Note</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {settings.product_card_note}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <Link
              to={getGalleryLink()}
              className={cn("group/btn relative rounded-xl backdrop-blur-xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/40 via-black-900/60 to-black/80 shadow-lg hover:shadow-yellow-500/30 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-yellow-400/60 overflow-hidden", styles.contactButton)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 via-yellow-400/20 to-yellow-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/30 to-yellow-600/10 backdrop-blur-sm group-hover/btn:from-yellow-400/40 group-hover/btn:to-yellow-500/20 transition-all duration-300">
                  <ImageIcon className="w-5 h-5 text-yellow-400 group-hover/btn:text-yellow-300 transition-all duration-300 group-hover/btn:scale-110 drop-shadow-lg" />
                </div>
                <div className="flex-1 text-left">
                  <p className={cn("text-yellow-400 font-bold group-hover/btn:text-yellow-300 transition-colors duration-300 drop-shadow-sm", styles.contactText)}>
                    Winning Photos
                  </p>
                  <p className="text-yellow-300/60 text-xs group-hover/btn:text-yellow-200/80 transition-colors duration-300">
                    See customer results
                  </p>
                </div>
                <div className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all duration-300">
                  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-4 h-4 text-yellow-400">
                    <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                  </svg>
                </div>
              </div>
            </Link>

            {videoLink && (
              <a
                href={videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("group/btn relative rounded-xl backdrop-blur-xl border-2 border-red-500/30 bg-gradient-to-br from-red-900/40 via-black-900/60 to-black/80 shadow-lg hover:shadow-red-500/30 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-red-400/60 overflow-hidden", styles.contactButton)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/10 via-red-400/20 to-red-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/30 to-red-600/10 backdrop-blur-sm group-hover/btn:from-red-400/40 group-hover/btn:to-red-500/20 transition-all duration-300">
                    <PlayCircle className="w-5 h-5 text-red-400 group-hover/btn:text-red-300 transition-all duration-300 group-hover/btn:scale-110 drop-shadow-lg" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn("text-red-400 font-bold group-hover/btn:text-red-300 transition-colors duration-300 drop-shadow-sm", styles.contactText)}>
                      Gameplay Video
                    </p>
                    <p className="text-red-300/60 text-xs group-hover/btn:text-red-200/80 transition-colors duration-300">
                      Watch in action
                    </p>
                  </div>
                  <div className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all duration-300">
                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-4 h-4 text-red-400">
                      <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                    </svg>
                  </div>
                </div>
              </a>
            )}

            {!loading && settings.show_whatsapp_button === 'true' && settings.show_all_whatsapp_buttons !== 'false' && (
              <a
                href={loading ? '#' : settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("group/btn relative rounded-xl backdrop-blur-xl border-2 border-green-500/30 bg-gradient-to-br from-green-900/40 via-black-900/60 to-black/80 shadow-lg hover:shadow-green-500/30 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-green-400/60 overflow-hidden", styles.contactButton)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 via-green-400/20 to-green-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/30 to-green-600/10 backdrop-blur-sm group-hover/btn:from-green-400/40 group-hover/btn:to-green-500/20 transition-all duration-300">
                    <Phone className="w-5 h-5 text-green-400 group-hover/btn:text-green-300 transition-all duration-300 group-hover/btn:scale-110 drop-shadow-lg" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn("text-green-400 font-bold group-hover/btn:text-green-300 transition-colors duration-300 drop-shadow-sm", styles.contactText)}>
                      WhatsApp
                    </p>
                    <p className="text-green-300/60 text-xs group-hover/btn:text-green-200/80 transition-colors duration-300">
                      Direct support
                    </p>
                  </div>
                  <div className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all duration-300">
                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-4 h-4 text-green-400">
                      <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                    </svg>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col gap-4">
        <div className="voltage-button relative group w-full">
          <BuyButtonContent />
          
          <svg 
            className="
              block absolute -top-3 -left-1 w-[calc(100%+0.5rem)] h-[calc(100%+1.5rem)]
              pointer-events-none opacity-0 transition-opacity duration-400 delay-100
              group-hover:opacity-100
            "
            version="1.1" 
            xmlns="http://www.w3.org/2000/svg" 
            x="0px" 
            y="0px" 
            viewBox="0 0 234.6 61.3" 
            preserveAspectRatio="none"
          >
            <defs>
              <filter id={`glow-${brand}`}>
                <feGaussianBlur className="blur" result="coloredBlur" stdDeviation="2"></feGaussianBlur>
                <feTurbulence type="fractalNoise" baseFrequency="0.075" numOctaves="0.3" result="turbulence"></feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="30" xChannelSelector="R" yChannelSelector="G" result="displace"></feDisplacementMap>
                <feMerge>
                  <feMergeNode in="coloredBlur"></feMergeNode>
                  <feMergeNode in="coloredBlur"></feMergeNode>
                  <feMergeNode in="coloredBlur"></feMergeNode>
                  <feMergeNode in="displace"></feMergeNode>
                  <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
              </filter>
            </defs>
            
            <path 
              className="voltage line-1 stroke-dasharray-[100] stroke-dashoffset-0 animate-spark-1" 
              d="m216.3 51.2c-3.7 0-3.7-1.1-7.3-1.1-3.7 0-3.7 6.8-7.3 6.8-3.7 0-3.7-4.6-7.3-4.6-3.7 0-3.7 3.6-7.3 3.6-3.7 0-3.7-0.9-7.3-0.9-3.7 0-3.7-2.7-7.3-2.7-3.7 0-3.7 7.8-7.3 7.8-3.7 0-3.7-4.9-7.3-4.9-3.7 0-3.7-7.8-7.3-7.8-3.7 0-3.7-1.1-7.3-1.1-3.7 0-3.7 3.1-7.3 3.1-3.7 0-3.7 10.9-7.3 10.9-3.7 0-3.7-12.5-7.3-12.5-3.7 0-3.7 4.6-7.3 4.6-3.7 0-3.7 4.5-7.3 4.5-3.7 0-3.7 3.6-7.3 3.6-3.7 0-3.7-10-7.3-10-3.7 0-3.7-0.4-7.3-0.4-3.7 0-3.7 2.3-7.3 2.3-3.7 0-3.7 7.1-7.3 7.1-3.7 0-3.7-11.2-7.3-11.2-3.7 0-3.7 3.5-7.3 3.5-3.7 0-3.7 3.6-7.3 3.6-3.7 0-3.7-2.9-7.3-2.9-3.7 0-3.7 8.4-7.3 8.4-3.7 0-3.7-14.6-7.3-14.6-3.7 0-3.7 5.8-7.3 5.8-2.2 0-3.8-0.4-5.5-1.5-1.8-1.1-1.8-2.9-2.9-4.8-1-1.8 1.9-2.7 1.9-4.8 0-3.4-2.1-3.4-2.1-6.8s-9.9-3.4-9.9-6.8 8-3.4 8-6.8c0-2.2 2.1-2.4 3.1-4.2 1.1-1.8 0.2-3.9 2-5 1.8-1 3.1-7.9 5.3-7.9 3.7 0 3.7 0.9 7.3 0.9 3.7 0 3.7 6.7 7.3 6.7 3.7 0 3.7-1.8 7.3-1.8 3.7 0 3.7-0.6 7.3-0.6 3.7 0-3.7-7.8 7.3-7.8h7.3c3.7 0 3.7 4.7 7.3 4.7 3.7 0 3.7-1.1 7.3-1.1 3.7 0 3.7 11.6 7.3 11.6 3.7 0 3.7-2.6 7.3-2.6 3.7 0 3.7-12.9 7.3-12.9 3.7 0 3.7 10.9 7.3 10.9 3.7 0 3.7 1.3 7.3 1.3 3.7 0 3.7-8.7 7.3-8.7 3.7 0 3.7 11.5 7.3 11.5 3.7 0 3.7-1.4 7.3-1.4 3.7 0 3.7-2.6 7.3-2.6 3.7 0 3.7-5.8 7.3-5.8 3.7 0 3.7-1.3 7.3-1.3 3.7 0 3.7 6.6 7.3 6.6s3.7-9.3 7.3-9.3c3.7 0 3.7 0.2 7.3 0.2 3.7 0 3.7 8.5 7.3 8.5 3.7 0 3.7 0.2 7.3 0.2 3.7 0 3.7-1.5 7.3-1.5 3.7 0 3.7 1.6 7.3 1.6s3.7-5.1 7.3-5.1c2.2 0 0.6 9.6 2.4 10.7s4.1-2 5.1-0.1c1 1.8 10.3 2.2 10.3 4.3 0 3.4-10.7 3.4-10.7 6.8s1.2 3.4 1.2 6.8 1.9 3.4 1.9 6.8c0 2.2 7.2 7.7 6.2 9.5-1.1 1.8-12.3-6.5-14.1-5.5-1.7 0.9-0.1 6.2-2.2 6.2z" 
              fill="transparent" 
              stroke={colors.buyButton.electricColor1}
              style={{ filter: `url(#glow-${brand})` }}
            />
            
            <path 
              className="voltage line-2 stroke-dasharray-[100] stroke-dashoffset-[500] animate-spark-2" 
              d="m216.3 52.1c-3 0-3-0.5-6-0.5s-3 3-6 3-3-2-6-2-3 1.6-6 1.6-3-0.4-6-0.4-3-1.2-6-1.2-3 3.4-6 3.4-3-2.2-6-2.2-3-3.4-6-3.4-3-0.5-6-0.5-3 1.4-6 1.4-3 4.8-6 4.8-3-5.5-6-5.5-3 2-6 2-3 2-6 2-3 1.6-6 1.6-3-4.4-6-4.4-3-0.2-6-0.2-3 1-6 1-3 3.1-6 3.1-3-4.9-6-4.9-3 1.5-6 1.5-3 1.6-6 1.6-3-1.3-6-1.3-3 3.7-6 3.7-3-6.4-6-6.4-3 2.5-6 2.5h-6c-3 0-3-0.6-6-0.6s-3-1.4-6-1.4-3 0.9-6 0.9-3 4.3-6 4.3-3-3.5-6-3.5c-2.2 0-3.4-1.3-5.2-2.3-1.8-1.1-3.6-1.5-4.6-3.3s-4.4-3.5-4.4-5.7c0-3.4 0.4-3.4 0.4-6.8s2.9-3.4 2.9-6.8-0.8-3.4-0.8-6.8c0-2.2 0.3-4.2 1.3-5.9 1.1-1.8 0.8-6.2 2.6-7.3 1.8-1 5.5-2 7.7-2 3 0 3 2 6 2s3-0.5 6-0.5 3 5.1 6 5.1 3-1.1 6-1.1 3-5.6 6-5.6 3 4.8 6 4.8 3 0.6 6 0.6 3-3.8 6-3.8 3 5.1 6 5.1 3-0.6 6-0.6 3-1.2 6-1.2 3-2.6 6-2.6 3-0.6 6-0.6 3 2.9 6 2.9 3-4.1 6-4.1 3 0.1 6 0.1 3 3.7 6 3.7 3 0.1 6 0.1 3-0.6 6-0.6 3 0.7 6 0.7 3-2.2 6-2.2 3 4.4 6 4.4 3-1.7 6-1.7 3-4 6-4 3 4.7 6 4.7 3-0.5 6-0.5 3-0.8 6-0.8 3-3.8 6-3.8 3 6.3 6 6.3 3-4.8 6-4.8 3 1.9 6 1.9 3-1.9 6-1.9 3 1.3 6 1.3c2.2 0 5-0.5 6.7 0.5 1.8 1.1 2.4 4 3.5 5.8 1 1.8 0.3 3.7 0.3 5.9 0 3.4 3.4 3.4 3.4 6.8s-3.3 3.4-3.3 6.8 4 3.4 4 6.8c0 2.2-6 2.7-7 4.4-1.1 1.8 1.1 6.7-0.7 7.7-1.6 0.8-4.7-1.1-6.8-1.1z" 
              fill="transparent" 
              stroke={colors.buyButton.electricColor2}
              style={{ filter: `url(#glow-${brand})` }}
            />
          </svg>
          
          <div className="dots absolute inset-0 opacity-0 transition-opacity duration-300 delay-[400ms] group-hover:opacity-100">
            <div 
              className="dot dot-1 absolute w-4 h-4 rounded-full opacity-0 top-0 left-[20%] animate-fly-up"
              style={{ backgroundColor: colors.buyButton.electricColor1 }}
            ></div>
            <div 
              className="dot dot-2 absolute w-4 h-4 rounded-full opacity-0 top-0 left-[55%] animate-fly-up" 
              style={{ backgroundColor: colors.buyButton.electricColor2, animationDelay: '0.5s' }}
            ></div>
            <div 
              className="dot dot-3 absolute w-4 h-4 rounded-full opacity-0 top-0 left-[80%] animate-fly-up" 
              style={{ backgroundColor: colors.buyButton.electricColor1, animationDelay: '1s' }}
            ></div>
            <div 
              className="dot dot-4 absolute w-4 h-4 rounded-full opacity-0 bottom-0 left-[30%] animate-fly-down" 
              style={{ backgroundColor: colors.buyButton.electricColor2, animationDelay: '2.5s' }}
            ></div>
            <div 
              className="dot dot-5 absolute w-4 h-4 rounded-full opacity-0 bottom-0 left-[65%] animate-fly-down" 
              style={{ backgroundColor: colors.buyButton.electricColor1, animationDelay: '1.5s' }}
            ></div>
          </div>
        </div>
        {!loading && settings.show_telegram_button === 'true' && (
          <a
            href={settings.telegram_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("group/btn relative w-full text-center rounded-xl backdrop-blur-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/40 via-black-900/60 to-black/80 shadow-lg hover:shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-blue-400/60 overflow-hidden", styles.contactButton)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out"></div>
            <div className="relative z-10 flex items-center justify-center gap-3">
              <MessageCircle className="w-5 h-5 text-blue-400 group-hover/btn:text-blue-300 transition-all duration-300" />
              <span className={cn("text-blue-400 font-bold group-hover/btn:text-blue-300 transition-colors duration-300", styles.contactText)}>
                Contact on Telegram
              </span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};
