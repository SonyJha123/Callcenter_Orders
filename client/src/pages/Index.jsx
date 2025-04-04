
import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import CustomerForm from '../components/CustomerForm';
import RestaurantsList from '../components/RestaurantsList';
import Cart from '../components/Cart';
import { useIsMobile } from '../hooks/use-mobile';
import { useToast } from '../hooks/use-toast';

const Index = () => {
  const [customerData, setCustomerData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleCustomerSearch = (data) => {
    setCustomerData(data);
  };

  const handleCustomerInfoUpdate = (updatedData) => {
    setCustomerData(prevData => ({
      ...prevData,
      ...updatedData
    }));
  };

  const handleCustomerDataChange = (data) => {
    // Maintain the customer's previous orders if they exist
    const previousOrders = customerData?.previousOrders || [];
    
    setCustomerData(prevData => ({
      ...prevData,
      ...data,
      previousOrders
    }));
  };

  const handleAddToCart = (item) => {
    
    // Create a unique cart ID to distinguish between items
    // Use timestamp to ensure uniqueness even for same items added at different times
    const cartItemId = `${item._id || (item.item_id && (typeof item.item_id === 'object' ? item.item_id._id : item.item_id))}_${Date.now()}`;
    
    // Ensure we have all the required properties for the cart item
    const processedItem = {
      ...item,
      _id: item._id || (item.item_id && (typeof item.item_id === 'object' ? item.item_id._id : item.item_id)),
      cartItemId, // Add unique cart item ID for tracking in cart
      originalItemId: item._id || (item.item_id && (typeof item.item_id === 'object' ? item.item_id._id : item.item_id)), // Keep original item ID for API calls
      itemName: item.itemName || (item.item_id && item.item_id.itemName) || item.name,
      price: item.price || (item.item_id && item.item_id.price) || item.basePrice,
      basePrice: item.basePrice || item.price || (item.item_id && item.item_id.price),
      addOns: item.addOns || [],
      quantity: item.quantity || 1,
      image: item.image || (item.item_id && item.item_id.image)
    };
    
    setCartItems(prevItems => {
      // Create a unique identifier for the item based on its properties and the cartItemId
      const getItemIdentifier = (item) => {
        const addOnsIds = item.addOns?.map(addon => addon._id).sort().join('-') || 'no-addons';
        const spicyPref = item.spicyPreferences?.join('-') || 'no-pref';
        const instructions = item.specialInstructions || 'no-instructions';
        // Include cartItemId in the identifier if it exists
        return item.cartItemId || `${item._id}-${addOnsIds}-${spicyPref}-${instructions}`;
      };
    
      // Check if the item already exists with the same configuration
      const itemIdentifier = getItemIdentifier(processedItem);
      const existingItemIndex = prevItems.findIndex(existing => getItemIdentifier(existing) === itemIdentifier);

      if (existingItemIndex !== -1) {
        // If item exists with same configuration, increment quantity
        return prevItems.map((existing, index) => 
          index === existingItemIndex 
            ? { ...existing, quantity: existing.quantity + (processedItem.quantity || 1) }
            : existing
        );
      } else {
        // If item is new or has different configuration, add it
        return [...prevItems, processedItem];
      }
    });
  };

  const handleRemoveItem = (itemId) => {
    if (itemId === -1) {
      // Clear entire cart
      setCartItems([]);
    } else {
      // Remove by cartItemId if it exists, otherwise by _id
      setCartItems(prevItems => prevItems.filter(item => 
        (item.cartItemId && item.cartItemId !== itemId) || 
        (!item.cartItemId && item._id !== itemId)
      ));
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    
    setCartItems(prevItems => 
      prevItems.map(item => {
        // Check if we should update by cartItemId or _id
        const shouldUpdate = (item.cartItemId && item.cartItemId === itemId) || 
                             (!item.cartItemId && item._id === itemId);
                             
        return shouldUpdate ? { ...item, quantity: newQuantity } : item;
      }).filter(item => item.quantity > 0) // Remove items with quantity 0
    );
  };

  const handleOrderSuccess = () => {
    // Show success toast
    toast({
      title: "Order Completed",
      description: "The order has been successfully placed.",
    });
    
    // Clear cart
    setCartItems([]);
    
    // Don't reset the customer data as that would reload the form
    // This way the customer data remains, but cart is cleared
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
                    onAddToCart={handleAddToCart}
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
