import React, { useState, useEffect } from 'react';
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
    const previousOrders = customerData?.previousOrders || [];
    
    setCustomerData(prevData => ({
      ...prevData,
      ...data,
      previousOrders
    }));
  };

  const generateCartItemId = (item) => {
    const timestamp = Date.now();
    const originalId = item._id || 
      (item.item_id && (typeof item.item_id === 'object' ? item.item_id._id : item.item_id));
    return `${originalId}_${timestamp}`;
  };

  const processItemForCart = (item, isReorder = false) => {
    
    const originalItemId = item._id || 
      (item.item_id && (typeof item.item_id === 'object' ? item.item_id._id : item.item_id));
    
    const cartItemId = generateCartItemId(item);
    
    const processedItem = {
      ...item,
      _id: originalItemId,
      cartItemId: cartItemId,
      originalItemId: originalItemId,
      itemName: item.itemName || (item.item_id && item.item_id.itemName) || item.name,
      price: Number(item.price || (item.item_id && item.item_id.price) || item.basePrice || 0),
      basePrice: Number(item.basePrice || item.price || (item.item_id && item.item_id.price) || 0),
      quantity: item.quantity || 1,
      image: item.image || (item.item_id && item.item_id.image) || '',
      spicyPreferences: item.spicyPreferences || [],
      specialInstructions: item.specialInstructions || '',
      addOns: Array.isArray(item.addOns) ? item.addOns.map(addOn => ({
        ...addOn,
        _id: addOn._id || addOn.id,
        price: Number(addOn.price || 0),
        quantity: addOn.quantity || 1,
        name: addOn.name || addOn.itemName,
        itemName: addOn.itemName || addOn.name
      })) : []
    };
    
    return processedItem;
  };

  const handleAddToCart = (item) => {
    
    const processedItem = processItemForCart(item);
    
    setCartItems(prevItems => {
      return [...prevItems, processedItem];
    });
    
    toast({
      title: "Item Added",
      description: `${processedItem.itemName} added to cart.`,
    });
  };

  const handleRemoveItem = (itemId) => {
    if (itemId === -1) {
      setCartItems([]);
    } else {
      setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== itemId));
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity, updatedItem) => {
    
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.cartItemId === itemId) {
          if (updatedItem) {
            return { ...item, ...updatedItem, quantity: newQuantity };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const handleUpdateAddonQuantity = (itemId, addonId, newQuantity) => {
    
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.cartItemId === itemId) {
          const updatedAddOns = item.addOns.map(addon => {
            if (addon._id === addonId) {
              return { ...addon, quantity: newQuantity };
            }
            return addon;
          });
          
          const filteredAddOns = updatedAddOns.filter(addon => addon.quantity > 0);
          
          return { ...item, addOns: filteredAddOns };
        }
        return item;
      })
    );
  };

  const handleOrderSuccess = () => {
    toast({
      title: "Order Completed",
      description: "The order has been successfully placed.",
    });
    
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
                    onAddToCart={handleAddToCart}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-app-secondary flex items-center">
                  <span className="mr-2">🍽</span> Menu Selection
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
                onUpdateAddonQuantity={handleUpdateAddonQuantity}
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
