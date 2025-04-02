import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import CustomerForm from '../components/CustomerForm';
import RestaurantsList from '../components/RestaurantsList';
import Cart from '../components/Cart';
import { useIsMobile } from '../hooks/use-mobile';

const Index = () => {
  const [customerData, setCustomerData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const isMobile = useIsMobile();

  const handleCustomerSearch = (data) => {
    setCustomerData(data);
  };

  const handleCustomerInfoUpdate = (updatedData) => {
    setCustomerData(prevData => ({
      ...prevData,
      ...updatedData
    }));
  };

  const handleAddToCart = (item) => {
    setCartItems(prevItems => {
      // Check if the item already exists with the same configuration
      const existingItemIndex = prevItems.findIndex(existing => 
        existing._id === item._id &&
        existing.spicyPreference === item.spicyPreference &&
        JSON.stringify(existing.addOns?.sort((a, b) => a._id.localeCompare(b._id))) === 
        JSON.stringify(item.addOns?.sort((a, b) => a._id.localeCompare(b._id))) &&
        existing.specialInstructions === item.specialInstructions
      );

      if (existingItemIndex !== -1) {
        // If item exists with same configuration, increment quantity
        return prevItems.map((existing, index) => 
          index === existingItemIndex 
            ? { ...existing, quantity: existing.quantity + (item.quantity || 1) }
            : existing
        );
      } else {
        // If item is new or has different configuration, add it
        return [...prevItems, { ...item, quantity: item.quantity || 1 }];
      }
    });
  };

  const handleRemoveItem = (itemId) => {
    if (itemId === -1) {
      // Clear entire cart
      setCartItems([]);
    } else {
      setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item._id === itemId
          ? newQuantity === 0 
            ? null // Will be filtered out
            : { ...item, quantity: newQuantity }
          : item
      ).filter(Boolean) // Remove null items (quantity 0)
    );
  };

  const handleCustomerDataChange = (data) => {
    setCustomerData(data);
  };

  const handleOrderSuccess = () => {
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white py-3 px-4 shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-app-primary p-2 rounded-lg">
                <h1 className="text-xl font-bold text-white">SpeedOrder</h1>
              </div>
              <p className="text-sm text-gray-600 hidden sm:block">Fast Order-Taking System</p>
            </div>
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl py-4 px-4">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-4'}`}>
          <div className={isMobile ? '' : 'col-span-8'}>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <div className="max-w-2xl mx-auto">
                <SearchBar onCustomerSearch={handleCustomerSearch} />
              </div>
              
              {customerData && (
                <div className="mt-4 max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg">
                  <CustomerForm 
                    customerData={customerData} 
                    onCustomerInfoUpdate={handleCustomerInfoUpdate}
                    onCustomerDataChange={handleCustomerDataChange}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-app-secondary flex items-center">
                  <span className="mr-2">🍽️</span> Menu Selection
                </h2>
              </div>
              <div className="p-4">
                <RestaurantsList 
                  onMenuItemSelect={handleAddToCart}
                />
              </div>
            </div>
          </div>
          
          <div className={`${isMobile ? '' : 'col-span-4 sticky'}`} style={{ top: '5rem' }}>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Cart 
                cartItems={cartItems}
                customer={customerData || {}}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                customerData={customerData}
                onOrderSuccess={handleOrderSuccess}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index; 