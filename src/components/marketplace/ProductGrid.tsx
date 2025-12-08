
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, CheckCircle } from "lucide-react";
import { useCart } from "./useCart";

interface ProductGridProps {
  selectedCategory: string;
  priceRange: number[];
  sortBy: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ selectedCategory, priceRange, sortBy }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  
  const products = [
    {
      id: "product-1",
      title: "Comprehensive SOP Review",
      category: "admissions",
      type: "Editing",
      price: 79,
      originalPrice: 99,
      image: "https://images.unsplash.com/photo-1496307653780-42ee777d4842?auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      reviews: 342,
      deliveryTime: "48 Hours",
      studentsHelped: 1200,
      badges: ["Bestseller", "Verified"],
      bullets: ["Includes 2 Revisions", "Delivered in 48 Hours", "Used by 1,200+ Students"],
      description: "Get your statement of purpose professionally reviewed by admissions experts."
    },
    {
      id: "product-2",
      title: "Visa Interview Prep Session",
      category: "visa",
      type: "Coaching",
      price: 59,
      originalPrice: 79,
      image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      reviews: 128,
      deliveryTime: "Instant",
      studentsHelped: 850,
      badges: ["New", "Trusted"],
      bullets: ["1-on-1 Mock Interview", "Instant Booking", "Expert Feedback"],
      description: "Practice visa interviews with experienced coaches and boost your confidence."
    },
    {
      id: "product-3",
      title: "University Finder Tool",
      category: "tools",
      type: "Digital Tool",
      price: 19,
      originalPrice: 29,
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
      rating: 4.7,
      reviews: 567,
      deliveryTime: "Instant",
      studentsHelped: 2100,
      badges: ["AI-Powered"],
      bullets: ["Personalized Matches", "Instant Results", "Regular Updates"],
      description: "AI-powered tool to find universities that match your profile perfectly."
    },
    {
      id: "product-4",
      title: "Resume Builder Pro",
      category: "tools",
      type: "Digital Tool",
      price: 25,
      originalPrice: 35,
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80",
      rating: 4.6,
      reviews: 234,
      deliveryTime: "Instant",
      studentsHelped: 890,
      badges: ["Templates"],
      bullets: ["ATS-Friendly Templates", "Instant Download", "Multiple Formats"],
      description: "Create professional resumes with our ATS-friendly templates."
    },
    {
      id: "product-5",
      title: "Scholarship Search Kit",
      category: "tools",
      type: "Digital Tool",
      price: 39,
      originalPrice: 59,
      image: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      reviews: 156,
      deliveryTime: "24 Hours",
      studentsHelped: 750,
      badges: ["Curated"],
      bullets: ["Personalized List", "Application Tips", "Deadline Tracker"],
      description: "Get a curated list of scholarships tailored to your profile."
    },
    {
      id: "product-6",
      title: "IELTS Prep Course",
      category: "tools",
      type: "Course",
      price: 89,
      originalPrice: 129,
      image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
      rating: 4.7,
      reviews: 445,
      deliveryTime: "Instant",
      studentsHelped: 1500,
      badges: ["Complete Course"],
      bullets: ["Full Course Access", "Practice Tests", "Score Guarantee"],
      description: "Complete IELTS preparation course with practice tests and expert guidance."
    }
  ];

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    if (selectedCategory && selectedCategory !== "trending" && product.category !== selectedCategory) {
      return false;
    }
    if (product.price < priceRange[0] || product.price > priceRange[1]) {
      return false;
    }
    return true;
  });

  const handleProductClick = (productId: string) => {
    router.push(`/marketplace/product/${productId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedCategory ? `${selectedCategory} Products` : 'All Products'} 
          <span className="text-gray-500 text-lg ml-2">({filteredProducts.length})</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-200 overflow-hidden group">
            {/* Image & Badges */}
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.title}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                {product.badges.map((badge, index) => (
                  <Badge key={index} className="bg-white text-gray-900 font-semibold">
                    {badge}
                  </Badge>
                ))}
              </div>
              {product.originalPrice > product.price && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {product.type}
                  </Badge>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{product.rating} ({product.reviews})</span>
                  </div>
                </div>
                
                <h3 
                  className="font-bold text-lg text-gray-900 mb-2 cursor-pointer hover:text-emerald-600"
                  onClick={() => handleProductClick(product.id)}
                >
                  {product.title}
                </h3>
                <p className="text-gray-600 text-sm">{product.description}</p>
              </div>
              
              {/* Value Bullets */}
              <div className="mb-4 space-y-1">
                {product.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    {bullet}
                  </div>
                ))}
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {product.deliveryTime}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {product.studentsHelped}+ students
                </div>
              </div>
              
              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-emerald-600">${product.price}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  className="px-4"
                  onClick={() => handleProductClick(product.id)}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
