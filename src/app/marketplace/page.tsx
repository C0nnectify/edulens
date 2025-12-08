"use client";

import React, { useState } from "react";

import Navigation from "@/components/Navigation";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import SmartPicksSection from "@/components/marketplace/SmartPicksSection";
import CategoryCards from "@/components/marketplace/CategoryCards";
import ProductFilters from "@/components/marketplace/ProductFilters";
import ProductGrid from "@/components/marketplace/ProductGrid";
import SellOnMarketplaceCTA from "@/components/marketplace/SellOnMarketplaceCTA";
import StickyCart from "@/components/marketplace/StickyCart";
import ExitIntentModal from "@/components/marketplace/ExitIntentModal";
import Cart from "@/components/marketplace/Cart";


export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);


  // Handle filters
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePriceChange = (range: number[]) => {
    setPriceRange(range);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  // Exit intent detection
  React.useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowExitIntent(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header Section */}
      <MarketplaceHeader onCategorySelect={handleCategoryChange} />
      
      {/* Smart Picks Section */}
      <SmartPicksSection />
      
      {/* Category Cards */}
      <CategoryCards onCategorySelect={handleCategoryChange} />
      
      {/* Filters and Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductFilters
          selectedCategory={selectedCategory}
          priceRange={priceRange}
          sortBy={sortBy}
          showFilters={showFilters}
          onCategoryChange={handleCategoryChange}
          onPriceChange={handlePriceChange}
          onSortChange={handleSortChange}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />
        
        <ProductGrid
          selectedCategory={selectedCategory}
          priceRange={priceRange}
          sortBy={sortBy}
        />
      </div>
      
      {/* Sell on Marketplace CTA */}
      <SellOnMarketplaceCTA />
      
      {/* Sticky Cart */}
      <StickyCart onOpenCart={() => setShowCart(true)} />
      
      {/* Cart Modal */}
      <Cart open={showCart} onClose={() => setShowCart(false)} />
      
      {/* Exit Intent Modal */}
      <ExitIntentModal 
        open={showExitIntent} 
        onClose={() => setShowExitIntent(false)} 
      />
    </div>
  );
} 