
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Zap } from "lucide-react";
import { useCart } from "./useCart";

const SmartPicksSection = () => {
  const { addToCart } = useCart();
  
  const trendingItems = [
    {
      id: "trending-1",
      title: "Visa Interview Prep",
      price: 59,
      originalPrice: 79,
      image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&q=80",
      badge: "Bestseller",
      badgeColor: "bg-green-100 text-green-800",
      rating: 4.8,
      reviews: 342,
      description: "Complete visa interview preparation with mock sessions"
    },
    {
      id: "trending-2", 
      title: "SOP Review + Scholarship Kit",
      price: 99,
      originalPrice: 149,
      image: "https://images.unsplash.com/photo-1496307653780-42ee777d4842?auto=format&fit=crop&w=400&q=80",
      badge: "Bundle Deal",
      badgeColor: "bg-purple-100 text-purple-800",
      rating: 4.9,
      reviews: 128,
      description: "Professional SOP review plus personalized scholarship recommendations"
    },
    {
      id: "trending-3",
      title: "Personalized University List",
      price: 19,
      originalPrice: 29,
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
      badge: "New",
      badgeColor: "bg-blue-100 text-blue-800",
      rating: 4.7,
      reviews: 89,
      description: "AI-powered university recommendations tailored to your profile"
    },
    {
      id: "trending-4",
      title: "IELTS Masterclass Session",
      price: 49,
      originalPrice: 69,
      image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
      badge: "Trusted",
      badgeColor: "bg-orange-100 text-orange-800",
      rating: 4.6,
      reviews: 267,
      description: "90-minute personalized IELTS strategy session"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              What Students Are Buying Right Now
            </h2>
            <p className="text-gray-600">Trending tools and services this week</p>
          </div>
          <TrendingUp className="h-8 w-8 text-emerald-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border-2 border-gray-100 p-6 hover:border-emerald-200 hover:shadow-xl transition-all group">
              {/* Badge */}
              <div className="mb-4">
                <Badge className={`${item.badgeColor} font-semibold`}>
                  {item.badge}
                </Badge>
              </div>
              
              {/* Image */}
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              
              {/* Content */}
              <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              
              {/* Rating */}
              <div className="flex items-center mb-3">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{item.rating} ({item.reviews})</span>
              </div>
              
              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-emerald-600">${item.price}</span>
                  <span className="text-sm text-gray-400 line-through">${item.originalPrice}</span>
                </div>
                <div className="text-sm text-green-600 font-semibold">
                  Save ${item.originalPrice - item.price}
                </div>
              </div>
              
              {/* CTA */}
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 group-hover:bg-emerald-700"
                onClick={() => addToCart(item)}
              >
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SmartPicksSection;
