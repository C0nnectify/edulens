
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./useCart";

interface StickyCartProps {
  onOpenCart: () => void;
}

const StickyCart: React.FC<StickyCartProps> = ({ onOpenCart }) => {
  const { cart } = useCart();
  
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  
  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onOpenCart}
        className="bg-emerald-600 hover:bg-emerald-700 shadow-xl relative group"
        size="lg"
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        <span className="mr-2">Cart</span>
        <Badge className="bg-white text-emerald-600 font-bold">
          {cart.length}
        </Badge>
        <span className="ml-2 font-bold">${total.toFixed(2)}</span>
        
        {/* Pulse animation */}
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
      </Button>
    </div>
  );
};

export default StickyCart;
