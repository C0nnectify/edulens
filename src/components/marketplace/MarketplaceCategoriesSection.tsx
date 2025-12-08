
import React from "react";
import products from "../../sample-data/products";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Plane, Home, Briefcase } from "lucide-react";

const categories = [
  {
    key: "Admissions Consulting",
    label: "Admissions Consulting",
    icon: BookOpen,
    description: "Professional guidance and document review for smooth university admissions.",
    productMatch: (p: any) =>
      p.category &&
      (p.category.toLowerCase().includes("admission") ||
        p.category.toLowerCase().includes("sop") ||
        p.category.toLowerCase().includes("essay") ||
        p.category.toLowerCase().includes("application")),
  },
  {
    key: "Visa Assistance",
    label: "Visa Assistance",
    icon: FileText,
    description: "From document prep to mock interviews—get visa support from verified experts.",
    productMatch: (p: any) =>
      p.category &&
      (p.category.toLowerCase().includes("visa") ||
        p.category.toLowerCase().includes("immigration")),
  },
  {
    key: "Travel & Insurance",
    label: "Travel & Insurance",
    icon: Plane,
    description: "Discounted student flights and comprehensive travel insurance.",
    productMatch: (p: any) =>
      p.category &&
      (p.category.toLowerCase().includes("flight") ||
        p.category.toLowerCase().includes("travel") ||
        p.category.toLowerCase().includes("insurance")),
  },
  {
    key: "Student Housing",
    label: "Student Housing",
    icon: Home,
    description: "Find verified student accommodation options across your destination city.",
    productMatch: (p: any) =>
      p.category &&
      (p.category.toLowerCase().includes("housing") ||
        p.category.toLowerCase().includes("apartment") ||
        p.category.toLowerCase().includes("accommodation") ||
        p.category.toLowerCase().includes("homestay")),
  },
  {
    key: "Career & Internships",
    label: "Career & Internships",
    icon: Briefcase,
    description: "On-platform access to internships and early-career job opportunities.",
    productMatch: (p: any) =>
      p.category &&
      (p.category.toLowerCase().includes("career") ||
        p.category.toLowerCase().includes("internship") ||
        p.category.toLowerCase().includes("cv") ||
        p.category.toLowerCase().includes("resume") ||
        p.category.toLowerCase().includes("job")),
  },
];

const MarketplaceCategoriesSection = ({
  setSearch,
}: {
  setSearch: (value: string) => void;
}) => {
  return (
    <div className="space-y-12">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const filtered = products.filter(cat.productMatch).slice(0, 4);
        const nothingFound = filtered.length === 0;
        return (
          <div
            key={cat.key}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center text-white mr-3">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {cat.label}
                </h3>
                <p className="text-gray-600 text-sm">{cat.description}</p>
              </div>
            </div>
            {nothingFound ? (
              <div className="py-10 text-center text-gray-400 italic">
                No products yet in this category.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                  {filtered.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    className="w-auto"
                    onClick={() => {
                      setSearch(cat.label);
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                    }}
                  >
                    View All {cat.label}
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MarketplaceCategoriesSection;
