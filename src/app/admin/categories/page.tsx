"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryService } from "@/services/categoryService";
import { authService } from "@/services/authService";
import type { Category } from "@/types/product";
import { Plus, Search, Edit, Trash2, Package, Calendar } from "lucide-react";
import { CategoryFormModal } from "@/components/categories/CategoryFormModal";

interface Toast {
  variant: "success" | "error";
  title: string;
  description: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    checkAuthAndLoadCategories();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const checkAuthAndLoadCategories = async () => {
    try {
      const response = await authService.checkAuth();

      if (!response || !response.user) {
        router.push("/admin/login");
        return;
      }

      if (response.user.role !== "admin") {
        router.push("/");
        return;
      }

      await loadCategories();
    } catch (error) {
      console.error("Authentication error:", error);
      router.push("/admin/login");
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error: any) {
      setToast({
        variant: "error",
        title: "Error",
        description: error.message || "Failed to load categories",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await categoryService.deleteCategory(categoryId);
      await loadCategories();
      setToast({
        variant: "success",
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error: any) {
      setToast({
        variant: "error",
        title: "Error",
        description: error.message || "Failed to delete category",
      });
    }
  };

  const handleFormSubmit = async (
    data: Omit<Category, "categoryId" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (modalMode === "create") {
        await categoryService.createCategory(data);
        setToast({
          variant: "success",
          title: "Success",
          description: "Category created successfully",
        });
      } else if (selectedCategory?.categoryId) {
        await categoryService.updateCategory(selectedCategory.categoryId, data);
        setToast({
          variant: "success",
          title: "Success",
          description: "Category updated successfully",
        });
      }
      await loadCategories();
      setIsModalOpen(false);
    } catch (error: any) {
      setToast({
        variant: "error",
        title: "Error",
        description: error.message || "Failed to save category",
      });
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.categoryDescription
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              toast.variant === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h3
              className={`font-semibold ${
                toast.variant === "success" ? "text-green-900" : "text-red-900"
              }`}
            >
              {toast.title}
            </h3>
            <p
              className={`text-sm ${
                toast.variant === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {toast.description}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-600 mt-1">Manage product categories</p>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Categories
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {categories.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-300 text-slate-900"
            />
          </div>
          <Button
            onClick={handleCreateCategory}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No categories found</p>
              <p className="text-slate-400 text-sm mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first category to get started"}
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <Card
                key={category.categoryId}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditCategory(category)}
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() =>
                          handleDeleteCategory(category.categoryId)
                        }
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {category.categoryName}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {category.categoryDescription}
                  </p>

                  <div className="flex items-center text-xs text-slate-500 gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(category.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        mode={modalMode}
      />
    </AdminLayout>
  );
}
