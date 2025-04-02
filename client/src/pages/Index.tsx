import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import CustomerForm from '../components/CustomerForm';
import RestaurantsList from '../components/RestaurantsList';
import Cart from '../components/Cart';
import { useIsMobile } from '@/hooks/use-mobile';

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
        JSON.stringify(existing.addOns) === JSON.stringify(item.addOns) &&
        existing.specialInstructions === item.specialInstructions
      );

      if (existingItemIndex !== -1) {
        // If item exists with same configuration, increment quantity
        return prevItems.map((existing, index) => 
          index === existingItemIndex 
            ? { ...existing, quantity: existing.quantity + 1 }
            : existing
        );
      } else {
        // If item is new or has different configuration, add it
        return [...prevItems, item];
      }
    });
  };

  const handleRemoveItem = (index) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    setCartItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleCustomerDataChange = (data) => {
    setCustomerData(data);
  };

  const handleOrderSuccess = () => {
    // Clear all data after successful order
    setCustomerData(null);
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm border-b border-gray-200">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-app-primary">SpeedOrder</h1>
              <p className="text-sm text-gray-600">Fast Order-Taking System for Restaurants</p>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4">
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <SearchBar onCustomerSearch={handleCustomerSearch} />
          
          {customerData && (
            <CustomerForm 
              customerData={customerData} 
              onCustomerInfoUpdate={handleCustomerInfoUpdate}
              onCustomerDataChange={handleCustomerDataChange}
            />
          )}
        </div>
        
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-12 gap-6'}`}>
          <div className={isMobile ? '' : 'col-span-8'}>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-app-secondary">Menu Selection</h2>
              <RestaurantsList 
                onMenuItemSelect={handleAddToCart}
              />
            </div>
          </div>
          
          <div className={isMobile ? '' : 'col-span-4'}>
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
    </div>
  );
};

export default Index;
