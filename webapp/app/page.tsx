'use client';
import { useState, useEffect } from "react";
import {
  Shirt,
  Package,
  Plus,
  Minus,
  LayoutGrid,
  Search,
  RefreshCw,
  Users,
  Loader2
} from "lucide-react";

const brands = ["Gildan", "Bella+Canvas", "Hanes", "Nike"];
const sizes = {
  adult: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
  youth: ["XS", "S", "M", "L", "XL"]  // Base sizes, will add Y prefix in display
};

// Order to display sizes
const sizeDisplayOrder = {
  adult: sizes.adult,
  youth: sizes.youth.map(size => `Y${size}`)
};

type Size = {
  size: string;
  quantity: number;
  category: 'adult' | 'youth';
};

type InventoryItem = {
  _id: string;
  brand: string;
  sizes: Size[];
  totalQuantity: number;
};

export default function InventoryManager() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("Gildan");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [quantity, setQuantity] = useState<number>(1);
  const [sizeCategory, setSizeCategory] = useState<"adult" | "youth">("adult");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInventory();
  }, []);

  const updateStock = async (action: "add" | "remove") => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: selectedBrand,
          size: selectedSize,
          category: sizeCategory,
          quantity,
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      // Refresh inventory data
      await fetchInventory();
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize sizes if they don't exist
  const ensureAllSizes = (inventoryItem: InventoryItem) => {
    const allSizes = [...sizeDisplayOrder.adult, ...sizeDisplayOrder.youth];
    const sizeMap = new Map(inventoryItem.sizes.map(s => [
      s.category === 'youth' ? `Y${s.size}` : s.size,
      s.quantity
    ]));
    
    return {
      ...inventoryItem,
      sizes: allSizes.map(size => ({
        size: size.startsWith('Y') ? size.substring(1) : size,
        quantity: sizeMap.get(size) || 0,
        category: size.startsWith('Y') ? 'youth' : 'adult'
      }))
    };
  };

  const handleSizeClick = (brand: string, size: string, category: 'adult' | 'youth', currentQuantity: number) => {
    if (isLoading) return;
    
    setSelectedBrand(brand);
    setSelectedSize(size);
    setSizeCategory(category);
    setQuantity(1); // Reset to 1 for safety
    
    // Smooth scroll to form on mobile
    const form = document.getElementById('stock-management');
    if (window.innerWidth < 768 && form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Loading screen component
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Loading Inventory...</h2>
        <p className="text-gray-500 mt-2">Please wait while we fetch the latest data</p>
      </div>
    </div>
  );

  // Loading overlay for updates
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white bg-opacity-50 z-40 flex items-center justify-center rounded-lg">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative">
          {isLoading && <LoadingOverlay />}
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-black">Inventory Dashboard</h1>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shirt className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Total Items</span>
              </div>
              <span className="text-2xl font-bold">
                {inventory.reduce((acc, item) => acc + item.totalQuantity, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Stock Management Panel */}
          <div id="stock-management" className="md:col-span-4 bg-white rounded-lg shadow-lg p-6 relative">
            {isLoading && <LoadingOverlay />}
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Stock Management
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Brand</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  disabled={isLoading}
                >
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Size Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      sizeCategory === "adult"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setSizeCategory("adult");
                      setSelectedSize("M");
                    }}
                    disabled={isLoading}
                  >
                    <Users className="w-4 h-4" />
                    Adult
                  </button>
                  <button
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      sizeCategory === "youth"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setSizeCategory("youth");
                      setSelectedSize("M");
                    }}
                    disabled={isLoading}
                  >
                    <Users className="w-4 h-4" />
                    Youth
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Size</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  disabled={isLoading}
                >
                  {sizes[sizeCategory].map((size) => (
                    <option key={size} value={size}>
                      {sizeCategory === "youth" ? `Y${size}` : size}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Quantity</label>
                <div className="flex items-center gap-2">
                  <button
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={isLoading}
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-4 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    disabled={isLoading}
                  />
                  <button
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setQuantity(prev => prev + 1)}
                    disabled={isLoading}
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => updateStock("add")}
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
                <button
                  className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => updateStock("remove")}
                  disabled={isLoading}
                >
                  <Minus className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Display */}
          <div className="md:col-span-8 bg-white rounded-lg shadow-lg p-6 relative">
            {isLoading && <LoadingOverlay />}
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Current Stock
            </h2>

            <div className="space-y-6">
              {inventory.map((item) => {
                const processedItem = ensureAllSizes(item);
                return (
                  <div key={item._id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-black">{item.brand}</h3>
                      <span className="text-lg font-bold text-blue-500">{item.totalQuantity}</span>
                    </div>

                    {/* Adult Sizes */}
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Adult Sizes</p>
                      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                        {sizeDisplayOrder.adult.map((size) => {
                          const sizeData = processedItem.sizes.find(
                            s => s.size === size && s.category === 'adult'
                          );
                          return (
                            <button
                              key={size}
                              onClick={() => handleSizeClick(item.brand, size, 'adult', sizeData?.quantity || 0)}
                              disabled={isLoading}
                              className={`text-center p-2 rounded-lg transition-all duration-200 
                                ${(sizeData?.quantity || 0) > 0
                                  ? "bg-blue-50 hover:bg-blue-100 font-bold"
                                  : "bg-gray-50 hover:bg-gray-100"
                                }
                                cursor-pointer transform hover:scale-105 hover:shadow-md
                                disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100
                                focus:outline-none focus:ring-2 focus:ring-blue-500
                              `}
                            >
                              <div className="text-sm font-medium">{size}</div>
                              <div className="text-sm">
                                {sizeData?.quantity || 0}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Youth Sizes */}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Youth Sizes</p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {sizeDisplayOrder.youth.map((size) => {
                          const sizeData = processedItem.sizes.find(
                            s => s.size === size.substring(1) && s.category === 'youth'
                          );
                          return (
                            <button
                              key={size}
                              onClick={() => handleSizeClick(item.brand, size.substring(1), 'youth', sizeData?.quantity || 0)}
                              disabled={isLoading}
                              className={`text-center p-2 rounded-lg transition-all duration-200 
                                ${(sizeData?.quantity || 0) > 0
                                  ? "bg-green-50 hover:bg-green-100 font-bold"
                                  : "bg-gray-50 hover:bg-gray-100"
                                }
                                cursor-pointer transform hover:scale-105 hover:shadow-md
                                disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100
                                focus:outline-none focus:ring-2 focus:ring-green-500
                              `}
                            >
                              <div className="text-sm font-medium">{size}</div>
                              <div className="text-sm">
                                {sizeData?.quantity || 0}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
