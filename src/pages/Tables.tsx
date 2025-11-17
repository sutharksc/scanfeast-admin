import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import {
  addTable,
  updateTable,
  deleteTable,
  toggleTableStatus,
} from "../store/slices/tablesSlice";
import { Table, TableStatus } from "../types";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TableIcon,
  UserGroupIcon,
  MapPinIcon,
} from "../components/ui/Icons";
import { restaurentService } from "../services/restaurentService";
import toast from "react-hot-toast";

const Tables: React.FC = () => {
  const dispatch = useDispatch();
  const [tables, setTables] = useState<any>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formData, setFormData] = useState({
    number: "",
    description: "",
    type: 1,
    capacity: 4,
    status: TableStatus.Available as Table["status"],
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
  const fetchTables = async () => {
    const response = await restaurentService.getTables({
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      searchTerm: debouncedSearch,
    });

    setTables(response.data.records);
    setTotalPages(Math.ceil(response.data.totalRecords / itemsPerPage));
    setTotalRecords(response.data.totalRecords);
  };

  // Single useEffect with proper dependencies
  useEffect(() => {
    fetchTables();
  }, [currentPage, debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable) {
      const updatedData = {
        ...editingTable,
        ...formData,
      };

      await toast.promise(
        restaurentService.updateTable(
          updatedData.id,
          updatedData.type,
          updatedData.number,
          updatedData.capacity,
          updatedData.description
        ),
        {
          loading: "Updating table...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              setTables((prevTables) =>
                prevTables.map((table) =>
                  table.id === updatedData.id ? updatedData : table
                )
              );
              return `Table updated successfully!`;
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
        restaurentService.addTable(
          formData.type,
          formData.number,
          formData.capacity,
          formData.description
        ),
        {
          loading: "Adding table...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              setTables((prevTables) => {
                // Step 1: Add new table at the start
                const updatedTables = [res.data, ...prevTables];

                // Step 2: If more than 12, remove the last one
                if (updatedTables.length > 12) {
                  updatedTables.pop(); // removes the last item
                }

                return updatedTables;
              });
              return `Table added successfully!`;
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

  const resetForm = () => {
    setFormData({
      number: "",
      description: "",
      type: 1,
      capacity: 4,
      status: TableStatus.Available,
    });
    setEditingTable(null);
    setIsModalOpen(false);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      description: table.description,
      type: table.type,
      capacity: table.capacity,
      status: table.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
        await toast.promise(
        restaurentService.deleteTables([id]),
        {
          loading: "Deleting table...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              fetchTables();
              return `1 Table deleted successfully!`;
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
  };

  const handleBulkDelete = async () => {
    if (
      selectedTables.length > 0 &&
      window.confirm(
        `Are you sure you want to delete ${selectedTables.length} tables?`
      )
    ) {
      await toast.promise(
        restaurentService.deleteTables(selectedTables),
        {
          loading: "Deleting tables...",
          success: (res) => {
            // ✅ Use response data here
            if (res && res.isSuccess) {
              fetchTables();
              return `${selectedTables.length} Tables deleted successfully!`;
            }
            return res.error.description;
          },
          error: (err) => {
            // Optional: show more details from server error
            return err?.response?.data?.message || "Failed to add table.";
          },
        }
      );
      setSelectedTables([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTables(tables.map((table) => table.id));
    } else {
      setSelectedTables([]);
    }
  };

  const handleSelectTable = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTables([...selectedTables, id]);
    } else {
      setSelectedTables(selectedTables.filter((tableId) => tableId !== id));
    }
  };

  const getTableIcon = (type: number) => {
    switch (type) {
      case 1: // DiningTable
        return "🍽️";
      case 2: // Booth
        return "🪑";
      case 3: // Sofa
        return "🛋️";
      case 4: // BarStool
        return "🍸";
      case 5: // Outdoor
        return "🏖️";
      case 6: // Private
        return "🚪";
      case 7: // Communal
        return "👥";
      case 8: // CoupleTable
        return "💞";
      case 9: // FamilyTable
        return "👨‍👩‍👧‍👦";
      case 10: // WindowTable
        return "🌅";
      case 11: // CornerTable
        return "🪟";
      case 12: // HighTop
        return "🍻";
      case 13: // RoundTable
        return "⭕";
      case 14: // ChefsTable
        return "👨‍🍳";
      case 15: // AccessibleTable
        return "♿";
      default:
        return "🍽️"; // Default fallback
    }
  };

  const getStatusColor = (status: Table["status"]) => {
    return status === TableStatus.Available
      ? "bg-gradient-to-r from-green-400 to-green-600 text-white"
      : "bg-gradient-to-r from-red-400 to-red-600 text-white";
  };

  const getTypeColor = (type: number) => {
    switch (type) {
      case 1: // DiningTable
        return "bg-gray-100 text-gray-800";
      case 2: // Booth
        return "bg-yellow-100 text-yellow-800";
      case 3: // Sofa
        return "bg-blue-100 text-blue-800";
      case 4: // BarStool
        return "bg-purple-100 text-purple-800";
      case 5: // Outdoor
        return "bg-green-100 text-green-800";
      case 6: // Private
        return "bg-pink-100 text-pink-800";
      case 7: // Communal
        return "bg-orange-100 text-orange-800";
      case 8: // CoupleTable
        return "bg-rose-100 text-rose-800";
      case 9: // FamilyTable
        return "bg-indigo-100 text-indigo-800";
      case 10: // WindowTable
        return "bg-cyan-100 text-cyan-800";
      case 11: // CornerTable
        return "bg-amber-100 text-amber-800";
      case 12: // HighTop
        return "bg-lime-100 text-lime-800";
      case 13: // RoundTable
        return "bg-teal-100 text-teal-800";
      case 14: // ChefsTable
        return "bg-red-100 text-red-800";
      case 15: // AccessibleTable
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeName = (type: number): string => {
    switch (type) {
      case 1:
        return "Dining Table";
      case 2:
        return "Booth";
      case 3:
        return "Sofa";
      case 4:
        return "Bar Stool";
      case 5:
        return "Outdoor";
      case 6:
        return "Private";
      case 7:
        return "Communal";
      case 8:
        return "Couple Table";
      case 9:
        return "Family Table";
      case 10:
        return "Window Table";
      case 11:
        return "Corner Table";
      case 12:
        return "High Top";
      case 13:
        return "Round Table";
      case 14:
        return "Chef’s Table";
      case 15:
        return "Accessible Table";
      default:
        return "Unknown Type";
    }
  };

  const TableCard: React.FC<{ table: Table }> = ({ table }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          checked={selectedTables.includes(table.id)}
          onChange={(e) => handleSelectTable(table.id, e.target.checked)}
        />
      </div>

      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
            table.status
          )}`}
        >
          {table.status ?? "Occupied"}
        </span>
      </div>

      {/* Table Icon */}
      <div className="flex justify-center mb-4 mt-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
          {getTableIcon(table.type)}
        </div>
      </div>

      {/* Table Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {table.number}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{table.description}</p>

        <div className="flex items-center justify-center space-x-2 mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
              table.type
            )}`}
          >
            {getTypeName(table.type)}
          </span>
          <span className="inline-flex items-center text-xs text-gray-500">
            <UserGroupIcon className="w-3 h-3 mr-1" />
            {table.capacity} seats
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => dispatch(toggleTableStatus(table.id))}
            className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              table.status === TableStatus.Available
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {table.status === TableStatus.Available ? (
              <XCircleIcon className="w-4 h-4 mr-1" />
            ) : (
              <CheckCircleIcon className="w-4 h-4 mr-1" />
            )}
            {table.status === TableStatus.Available ? "Occupy" : "Free"}
          </button>
          <button
            onClick={() => handleEdit(table)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors"
          >
            <PencilIcon className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(table.id)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-xs font-medium rounded-md hover:bg-red-100 transition-colors"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tables Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your restaurant tables and seating arrangements
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Table
          </button>
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
              placeholder="Search tables..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedTables.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete Selected ({selectedTables.length})
            </button>
          )}
        </div>
      </div>

      {/* Tables Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      checked={
                        selectedTables.length === tables.length &&
                        tables.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((table, index) => (
                  <tr
                    key={table.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        checked={selectedTables.includes(table.id)}
                        onChange={(e) =>
                          handleSelectTable(table.id, e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {getTableIcon(table.type)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {table.number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          table.type
                        )}`}
                      >
                        {getTypeName(table.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {table.capacity} seats
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          table.status
                        )}`}
                      >
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => dispatch(toggleTableStatus(table.id))}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                          table.status === "Available"
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                      >
                        {table.status === "Available" ? (
                          <XCircleIcon className="w-4 h-4 mr-1" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                        )}
                        Toggle
                      </button>
                      <button
                        onClick={() => handleEdit(table)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(table.id)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTable ? "Edit Table" : "Add New Table"}
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
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder="e.g., T1, B1, S1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., Window Table, Corner Table"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: +e.target.value })
                  }
                >
                  <option value={1}>Dining Table</option>
                  <option value={2}>Booth</option>
                  <option value={3}>Sofa</option>
                  <option value={4}>Bar Stool</option>
                  <option value={5}>Outdoor</option>
                  <option value={6}>Private</option>
                  <option value={7}>Communal</option>
                  <option value={8}>Couple Table</option>
                  <option value={9}>Family Table</option>
                  <option value={10}>Window Table</option>
                  <option value={11}>Corner Table</option>
                  <option value={12}>High Top</option>
                  <option value={13}>Round Table</option>
                  <option value={14}>Chef's Table</option>
                  <option value={15}>Accessible Table</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                >
                  {editingTable ? "Update" : "Add"} Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
