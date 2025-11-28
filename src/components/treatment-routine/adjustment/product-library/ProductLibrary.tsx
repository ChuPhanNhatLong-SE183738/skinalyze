"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { productService } from "@/services/productService";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LibraryProductCard } from "./LibraryProductCard";
import { PendingCart } from "./PendingCart";
import type { Product, ProductQueryParams } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { useTreatment } from "@/contexts/TreatmentContext";

export function ProductLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const { startEditing } = useTreatment();

  const [filters, setFilters] = useState<ProductQueryParams>({
    inStock: true,
    minPrice: undefined,
    maxPrice: undefined,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- API Search Logic ---
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    productService
      .getProducts({
        search: debouncedSearch,
        limit: 20,
        ...filters,
      })
      .then((res) => {
        if (active) setProducts(res.products);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, filters]);

  // Helper reset filter
  const clearFilters = () => setFilters({ inStock: true });

  const hasActiveFilters =
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStock === false;

  return (
    <div className="flex flex-col h-full bg-slate-50/30 relative">
      {/* 1. Header Area */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-800">
              Product Library
            </h2>
            <Button
              onClick={startEditing}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              Adjust Routine & Assign
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-9 bg-slate-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Button (Popover) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={hasActiveFilters ? "secondary" : "outline"}
                    size="icon"
                    className="shrink-0"
                  >
                    <Filter
                      className={
                        hasActiveFilters ? "text-blue-600" : "text-slate-500"
                      }
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Filters</h4>

                    {/* Filter: Stock */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="instock"
                        checked={filters.inStock}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            inStock: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor="instock" className="text-sm">
                        In Stock Only
                      </Label>
                    </div>

                    {/* Filter: Price Range */}
                    <div className="space-y-2">
                      <Label className="text-sm">Price Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={
                            filters.maxPrice === 500000 ? "default" : "outline"
                          }
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              minPrice: 0,
                              maxPrice: 500000,
                            }))
                          }
                        >
                          &lt; 500k
                        </Button>
                        <Button
                          variant={
                            filters.minPrice === 500000 ? "default" : "outline"
                          }
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              minPrice: 500000,
                              maxPrice: undefined,
                            }))
                          }
                        >
                          &gt; 500k
                        </Button>
                      </div>
                    </div>

                    {/* Clear Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-500 hover:text-red-600"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex gap-2">
              {filters.maxPrice === 500000 && (
                <Badge variant="secondary" className="text-[10px]">
                  {"< 500k"}
                </Badge>
              )}
              {filters.minPrice === 500000 && (
                <Badge variant="secondary" className="text-[10px]">
                  {"> 500k"}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Product List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3 pb-24">
            {isLoading ? (
              <div className="py-10 text-center text-slate-400 flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs">Finding products...</span>
              </div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <LibraryProductCard key={product.productId} product={product} />
              ))
            ) : (
              <div className="py-10 text-center text-slate-400">
                <p className="text-sm">No products found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 3. Sticky Bottom Cart */}
      <PendingCart />
    </div>
  );
}
