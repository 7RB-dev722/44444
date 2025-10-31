import React, { useState, useEffect } from 'react';
import { GamingProductCard } from './GamingProductCard';
import { productService, categoryService, Product, Category } from '../lib/supabase';

export const ProductsGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allProducts, allCategories] = await Promise.all([
        productService.getVisibleProducts(), // Fetch only visible products
        categoryService.getAllCategories()
      ]);
      
      setProducts(allProducts);
      setCategories(allCategories);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load products from the database. Displaying fallback data.');
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // This function can be expanded with hardcoded data if needed
    console.warn("Loading fallback data as primary data source failed.");
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(product => product.category_id === categoryId);
  };

  if (loading) {
    return (
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-white">Loading Products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            animation: 'gridMove 25s linear infinite'
          }}
        ></div>
        
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-xl opacity-30 animate-float ${
              i % 3 === 0 ? 'bg-blue-500' : i % 3 === 1 ? 'bg-purple-500' : 'bg-pink-500'
            }`}
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {error && (
          <div className="text-center mb-8">
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-xl mb-6 max-w-2xl mx-auto">
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in-up">
            Gaming Arsenal
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Professional tools designed for competitive players. Choose your weapon and dominate the battlefield.
          </p>
          
          <div className="flex justify-center items-center space-x-4 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-cyan-400"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-transparent"></div>
          </div>
        </div>

        {categories.map((category, categoryIndex) => {
          const categoryProducts = getProductsByCategory(category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div 
              key={category.id} 
              className="mb-20"
              style={{
                animation: `fadeInUp 0.8s ease-out ${categoryIndex * 0.3}s both`
              }}
            >
              <div className="text-center mb-12">
                <div className="relative inline-block">
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 relative z-10">
                    {category.name}
                  </h3>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-2xl rounded-full transform scale-150"></div>
                </div>
                <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryProducts.map((product, productIndex) => (
                  <div 
                    key={product.id} 
                    className="flex justify-center"
                    style={{
                      animation: `fadeInUp 0.8s ease-out ${(categoryIndex * 0.3) + (productIndex * 0.1)}s both`
                    }}
                  >
                    <GamingProductCard 
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      features={product.features}
                      description={product.description}
                      safety="Safe for Main Accounts"
                      buyLink={product.buy_link}
                      videoLink={product.video_link}
                      tier={product.price <= 40 ? 'basic' : product.price <= 45 ? 'premium' : 'exclusive'}
                      isPopular={product.is_popular}
                      image={product.image}
                      brand={product.title.toLowerCase().includes('cheatloop') ? 'cheatloop' : 'sinki'}
                      purchase_image_id={product.purchase_image_id}
                    />
                  </div>
                ))}
              </div>

              {categoryIndex < categories.length - 1 && (
                <div className="mt-16 flex justify-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent to-gray-600"></div>
                    <div className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="w-32 h-0.5 bg-gradient-to-r from-gray-600 to-transparent"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {products.length === 0 && !loading && (
           <div className="text-center text-gray-400 py-12 animate-fade-in-up">
            <p>No products available at the moment. Please check back later.</p>
          </div>
        )}
      </div>
    </section>
  );
};
