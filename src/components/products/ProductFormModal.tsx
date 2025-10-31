"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product, CreateProductRequest } from "@/types/product";
import { X, Plus } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductRequest) => Promise<void>;
  product?: Product | null;
  mode: "create" | "edit";
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  mode,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<CreateProductRequest>({
    productName: "",
    productDescription: "",
    stock: 0,
    categoryIds: [],
    brand: "",
    sellingPrice: 0,
    productImages: [],
    ingredients: "",
    suitableFor: [],
    salePercentage: 0,
  });

  const [imageInput, setImageInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [suitableInput, setSuitableInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product && mode === "edit") {
      // Handle both categories (from API) and categoryIds (from form)
      const categoryIds = product.categories 
        ? product.categories.map(cat => cat.categoryId)
        : product.categoryIds || [];
      
      const salePercentage = typeof product.salePercentage === 'string'
        ? parseFloat(product.salePercentage)
        : product.salePercentage;
        
      setFormData({
        productName: product.productName,
        productDescription: product.productDescription,
        stock: product.stock,
        categoryIds: categoryIds,
        brand: product.brand,
        sellingPrice: product.sellingPrice,
        productImages: product.productImages,
        ingredients: product.ingredients,
        suitableFor: product.suitableFor,
        salePercentage: salePercentage,
      });
    } else {
      // Reset form for create mode
      setFormData({
        productName: "",
        productDescription: "",
        stock: 0,
        categoryIds: [],
        brand: "",
        sellingPrice: 0,
        productImages: [],
        ingredients: "",
        suitableFor: [],
        salePercentage: 0,
      });
    }
  }, [product, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData({
        ...formData,
        productImages: [...formData.productImages, imageInput.trim()],
      });
      setImageInput("");
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      productImages: formData.productImages.filter((_, i) => i !== index),
    });
  };

  const addCategory = () => {
    if (categoryInput.trim() && !formData.categoryIds.includes(categoryInput.trim())) {
      setFormData({
        ...formData,
        categoryIds: [...formData.categoryIds, categoryInput.trim()],
      });
      setCategoryInput("");
    }
  };

  const removeCategory = (category: string) => {
    setFormData({
      ...formData,
      categoryIds: formData.categoryIds.filter((c) => c !== category),
    });
  };

  const addSuitable = () => {
    if (suitableInput.trim() && !formData.suitableFor.includes(suitableInput.trim())) {
      setFormData({
        ...formData,
        suitableFor: [...formData.suitableFor, suitableInput.trim()],
      });
      setSuitableInput("");
    }
  };

  const removeSuitable = (item: string) => {
    setFormData({
      ...formData,
      suitableFor: formData.suitableFor.filter((s) => s !== item),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {mode === "create" ? "Add New Product" : "Edit Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-slate-700">
              Product Name *
            </Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) =>
                setFormData({ ...formData, productName: e.target.value })
              }
              required
              className="bg-white border-slate-300 text-slate-900"
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-slate-700">
              Brand *
            </Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              required
              className="bg-white border-slate-300 text-slate-900"
            />
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="productDescription" className="text-slate-700">
              Description *
            </Label>
            <Textarea
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) =>
                setFormData({ ...formData, productDescription: e.target.value })
              }
              required
              rows={4}
              className="bg-white border-slate-300 text-slate-900"
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label htmlFor="ingredients" className="text-slate-700">
              Ingredients *
            </Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) =>
                setFormData({ ...formData, ingredients: e.target.value })
              }
              required
              rows={3}
              className="bg-white border-slate-300 text-slate-900"
              placeholder="Water, L-Ascorbic Acid, Hyaluronic Acid..."
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-slate-700">
                Price ($) *
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  })
                }
                required
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock" className="text-slate-700">
                Stock *
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: parseInt(e.target.value) || 0,
                  })
                }
                required
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePercentage" className="text-slate-700">
                Sale (%)
              </Label>
              <Input
                id="salePercentage"
                type="number"
                min="0"
                max="100"
                value={formData.salePercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salePercentage: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="space-y-2">
            <Label className="text-slate-700">Product Images</Label>
            <div className="flex gap-2">
              <Input
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="Enter image URL"
                className="bg-white border-slate-300 text-slate-900"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addImage}
                size="icon"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.productImages.map((img, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-sm text-slate-700 border border-slate-200"
                >
                  <span className="truncate max-w-xs">{img}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-slate-700">Categories</Label>
            <div className="flex gap-2">
              <Input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Enter category ID"
                className="bg-white border-slate-300 text-slate-900"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addCategory}
                size="icon"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.categoryIds.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-sm text-slate-700 border border-slate-200"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suitable For */}
          <div className="space-y-2">
            <Label className="text-slate-700">Suitable For</Label>
            <div className="flex gap-2">
              <Input
                value={suitableInput}
                onChange={(e) => setSuitableInput(e.target.value)}
                placeholder="e.g., dry-skin, all-skin-types"
                className="bg-white border-slate-300 text-slate-900"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSuitable();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addSuitable}
                size="icon"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.suitableFor.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-sm text-slate-700 border border-slate-200"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeSuitable(item)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Create Product"
                : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
