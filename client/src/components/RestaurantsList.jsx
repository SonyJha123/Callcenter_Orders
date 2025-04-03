import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { 
  useGetMenuListQuery,
  useGetAllItemsQuery,
  useGetItemsByMenuIdQuery,
  useGetMenuItemQuery,
  useGetAddOnsQuery,
  useSearchItemsQuery
} from '../redux/services/restaurantApi';
import { useToast } from "@/hooks/use-toast";

const SPICY_LEVELS = [
  { id: 'not-spicy', label: 'Not Spicy', value: 'Not Spicy' },
  { id: 'normal', label: 'Normal', value: 'Normal' },
  { id: 'spicy', label: 'Spicy', value: 'Spicy' },
  { id: 'extra-spicy', label: 'Extra Spicy', value: 'Extra Spicy' }
];

const MenuItemCard = ({ item, isSelected, onSelect, onAddToCart, spicyPreferences, onSpicyChange, addOns, onAddOnToggle, onAddOnToggleChange, specialInstructions, onInstructionsChange }) => {
  // Normalize item properties to handle different structures
  const itemName = item.itemName || item.name || item.title || '';
  const itemPrice = parseFloat(item.price) || 0;
  const itemImage = item.image || item.imageUrl || item.img || 'https://via.placeholder.com/50';
  
  return (
    <div
      className={`${
        isSelected ? 'sm:col-span-2 md:col-span-2 lg:col-span-2' : ''
      } relative group`}
    >
      <div
        className={`flex flex-col rounded-lg transition-all duration-200 ${
          isSelected
            ? 'bg-white border-2 border-app-primary shadow-lg' 
            : 'bg-white hover:bg-gray-50 border hover:shadow-md h-[140px]'
        }`}
      >
        {/* Item Header - Always Visible */}
        <div 
          onClick={() => onSelect(item)}
          className={`flex flex-col items-center p-4 cursor-pointer ${isSelected ? 'pb-2' : 'h-full'}`}
        >
          <div className="relative w-16 h-16 mb-3">
            <img 
              src={itemImage}
              alt={itemName}
              className="w-full h-full rounded-full object-cover border-2 border-white shadow-md group-hover:shadow-lg transition-shadow" 
            />
            <div className="absolute -top-2 -right-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(item)}
                className="h-5 w-5 rounded-md border-2 border-app-primary text-app-primary focus:ring-app-primary cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-center line-clamp-2">{itemName}</span>
          <span className="text-sm font-bold mt-2 text-app-primary">₹{itemPrice.toFixed(2)}</span>
        </div>

        {/* Expanded Content - Visible when Selected */}
        {isSelected && (
          <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
            {/* Spicy Preference */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2 text-gray-600">Spicy Levels (Select Multiple)</label>
              <div className="grid grid-cols-2 gap-2">
                {SPICY_LEVELS.map((level) => (
                  <label
                    key={level.id}
                    className={`flex items-center justify-between p-2 rounded border transition-all ${
                      spicyPreferences?.includes(level.value)
                        ? 'bg-app-primary/5 border-app-primary'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    } cursor-pointer`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        value={level.value}
                        checked={spicyPreferences?.includes(level.value)}
                        onChange={() => onSpicyChange(item._id, level.value)}
                        className="h-4 w-4 rounded text-app-primary border-gray-300 focus:ring-app-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Add-ons Section */}
            {addOns?.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium mb-2 text-gray-600">Add-ons</label>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {addOns.map(addOn => (
                    <label 
                      key={addOn._id} 
                      className={`flex items-center justify-between p-2 rounded border transition-all ${
                        onAddOnToggle(item._id, addOn)
                          ? 'bg-app-primary/5 border-app-primary'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      } cursor-pointer`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={onAddOnToggle(item._id, addOn)}
                          onChange={() => onAddOnToggleChange(item._id, addOn)}
                          className="mr-2 text-app-primary rounded border-gray-300 focus:ring-app-primary"
                        />
                        <span className="text-sm">{addOn.itemName}</span>
                      </div>
                      <span className="text-app-primary font-medium text-sm">₹{addOn.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2 text-gray-600">Special Instructions</label>
              <textarea
                placeholder="Any special requests..."
                rows="2"
                className="w-full text-sm p-2 border rounded bg-white text-gray-800 resize-none focus:border-app-primary focus:ring-1 focus:ring-app-primary"
                value={specialInstructions}
                onChange={(e) => onInstructionsChange(item._id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Add to Cart Button */}
            <button
              className="w-full bg-app-primary text-white font-medium py-2.5 px-4 rounded-lg hover:bg-app-primary/90 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(item);
              }}
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const RestaurantsList = ({ onMenuItemSelect }) => {
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState({});
  const [spicyPreferences, setSpicyPreferences] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [allItems, setAllItems] = useState([]);

  const { toast } = useToast();
  
  // API Query hooks
  const { data: menusData, isLoading: isLoadingMenus, error: menusError } = useGetMenuListQuery();
  const { data: allItemsData, isLoading: isLoadingAllItems } = useGetAllItemsQuery();
  const { data: menuItemsData, isLoading: isLoadingMenuItems } = useGetItemsByMenuIdQuery(
    selectedMenu?._id,
    { skip: !selectedMenu }
  );
  const { data: searchData, isLoading: isSearching } = useSearchItemsQuery(
    searchTerm,
    { skip: !searchTerm }
  );
  const { data: addOnsData, isLoading: isLoadingAddOns } = useGetAddOnsQuery(
    selectedItems.length > 0 ? selectedItems[0]._id : null,
    { skip: selectedItems.length === 0 }
  );

  // Log API responses for debugging
  useEffect(() => {
    if (menusData) {
      console.log('Menu data received:', menusData);
      if (Array.isArray(menusData)) {
        console.log(`Found ${menusData.length} menu categories`);
        menusData.forEach(menu => {
          console.log(`Menu: ${menu.menuName}, ID: ${menu._id}`);
        });
      } else if (typeof menusData === 'object') {
        console.log('Menu data is an object, not an array. Structure:', Object.keys(menusData));
        // If it's an object with menus property
        if (menusData.menus && Array.isArray(menusData.menus)) {
          console.log(`Found ${menusData.menus.length} menu categories in .menus property`);
        }
      }
    }
  }, [menusData]);

  // Store all items when they're loaded
  useEffect(() => {
    if (allItemsData) {
      console.log('All Items from API:', allItemsData);
      console.log(`Received ${allItemsData.length} items from allItemsData API call`);
      setAllItems(allItemsData);
      
      // If no specific menu or search is selected, show all items
      if (!selectedMenu && !searchTerm) {
        console.log('Setting filtered items to all items (no menu or search active)');
        setFilteredItems(allItemsData);
      }
      
      // Check the structure of the first item
      if (allItemsData.length > 0) {
        const sampleItem = allItemsData[0];
        console.log('Sample item structure:', sampleItem);
        console.log('Fields that could link to menu:', {
          menuId: sampleItem.menuId,
          menu: sampleItem.menu,
          category: sampleItem.category,
          categoryId: sampleItem.categoryId
        });
      }
    }
  }, [allItemsData, selectedMenu, searchTerm]);

  // Update filtered items when search results arrive
  useEffect(() => {
    if (searchTerm && searchData) {
      setFilteredItems(searchData);
    } else if (!searchTerm && !selectedMenu) {
      setFilteredItems(allItems);
    }
  }, [searchData, searchTerm, selectedMenu, allItems]);

  // Handle menu-specific items from the API
  useEffect(() => {
    if (selectedMenu) {
      console.log(`Processing items for selected menu: ${selectedMenu.menuName} (${selectedMenu._id})`);
      
      if (menuItemsData) {
        console.log(`Raw menu items data from API:`, menuItemsData);
        
        // Check different possible structures for the API response
        let items = [];
        
        if (Array.isArray(menuItemsData)) {
          console.log(`API returned an array of ${menuItemsData.length} items for menu ${selectedMenu.menuName}`);
          items = menuItemsData;
        } else if (menuItemsData.items && Array.isArray(menuItemsData.items)) {
          console.log(`API returned ${menuItemsData.items.length} items in .items property for menu ${selectedMenu.menuName}`);
          items = menuItemsData.items;
        } else if (typeof menuItemsData === 'object') {
          console.log(`API returned an object for menu ${selectedMenu.menuName}, checking for items property:`, Object.keys(menuItemsData));
        }
        
        // If we found items in any format, use them
        if (items.length > 0) {
          console.log(`Setting filtered items to ${items.length} items from API for menu ${selectedMenu.menuName}`);
          setFilteredItems(items);
        } else {
          // Otherwise fall back to client-side filtering
          console.log(`No usable items from API for menu ${selectedMenu.menuName}. Falling back to client-side filtering.`);
          filterItemsByMenuId(selectedMenu._id);
        }
      } else if (!isLoadingMenuItems) {
        // menuItemsData is null/undefined but not loading - fall back to client-side filtering
        console.log(`No API data available for menu ${selectedMenu.menuName}. Using client-side filtering.`);
        filterItemsByMenuId(selectedMenu._id);
      }
    }
  }, [selectedMenu, menuItemsData, isLoadingMenuItems, allItems]);

  // Filter items based on selected menu
  const filterItemsByMenuId = (menuId) => {
    if (!menuId || !allItems || allItems.length === 0) {
      return;
    }
    
    console.log(`Filtering items for menu ID: ${menuId}`);
    console.log(`Total items available: ${allItems.length}`);
    
    // Filter all items that belong to the selected menu
    // Check various possible field names that could associate items with menus
    const menuItems = allItems.filter(item => {
      // Debug the item's menu-related fields
      const itemMenuId = item.menuId || 
                        (item.menu && typeof item.menu === 'string' ? item.menu : null) ||
                        (item.menu && item.menu._id ? item.menu._id : null);
                        
      console.log(`Item: ${item.name || item.itemName}, Menu fields:`, {
        directMenuId: item.menuId,
        menuObject: typeof item.menu === 'object' ? 'object' : item.menu,
        menuObjectId: item.menu && item.menu._id ? item.menu._id : null,
        categoryId: item.categoryId,
        category: item.category
      });
      
      const matches = 
        item.menuId === menuId || 
        (item.menu === menuId) ||
        (item.menu && item.menu._id === menuId) ||
        item.menuObjectId === menuId ||
        item.menuRef === menuId ||
        item.category === menuId ||
        item.categoryId === menuId;
      
      if (matches) {
        console.log(`✓ Item matched menu: ${item.name || item.itemName}`);
      }
      
      return matches;
    });
    
    console.log(`Filtered ${menuItems.length} items for menu ${menuId} via client-side filtering`);
    setFilteredItems(menuItems.length > 0 ? menuItems : []);
  };

  const handleMenuClick = (menu) => {
    console.log(`Menu clicked: ${menu.menuName} (${menu._id})`);
    setSelectedMenu(menu);
    setSelectedItems([]);
    // Filtering will be handled by the useEffect watching selectedMenu and menuItemsData
  };

  const handleClearMenuFilter = () => {
    console.log("All Items clicked - clearing menu filter");
    setSelectedMenu(null);
    setFilteredItems(allItems);
  };

  const handleItemSelect = (item) => {
    const isAlreadySelected = selectedItems.some(selectedItem => selectedItem._id === item._id);
    
    if (isAlreadySelected) {
      // Remove the item
      setSelectedItems(prevItems => prevItems.filter(prevItem => prevItem._id !== item._id));
      
      // Clean up related data
      if (spicyPreferences[item._id]) {
        setSpicyPreferences(prev => {
          const updated = { ...prev };
          delete updated[item._id];
          return updated;
        });
      }
      
      if (specialInstructions[item._id]) {
        setSpecialInstructions(prev => {
          const updated = { ...prev };
          delete updated[item._id];
          return updated;
        });
      }
      
      if (selectedAddOns[item._id]) {
        setSelectedAddOns(prev => {
          const updated = { ...prev };
          delete updated[item._id];
          return updated;
        });
      }
    } else {
      // Add the item
      setSelectedItems(prevItems => [...prevItems, item]);
    }
  };

  const handleAddToCart = (item) => {
    console.log("Adding to cart:", item._id);
    
    // Normalize item properties
    const itemName = item.itemName || item.name || item.title || '';
    const itemPrice = parseFloat(item.price) || 0;
    const itemImage = item.image || item.imageUrl || item.img || 'https://via.placeholder.com/50';
    
    // Get any add-ons for this item
    const itemAddOns = selectedAddOns[item._id] || [];
    
    // Get special instructions and spicy preferences
    const instructions = specialInstructions[item._id] || '';
    const spicy = spicyPreferences[item._id] || [];
    
    // Format the item for the cart
    const cartItem = {
      _id: item._id,
      itemName: itemName,
      price: itemPrice,
      basePrice: itemPrice,
      quantity: 1,
      image: itemImage,
      specialInstructions: instructions,
      spicyPreference: spicy,
      addOns: itemAddOns,
    };
    
    console.log("Formatted cart item:", cartItem);
    
    // Pass to parent component
    onMenuItemSelect(cartItem);
    
    // Show success notification
    toast({
      title: "Item Added",
      description: `${itemName} has been added to your cart.`
    });
    
    // Reset selection for this item
    setSelectedItems(prevItems => prevItems.filter(it => it._id !== item._id));
    
    // Clean up related data
    setSpicyPreferences(prev => {
      const updated = { ...prev };
      delete updated[item._id];
      return updated;
    });
    
    setSpecialInstructions(prev => {
      const updated = { ...prev };
      delete updated[item._id];
      return updated;
    });
    
    setSelectedAddOns(prev => {
      const updated = { ...prev };
      delete updated[item._id];
      return updated;
    });
  };

  const handleSpicyChange = (itemId, spicyLevel) => {
    setSpicyPreferences(prev => {
      const currentSelections = [...(prev[itemId] || [])];
      const levelIndex = currentSelections.indexOf(spicyLevel);
      
      if (levelIndex !== -1) {
        // Remove this level
        currentSelections.splice(levelIndex, 1);
      } else {
        // Add this level
        currentSelections.push(spicyLevel);
      }
      
      return {
        ...prev,
        [itemId]: currentSelections
      };
    });
  };

  const handleInstructionsChange = (itemId, instructions) => {
    setSpecialInstructions(prev => ({
      ...prev,
      [itemId]: instructions
    }));
  };

  const handleAddOnToggle = (itemId, addOn) => {
    const currentAddOns = selectedAddOns[itemId] || [];
    return currentAddOns.some(a => a._id === addOn._id);
  };

  const handleAddOnToggleChange = (itemId, addOn) => {
    setSelectedAddOns(prev => {
      const currentAddOns = [...(prev[itemId] || [])];
      const addOnIndex = currentAddOns.findIndex(a => a._id === addOn._id);
      
      if (addOnIndex !== -1) {
        // Remove this add-on
        currentAddOns.splice(addOnIndex, 1);
      } else {
        // Add this add-on
        currentAddOns.push(addOn);
      }
      
      return {
        ...prev,
        [itemId]: currentAddOns
      };
    });
  };

  const handleSearchChange = (term) => {
    console.log(`Search term changed to: "${term}"`);
    setSearchTerm(term);
    
    // Clear search - revert to menu filter or all items
    if (!term) {
      if (selectedMenu) {
        console.log(`Search cleared with active menu: ${selectedMenu.menuName}. Filtering by menu.`);
        filterItemsByMenuId(selectedMenu._id);
      } else {
        console.log(`Search cleared with no active menu. Showing all items.`);
        setFilteredItems(allItems);
      }
    } else {
      console.log(`Search initiated with term: "${term}"`);
      // When search term is entered, searchData effect will handle the response
    }
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-app-primary" />
      <span className="ml-3 text-app-primary font-medium">Loading...</span>
    </div>
  );

  const renderError = (message) => (
    <div className="bg-red-50 text-red-600 p-4 rounded-lg mt-4 text-center">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for items..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-app-primary focus:border-app-primary"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Menus List */}
      {isLoadingMenus ? (
        renderLoading()
      ) : menusError ? (
        renderError("Could not load menus. Please try again.")
      ) : (
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <button
              key="all-items"
              onClick={handleClearMenuFilter}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                !selectedMenu
                  ? 'bg-app-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {/* Check different possible data structures for menu response */}
            {/* {Array.isArray(menusData) ? (
              menusData.map(menu => (
                <button
                  key={menu._id}
                  onClick={() => handleMenuClick(menu)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedMenu?._id === menu._id
                      ? 'bg-app-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {menu.menuName}
                </button>
              ))
            ) : menusData && menusData.menus && Array.isArray(menusData.menus) ? (
              menusData.menus.map(menu => (
                <button
                  key={menu._id}
                  onClick={() => handleMenuClick(menu)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedMenu?._id === menu._id 
                      ? 'bg-app-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {menu.menuName}
                </button>
              ))
            ) : (
              <span className="text-red-500">No menu categories found</span>
            )} */}
          </div>
        </div>
      )}

      {/* Menu Items */}
      {isSearching ? (
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-3">Searching...</h3>
          {renderLoading()}
        </div>
      ) : isLoadingAllItems && !selectedMenu ? (
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-3">Loading All Items</h3>
          {renderLoading()}
        </div>
      ) : isLoadingMenuItems && selectedMenu ? (
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-3">Loading {selectedMenu.menuName} Items</h3>
          {renderLoading()}
        </div>
      ) : (
        <>
          <div className="mt-4">
            <h3 className="font-medium text-gray-700 mb-3">
              {searchTerm ? 'Search Results' : selectedMenu ? `Items in ${selectedMenu.menuName}` : 'All Items'}
            </h3>
            
            {filteredItems && filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredItems.map(item => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                    isSelected={selectedItems.some(selectedItem => selectedItem._id === item._id)}
                    onSelect={handleItemSelect}
                  onAddToCart={handleAddToCart}
                    spicyPreferences={spicyPreferences[item._id] || []}
                    onSpicyChange={handleSpicyChange}
                    addOns={addOnsData || []}
                    onAddOnToggle={handleAddOnToggle}
                  onAddOnToggleChange={handleAddOnToggleChange}
                    specialInstructions={specialInstructions[item._id] || ''}
                    onInstructionsChange={handleInstructionsChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'No items found matching your search criteria.' 
                    : selectedMenu 
                      ? `No items available in ${selectedMenu.menuName} category.` 
                      : 'No items available.'
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantsList;
