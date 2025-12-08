
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "./useCart";

const ProductCard = ({ product }: { product: any }) => {
  const router = useRouter();
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg p-4 flex flex-col gap-3 border">
      <div className="flex-1 cursor-pointer" onClick={() => router.push(`/marketplace/product/${product.id}`)}>
        <img 
          src={product.image}
          alt={product.title}
          className="w-full h-40 object-cover rounded-lg mb-2"
        />
        <h2 className="font-bold text-lg">{product.title}</h2>
        <p className="text-sm text-gray-600">{product.category}</p>
        <p className="font-semibold text-emerald-700 mt-1">${product.price.toFixed(2)}</p>
      </div>
      <Button onClick={() => addToCart(product)} variant="outline">
        Add to Cart
      </Button>
    </div>
  );
};
export default ProductCard;
