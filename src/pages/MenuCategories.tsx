import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from "../store/slices/menuCategoriesSlice";
import { MenuCategory } from "../types";

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
} from "../components/ui/Icons";
import { menuService } from "../services/menuService";
import toast from "react-hot-toast";

const MenuCategories: React.FC = () => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    sortOrder: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsloading] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null
  );
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sortOrder: 1,
    color: "#fb923c",
    icon: "🍽️",
  });

  const itemsPerPage = 12;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Icon options
  const iconOptions = [
    "🍽️",
    "🍕",
    "🍔",
    "🥗",
    "🍜",
    "🍰",
    "🥤",
    "🍺",
    "☕",
    "🥘",
    "🍱",
    "🥐",
  ];

  // Color options
  const colorOptions = [
    { name: "Orange", value: "#fb923c" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Yellow", value: "#eab308" },
    { name: "Red", value: "#ef4444" },
    { name: "Teal", value: "#14b8a6" },
  ];

  const validateField = (field: string, value: any) => {
    let message = "";

    switch (field) {
      case "name":
        if (!value.trim()) message = "Category name is required.";
        else if (value.length < 3)
          message = "Name must be at least 3 characters.";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: message }));
    return message === ""; // return true if valid
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryData = {
      name: formData.name,
      description: formData.description,
      sortOrder: formData.sortOrder,
      color: formData.color,
      icon: formData.icon,
    };

    if (isEditModalOpen && selectedCategory) {
      const updatedCategory = {
        ...categoryData,
        createdAt: selectedCategory.createdAt,
        updatedAt: selectedCategory.updatedAt,
        id: selectedCategory.id,
      };

      await toast.promise(
        menuService.updateCategory(
          updatedCategory.id,
          updatedCategory.name,
          updatedCategory.description,
          updatedCategory.color,
          updatedCategory.icon,
          updatedCategory.sortOrder
        ),
        {
          loading: "Updating category...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              setCategories((prevCategories) =>
                prevCategories.map((category) =>
                  category.id === updatedCategory.id
                    ? updatedCategory
                    : category
                )
              );
              return `Category updated successfully!`;
            }
            return res.error.description;
          },
          error: (err) => {
            // Optional: show more details from server error
            return err?.response?.data?.message || "Failed to add table.";
          },
        }
      );
    } else {
      await toast.promise(
        menuService.addCategory(
          categoryData.name,
          categoryData.description,
          categoryData.color,
          categoryData.icon,
          categoryData.sortOrder
        ),
        {
          loading: "Creating category...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              setCategories((prevCategories) => {
                // Step 1: Add new table at the start
                const updatedCategories = [res.data, ...prevCategories];

                // Step 2: If more than 12, remove the last one
                if (updatedCategories.length > itemsPerPage) {
                  updatedCategories.pop(); // removes the last item
                }

                return updatedCategories;
              });
              return `Category created successfully!`;
            }
            return res.error.description;
          },
          error: (err) => {
            // Optional: show more details from server error
            return err?.response?.data?.message || "Failed to add table.";
          },
        }
      );
    }

    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sortOrder: 1,
      color: "#fb923c",
      icon: "🍽️",
    });
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedCategory(null);
  };

  // Handle edit
  const handleEdit = (category: MenuCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      color: category.color || "#fb923c",
      icon: category.icon || "🍽️",
    });
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      await toast.promise(menuService.deleteCategories([id]), {
        loading: "Deleting category...",
        success: (res) => {
          // ✅ Use response data here
          if (res && res.isSuccess) {
            fetchCategories();
            return `1 Category deleted successfully!`;
          }
          return res.error.description;
        },
        error: (err) => {
          // Optional: show more details from server error
          return err?.response?.data?.message || "Failed to add table.";
        },
      });
    }
  };

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // delay before triggering API call

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch function
  const fetchCategories = async () => {
    const response = await menuService.getCategories({
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      searchTerm: debouncedSearch,
    });

    setCategories(response.data.records);
    setTotalPages(Math.ceil(response.data.totalRecords / itemsPerPage));
    setTotalRecords(response.data.totalRecords);
  };

  // Single useEffect with proper dependencies
  useEffect(() => {
    fetchCategories();
  }, [currentPage, debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Menu Categories
          </h1>
          <p className="text-gray-600 mt-2">
            Organize your menu with beautiful categories
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white">
              <FolderIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">
                Total Categories
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {totalRecords}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <EyeIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">
                Active Categories
              </p>
              <p className="text-2xl font-bold text-blue-900">{totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">
                Avg. Sort Order
              </p>
              <p className="text-2xl font-bold text-green-900">
                {categories.length > 0
                  ? Math.round(
                      categories.reduce((sum, cat) => sum + cat.sortOrder, 0) /
                        categories.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <FilterIcon className="h-4 w-4 mr-1" />
            {categories.length} of {totalRecords} categories
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
          >
            {/* Category Header */}
            <div
              className="h-24 relative overflow-hidden"
              style={{ backgroundColor: category.color || "#fb923c" }}
            >
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">{category.icon || "🍽️"}</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                  #{category.sortOrder}
                </span>
              </div>
            </div>

            {/* Category Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {category.name}
                </h3>
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color || "#fb923c" }}
                ></div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </span>
                <span>Order: {category.sortOrder}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-all duration-200 hover:shadow-md"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <FolderIcon className="h-24 w-24" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No categories found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search terms."
              : "Get started by creating your first category."}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create First Category
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, totalRecords)}
                </span>{" "}
                of <span className="font-medium">{totalRecords}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? "z-10 bg-orange-50 border-orange-500 text-orange-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {isEditModalOpen ? "Edit Category" : "Create New Category"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    validateField("name", e.target.value); // real-time validate
                  }}
                  onKeyUp={(e) => validateField("name", e.currentTarget.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Appetizers, Main Course, Desserts"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Describe this category..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.icon === icon
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color: color.value })
                      }
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.color === color.value
                          ? "border-gray-800 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        ></div>
                        <span className="text-xs">{color.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  disabled={isLoading}
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isEditModalOpen ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCategories;
