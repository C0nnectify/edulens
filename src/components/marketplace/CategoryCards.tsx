
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, FileText, Calculator, Home, Shield, Briefcase } from "lucide-react";

interface CategoryCardsProps {
  onCategorySelect: (category: string) => void;
}

const CategoryCards: React.FC<CategoryCardsProps> = ({ onCategorySelect }) => {
  const categories = [
    {
      id: "admissions",
      title: "Admissions Consulting",
      description: "Expert guidance for university applications",
      icon: GraduationCap,
      productCount: 15,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      id: "visa",
      title: "Visa Assistance", 
      description: "Complete visa application support",
      icon: FileText,
      productCount: 8,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      id: "tools",
      title: "Digital Tools",
      description: "Finders, calculators, and AI tools",
      icon: Calculator,
      productCount: 12,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      id: "housing",
      title: "Housing & Living",
      description: "Accommodation and lifestyle services",
      icon: Home,
      productCount: 6,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      id: "insurance",
      title: "Insurance & Legal",
      description: "Student insurance and legal support",
      icon: Shield,
      productCount: 4,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600"
    },
    {
      id: "internships",
      title: "Internships & Jobs",
      description: "Career opportunities and guidance",
      icon: Briefcase,
      productCount: 9,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
          <p className="text-xl text-gray-600">Find exactly what you need for your study abroad journey</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-emerald-200 group"
                onClick={() => onCategorySelect(category.id)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-8 w-8 ${category.iconColor}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{category.title}</h3>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                    {category.productCount} Products
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;
