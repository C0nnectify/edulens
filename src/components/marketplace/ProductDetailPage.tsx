
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Users, CheckCircle, ArrowLeft, Heart, Share2 } from "lucide-react";
import { useCart } from "./useCart";
import Navigation from "../Navigation";

const ProductDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedTier, setSelectedTier] = useState("standard");

  // Mock product data - in real app this would come from API
  const product = {
    id: id,
    title: "Professional SOP Review",
    category: "Admissions Consulting",
    rating: 4.8,
    reviews: 342,
    image: "https://images.unsplash.com/photo-1496307653780-42ee777d4842?auto=format&fit=crop&w=600&q=80",
    description: "Get your statement of purpose professionally reviewed by admissions experts with years of experience helping students get into top universities worldwide.",
    longDescription: "Our comprehensive SOP review service includes detailed feedback on structure, content, grammar, and overall impact. Our expert reviewers have helped thousands of students gain admission to prestigious universities across the globe.",
    
    // Pricing tiers
    tiers: [
      {
        id: "basic",
        name: "Basic Review",
        price: 39,
        originalPrice: 49,
        features: [
          "1 comprehensive review",
          "Written feedback report",
          "Grammar and structure check",
          "48-hour delivery"
        ]
      },
      {
        id: "standard",
        name: "Standard Review",
        price: 59,
        originalPrice: 79,
        features: [
          "2 comprehensive reviews",
          "Written feedback report",
          "Grammar and structure check",
          "30-minute feedback call",
          "24-hour delivery",
          "Revision suggestions"
        ],
        popular: true
      },
      {
        id: "premium",
        name: "Complete Package",
        price: 99,
        originalPrice: 149,
        features: [
          "3 comprehensive reviews",
          "Written feedback report",
          "Grammar and structure check",
          "60-minute strategy call",
          "Resume review included",
          "Same-day delivery",
          "Unlimited revisions",
          "University-specific tips"
        ]
      }
    ],
    
    // Provider info
    provider: {
      name: "Dr. Sarah Chen",
      title: "Former Admissions Officer",
      university: "Stanford University",
      experience: "8 years",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b647?auto=format&fit=crop&w=150&q=80",
      rating: 4.9,
      studentsHelped: 1200,
      bio: "Former admissions officer at Stanford University with 8 years of experience reviewing applications. Specialized in helping international students craft compelling personal statements."
    },
    
    // Reviews
    studentReviews: [
      {
        id: 1,
        student: "Alex M.",
        rating: 5,
        comment: "Incredible feedback that transformed my SOP. Got into my dream university!",
        verified: true,
        date: "2024-01-15",
        university: "MIT"
      },
      {
        id: 2,
        student: "Priya S.",
        rating: 5,
        comment: "Dr. Chen's feedback was detailed and actionable. Highly recommend!",
        verified: true,
        date: "2024-01-10",
        university: "Harvard"
      },
      {
        id: 3,
        student: "James L.",
        rating: 4,
        comment: "Great service, quick turnaround, and very professional.",
        verified: true,
        date: "2024-01-08",
        university: "Oxford"
      }
    ],
    
    // Suggested bundles
    suggestedBundles: [
      {
        title: "Application Complete Package",
        originalPrice: 199,
        bundlePrice: 149,
        savings: 50,
        includes: ["SOP Review", "Resume Review", "Interview Prep"]
      },
      {
        title: "Documents Review Bundle",
        originalPrice: 129,
        bundlePrice: 99,
        savings: 30,
        includes: ["SOP Review", "Personal Statement", "Cover Letter"]
      }
    ]
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Product not found.</p>
          <Button className="mt-4" onClick={() => router.push("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const selectedTierData = product.tiers.find(tier => tier.id === selectedTier) || product.tiers[1];

  const handleAddToCart = () => {
    addToCart({
      ...product,
      price: selectedTierData.price,
      tier: selectedTierData.name
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button 
            variant="outline" 
            onClick={() => router.push("/marketplace")}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Product Info */}
            <div>
              <img 
                src={product.image} 
                alt={product.title}
                className="w-full h-80 object-cover rounded-xl mb-6"
              />
              
              <div className="space-y-6">
                <div>
                  <Badge className="mb-2">{product.category}</Badge>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{product.rating}</span>
                      <span className="ml-1 text-gray-600">({product.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      {product.provider.studentsHelped}+ students helped
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-lg mb-6">{product.description}</p>
                </div>
                
                {/* Provider Info */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">Your Expert</h3>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={product.provider.avatar} alt={product.provider.name} />
                        <AvatarFallback>{product.provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{product.provider.name}</h4>
                        <p className="text-gray-600">{product.provider.title}</p>
                        <p className="text-gray-600">{product.provider.university}</p>
                        <div className="flex items-center mt-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm">{product.provider.rating} rating</span>
                          <span className="ml-2 text-sm text-gray-500">• {product.provider.experience} experience</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{product.provider.bio}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Right Column - Pricing & Purchase */}
            <div className="space-y-6">
              {/* Pricing Tiers */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-6">Choose Your Package</h3>
                  
                  <div className="space-y-4">
                    {product.tiers.map((tier) => (
                      <div 
                        key={tier.id}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTier === tier.id 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedTier(tier.id)}
                      >
                        {tier.popular && (
                          <Badge className="absolute -top-2 left-4 bg-emerald-600">Most Popular</Badge>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{tier.name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-emerald-600">${tier.price}</span>
                              <span className="text-gray-400 line-through">${tier.originalPrice}</span>
                              <span className="text-sm text-green-600 font-semibold">
                                Save ${tier.originalPrice - tier.price}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedTier === tier.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                          }`}>
                            {selectedTier === tier.id && (
                              <CheckCircle className="h-3 w-3 text-white m-0.5" />
                            )}
                          </div>
                        </div>
                        
                        <ul className="space-y-2">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <Button 
                      onClick={handleAddToCart}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-3"
                    >
                      Add to Cart - ${selectedTierData.price}
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        <Heart className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Suggested Bundles */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">💡 Bundle & Save More</h3>
                  {product.suggestedBundles.map((bundle, index) => (
                    <div key={index} className="p-4 border rounded-lg mb-3 last:mb-0">
                      <h4 className="font-semibold">{bundle.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-bold text-emerald-600">${bundle.bundlePrice}</span>
                        <span className="text-gray-400 line-through">${bundle.originalPrice}</span>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Save ${bundle.savings}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Includes: {bundle.includes.join(', ')}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        Add Bundle
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Tabs Section */}
          <div className="mt-12">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({product.reviews})</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-4">Product Details</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-600 leading-relaxed">
                        {product.longDescription}
                      </p>
                      
                      <h4 className="font-semibold mt-6 mb-3">What You'll Get:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Comprehensive review by experienced admissions expert
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Detailed written feedback with specific suggestions
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Grammar, structure, and content analysis
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          University-specific recommendations
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  {product.studentReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-emerald-100 rounded-full w-10 h-10 flex items-center justify-center">
                              <span className="font-semibold text-emerald-600">
                                {review.student.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{review.student}</span>
                                {review.verified && (
                                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Admitted to {review.university}</span>
                                <span>•</span>
                                <span>{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="faq" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">How long does the review process take?</h4>
                        <p className="text-gray-600">Reviews are typically completed within 24-48 hours depending on the package you choose.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">What if I'm not satisfied with the review?</h4>
                        <p className="text-gray-600">We offer a 100% satisfaction guarantee. If you're not happy with the review, we'll provide additional feedback at no extra cost.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Can I request revisions?</h4>
                        <p className="text-gray-600">Yes! Standard and Premium packages include revision opportunities based on our feedback.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
