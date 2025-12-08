
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Star } from "lucide-react";
import { useCart } from "./useCart";

interface ExitIntentModalProps {
  open: boolean;
  onClose: () => void;
}

const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ open, onClose }) => {
  const { addToCart } = useCart();
  
  const specialOffer = {
    id: "exit-offer",
    title: "SOP Expert Review",
    originalPrice: 79,
    specialPrice: 39,
    image: "https://images.unsplash.com/photo-1496307653780-42ee777d4842?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    reviews: 342,
    description: "Professional statement of purpose review with detailed feedback and suggestions."
  };

  const handleAcceptOffer = () => {
    addToCart({ ...specialOffer, price: specialOffer.specialPrice });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Wait! Don't Leave Empty-Handed
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600 font-bold text-lg mb-2">
              🔥 Limited Time Offer
            </div>
            <div className="text-red-800">
              Get expert SOP review for 50% OFF - only valid for the next 10 minutes!
            </div>
          </div>
          
          {/* Product Preview */}
          <div className="border rounded-lg p-4 mb-6">
            <img 
              src={specialOffer.image} 
              alt={specialOffer.title}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
            <h3 className="font-bold text-lg mb-2">{specialOffer.title}</h3>
            <div className="flex items-center justify-center mb-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">{specialOffer.rating} ({specialOffer.reviews} reviews)</span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{specialOffer.description}</p>
            
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl font-bold text-emerald-600">${specialOffer.specialPrice}</span>
              <span className="text-lg text-gray-400 line-through">${specialOffer.originalPrice}</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-bold">
                Save 50%
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleAcceptOffer}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-3"
            >
              Yes, I Want This Deal!
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              No Thanks, I'll Pass
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            * This offer expires when you close this window
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentModal;
