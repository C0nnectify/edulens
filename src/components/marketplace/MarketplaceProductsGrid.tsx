
import React from "react";
import products from "../../sample-data/products";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";

type MarketplaceProductsGridProps = {
  search: string;
  setSearch: (val: string) => void;
  onOpenCart: () => void;
};

const MarketplaceProductsGrid = ({
  search,
  setSearch,
  onOpenCart,
}: MarketplaceProductsGridProps) => {
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <Button onClick={onOpenCart} variant="secondary">
          View Cart
        </Button>
      </div>
      <input
        type="text"
        value={search}
        placeholder="Search products…"
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-6"
      />
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center text-gray-500 p-8">
            No products found.
          </div>
        )}
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
export default MarketplaceProductsGrid;
