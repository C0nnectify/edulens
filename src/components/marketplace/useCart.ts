
import { useState } from "react";

const STORAGE_KEY = "marketplace_cart";
function getInitialCart() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) return JSON.parse(value);
  } catch {}
  return [];
}

// We provide a simple singleton contextless hook for this demo build
let cartRefs = [] as ((cart: any[]) => void)[];
let cart: any[] = getInitialCart();

function updateAll(next: any[]) {
  cart = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cartRefs.forEach(fn => fn(cart));
}

export function useCart() {
  const [state, setState] = useState(cart);

  // Subscribe our setState on mount
  if (!cartRefs.includes(setState)) cartRefs.push(setState);

  function addToCart(product: any) {
    // Don't double-add the same id for demo, but allow duplicate if needed
    if (!cart.find(p => p.id === product.id)) {
      updateAll([...cart, product]);
    }
  }
  function removeFromCart(id: string) {
    updateAll(cart.filter(p => p.id !== id));
  }
  function clearCart() {
    updateAll([]);
  }
  return {
    cart: state,
    addToCart,
    removeFromCart,
    clearCart,
  };
}
