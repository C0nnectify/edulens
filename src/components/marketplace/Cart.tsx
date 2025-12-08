
import React from "react";
import { useCart } from "./useCart";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Cart = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const { cart, removeFromCart, clearCart } = useCart();

  const total = cart.reduce((sum, p) => sum + p.price, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your Cart</DialogTitle>
        </DialogHeader>
        {cart.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Cart is empty!</div>
        ) : (
          <div>
            <ul className="mb-6 space-y-3">
              {cart.map((item, idx) => (
                <li key={item.id + '-' + idx} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-600">${item.price.toFixed(2)}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <div className="text-right font-bold mb-4">Total: ${total.toFixed(2)}</div>
            <DialogFooter>
              <Button variant="secondary" onClick={clearCart}>Clear Cart</Button>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default Cart;
