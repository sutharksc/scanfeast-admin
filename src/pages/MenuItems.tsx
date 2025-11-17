import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import {
  addItem,
  updateItem,
  deleteItem,
  updateItemCategory,
} from "../store/slices/menuItemsSlice";
import { DataListRequest, MenuItem, SelectListItem } from "../types";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  PhotographIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "../components/ui/Icons";
import { lookupService } from "../services/lookupService";
import { menuService } from "../services/menuService";
import toast from "react-hot-toast";

export interface GetMenuItemRequest extends DataListRequest {
  categoryId?: string;
  isVeg: boolean;
}

const MenuItems: React.FC = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<SelectListItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showVegetarianOnly, setShowVegetarianOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    isVegetarian: false,
    categoryId: "",
    sortOrder: 1,
  });

  const itemsPerPage = 12;
  const startIndex = (currentPage - 1) * itemsPerPage;

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
    const response = await lookupService.getMenuCategories();
    setCategories(response.data);
  };

  const fetchMenuItems = async () => {
    await toast.promise(
      menuService.getMenuItems({
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        searchTerm: debouncedSearch,
        categoryId: selectedCategory == "all" ? null : selectedCategory,
        isVeg: showVegetarianOnly,
      }),
      {
        loading: "Loading...",
        success: (res) => {
          // ✅ Use response data here
          if (res && res.isSuccess) {
            setItems(res.data.records);
            setTotalPages(Math.ceil(res.data.totalRecords / itemsPerPage));
            setTotalRecords(res.data.totalRecords);
            return ``;
          }
          return res.error.description;
        },
        error: (err) => {
          // Optional: show more details from server error
          return err?.response?.data?.message || "Failed to fetch data.";
        },
      }
    );
  };

  // Single useEffect with proper dependencies
  useEffect(() => {
    fetchMenuItems();
  }, [currentPage, debouncedSearch, selectedCategory, showVegetarianOnly]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(
      (cat) => cat.value.toLowerCase() === categoryId.toLowerCase()
    );
    return category ? category.text : `Category ${categoryId}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      image:
        formData.image ||
        `https://picsum.photos/seed/${formData.name}/150/150.jpg`,
      isVegetarian: formData.isVegetarian,
      categoryId: formData.categoryId,
      sortOrder: formData.sortOrder,
    };

    if (isEditModalOpen && selectedItem) {
      const updatedItem = {
        ...itemData,
        id: selectedItem.id,
        createdAt: selectedItem.createdAt,
        updatedAt: selectedItem.updatedAt,
      };
      await toast.promise(
        menuService.updateMenuItem(
          updatedItem.id,
          itemData.name,
          updatedItem.description,
          updatedItem.price,
          updatedItem.categoryId,
          updatedItem.image,
          updatedItem.isVegetarian,
          updatedItem.sortOrder
        ),
        {
          loading: "Updating menu item...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              setItems((prevItems) =>
                prevItems.map((item) =>
                  item.id === updatedItem.id ? updatedItem : item
                )
              );
              return `Menu Item updated successfully!`;
            }
            return res.error.description;
          },
          error: (err) => {
            // Optional: show more details from server error
            return (
              err?.response?.data?.message || "Failed to update Menu Item."
            );
          },
        }
      );
    } else {
      await toast.promise(
        menuService.addMenuItem(
          itemData.name,
          itemData.description,
          itemData.price,
          itemData.categoryId,
          itemData.image,
          itemData.isVegetarian,
          itemData.sortOrder
        ),
        {
          loading: "Creating menu item...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              setItems((prevItems) => {
                // Step 1: Add new table at the start
                const updatedItems = [res.data, ...prevItems];

                // Step 2: If more than 12, remove the last one
                if (updatedItems.length > itemsPerPage) {
                  updatedItems.pop(); // removes the last item
                }

                return updatedItems;
              });
              return `Menu Item created successfully!`;
            }
            return res.error.description;
          },
          error: (err) => {
            // Optional: show more details from server error
            return err?.response?.data?.message || "Failed to add Menu Item.";
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
      price: "",
      image: "",
      isVegetarian: false,
      categoryId: "",
      sortOrder: 1,
    });
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  // Handle edit
  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      image: item.image,
      isVegetarian: item.isVegetarian,
      categoryId: item.categoryId.toUpperCase(),
      sortOrder: item.sortOrder,
    });
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
       await toast.promise(menuService.deleteMenuItems([id]), {
        loading: "Deleting menu item...",
        success: (res) => {
          // ✅ Use response data here
          if (res && res.isSuccess) {
            fetchMenuItems();
            return `1 Menu Item deleted successfully!`;
          }
          return res.error.description;
        },
        error: (err) => {
          // Optional: show more details from server error
          return err?.response?.data?.message || "Failed to delete menu item.";
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-600 mt-2">
            Manage your restaurant menu items and pricing
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Menu Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.text}
              </option>
            ))}
          </select>

          {/* Vegetarian Filter */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="vegetarian"
              checked={showVegetarianOnly}
              onChange={(e) => setShowVegetarianOnly(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label
              htmlFor="vegetarian"
              className="ml-2 block text-sm text-gray-700"
            >
              Vegetarian Only
            </label>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-500">
            <FilterIcon className="h-4 w-4 mr-1" />
            {items.length} of {totalRecords} items
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Image */}
            <div className="h-48 bg-gray-100 relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://picsum.photos/seed/${item.name}/300/200.jpg`;
                }}
              />
              {item.isVegetarian && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  🌱 Vegetarian
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h3>
                <span className="text-lg font-bold text-orange-600">
                  ${item.price}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {getCategoryName(item.categoryId)}
                </span>
                <span className="text-xs text-gray-500">
                  Order: {item.sortOrder}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
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
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <PhotographIcon className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No menu items found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditModalOpen ? "Edit Menu Item" : "Add Menu Item"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.text}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVegetarian"
                  checked={formData.isVegetarian}
                  onChange={(e) =>
                    setFormData({ ...formData, isVegetarian: e.target.checked })
                  }
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isVegetarian"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Vegetarian
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                >
                  {isEditModalOpen ? "Update" : "Add"} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItems;
