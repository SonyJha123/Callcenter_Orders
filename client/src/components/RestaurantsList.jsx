import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { 
  useGetAllRestaurantsQuery, 
  useGetSubRestaurantsQuery, 
  useGetMenusQuery, 
  useGetMenuItemsQuery, 
  useSearchItemsQuery,
  useGetAddOnsQuery
} from '../redux/services/restaurantApi';
import { useToast } from "@/hooks/use-toast";

const SPICY_LEVELS = [
  { id: 'not-spicy', label: 'Not Spicy', value: 'Not Spicy' },
  { id: 'normal', label: 'Normal', value: 'Normal' },
  { id: 'spicy', label: 'Spicy', value: 'Spicy' },
  { id: 'extra-spicy', label: 'Extra Spicy', value: 'Extra Spicy' }
];

const MenuItemCard = ({ item, isSelected, onSelect, onAddToCart, spicyPreferences, onSpicyChange, addOns, onAddOnToggle, onAddOnToggleChange, specialInstructions, onInstructionsChange }) => {
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
              src={item.image || 'https://via.placeholder.com/50'} 
              alt={item.itemName} 
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
          <span className="text-sm font-medium text-center line-clamp-2">{item.itemName}</span>
          {/* <span className="text-sm font-bold mt-2 text-app-primary">₹{item.price}</span> */}
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
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedSubRestaurant, setSelectedSubRestaurant] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState({});
  const [spicyPreferences, setSpicyPreferences] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  const { toast } = useToast();
  
  // API Query hooks
  const { data: restaurantsData, isLoading: isLoadingRestaurants, error: restaurantsError } = useGetAllRestaurantsQuery({ page: 1, limit: 10 });
  const { data: subRestaurantsData, isLoading: isLoadingSubRestaurants } = useGetSubRestaurantsQuery(
    { restaurantId: selectedRestaurant?._id },
    { skip: !selectedRestaurant }
  );
  const { data: menusData, isLoading: isLoadingMenus } = useGetMenusQuery(
    selectedSubRestaurant?._id,
    { skip: !selectedSubRestaurant }
  );
  const { data: menuItemsData, isLoading: isLoadingMenuItems } = useGetMenuItemsQuery(
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

  // Update the debug logs to better understand the API response structure
  useEffect(() => {
    console.log('Restaurants Data:', restaurantsData);
    if (restaurantsData) {
      console.log('Restaurants Array:', restaurantsData.restaurants || restaurantsData.data?.restaurants || []);
    }
    console.log('Loading State:', isLoadingRestaurants);
    console.log('Error:', restaurantsError);
  }, [restaurantsData, isLoadingRestaurants, restaurantsError]);

  // Update filtered items when search results arrive
  useEffect(() => {
    if (searchData?.data) {
      console.log('Search results:', searchData.data);
      const allResults = [
        ...(searchData.data.item || []).map(item => ({
          ...item,
          type: 'item'
        }))
      ];
      setFilteredItems(allResults);
    }
  }, [searchData]);

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedSubRestaurant(null);
    setSelectedMenu(null);
    setSelectedItems([]);
  };

  const handleSubRestaurantClick = (subRestaurant) => {
    setSelectedSubRestaurant(subRestaurant);
    setSelectedMenu(null);
    setSelectedItems([]);
  };

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
    setSelectedItems([]);
  };

  const handleSearch = (term) => {
    console.log('Searching for:', term);
    setSearchTerm(term);
    if (!term) {
      setFilteredItems([]);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredItems([]);
  };

  const handleItemClick = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(i => i._id === item._id);
      if (isSelected) {
        // If deselecting, clear any associated data
        setSelectedAddOns(prev => {
          const newAddOns = { ...prev };
          delete newAddOns[item._id];
          return newAddOns;
        });
        setSpicyPreferences(prev => {
          const newPrefs = { ...prev };
          delete newPrefs[item._id];
          return newPrefs;
        });
        setSpecialInstructions(prev => {
          const newInstructions = { ...prev };
          delete newInstructions[item._id];
          return newInstructions;
        });
        return prev.filter(i => i._id !== item._id);
      } else {
        return [...prev, item];
      }
    });

    // Clear search if selecting from search results
    if (searchTerm && filteredItems.some(i => i._id === item._id)) {
      clearSearch();
    }
  };

  const handleSpicyPreferenceChange = (itemId, value) => {
    console.log('Setting spicy preference:', itemId, value);
    
    setSpicyPreferences(prev => {
      // Initialize if not exists
      if (!prev[itemId]) {
        return {
          ...prev,
          [itemId]: [value]
        };
      }
      
      const currentPrefs = [...prev[itemId]];
      const index = currentPrefs.indexOf(value);
      
      // Toggle the preference
      if (index > -1) {
        currentPrefs.splice(index, 1);
      } else {
        currentPrefs.push(value);
      }
      
      // If "Normal" is selected, ensure it's recorded correctly
      if (value === 'Normal' && index === -1) {
        console.log('Normal spice level selected');
      }
      
      return {
        ...prev,
        [itemId]: currentPrefs
      };
    });
  };

  const handleSpecialInstructionChange = (itemId, value) => {
    setSpecialInstructions(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  // Check if an add-on is selected for an item (without changing state)
  const isAddOnSelected = (itemId, addOn) => {
    return selectedAddOns[itemId]?.some(a => a._id === addOn._id) || false;
  };

  // Handle add-on toggle
  const handleAddOnToggleChange = (itemId, addOn) => {
    if (!selectedAddOns[itemId]) {
      setSelectedAddOns(prev => ({
        ...prev,
        [itemId]: [addOn]
      }));
    } else {
      const isSelected = selectedAddOns[itemId].some(a => a._id === addOn._id);
      setSelectedAddOns(prev => {
        const updatedAddOns = { ...prev };
        if (isSelected) {
          updatedAddOns[itemId] = updatedAddOns[itemId].filter(a => a._id !== addOn._id);
        } else {
          updatedAddOns[itemId] = [...updatedAddOns[itemId], addOn];
        }
        return updatedAddOns;
      });
    }
  };

  // Fetch add-ons for search results when they are displayed
  useEffect(() => {
    if (filteredItems.length > 0 && searchTerm) {
      // Clear previous selections for search results
      filteredItems.forEach(item => {
        if (!spicyPreferences[item._id]) {
          setSpicyPreferences(prev => ({
            ...prev,
            [item._id]: []
          }));
        }
      });
    }
  }, [filteredItems, searchTerm]);

  const handleAddToCart = (item) => {
    const selectedItemAddOns = selectedAddOns[item._id] || [];
    // Use item.spicyPreferences if provided directly (for search results)
    const itemSpicyPreferences = item.spicyPreferences || spicyPreferences[item._id] || [];
    const specialInstruction = specialInstructions[item._id] || '';

    // Validate at least one spicy preference is selected
    if (itemSpicyPreferences.length === 0) {
      toast({
        title: "Please select spicy level(s)",
        description: "Choose at least one spicy level before adding to cart",
        variant: "destructive",
      });
      return;
    }

    // Create the item object with all selections
    const itemToAdd = {
      ...item,
      addOns: selectedItemAddOns.map(addOn => ({
        _id: addOn._id,
        itemName: addOn.itemName || addOn.name,
        price: parseFloat(addOn.price)
      })),
      specialInstructions: specialInstruction,
      spicyPreferences: itemSpicyPreferences,
      quantity: 1,
      basePrice: parseFloat(item.price) // Store the base price separately
    };

    console.log('Adding to cart:', itemToAdd);

    // Call the parent component's handler with the item and its configuration
    onMenuItemSelect(itemToAdd);
    
    // Success toast with more details
    toast({
      title: "Item added to cart",
      description: `${item.itemName} with ${selectedItemAddOns.length} add-on${selectedItemAddOns.length !== 1 ? 's' : ''} and ${itemSpicyPreferences.join(', ')} spice levels`,
    });

    // Clear selections for this item
    setSelectedAddOns(prev => {
      const newAddOns = { ...prev };
      delete newAddOns[item._id];
      return newAddOns;
    });
    setSpicyPreferences(prev => {
      const newPrefs = { ...prev };
      delete newPrefs[item._id];
      return newPrefs;
    });
    setSpecialInstructions(prev => {
      const newInstructions = { ...prev };
      delete newInstructions[item._id];
      return newInstructions;
    });
    setSelectedItems(prev => prev.filter(i => i._id !== item._id));

    // Clear search if item was selected from search results
    if (searchTerm && filteredItems.some(i => i._id === item._id)) {
      clearSearch();
    }
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-app-primary" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="mb-4">
        <SearchBar 
          onCustomerSearch={handleSearch} 
          placeholder="Search for menu items..." 
          buttonText="Find" 
          searchType="menu"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {searchTerm && filteredItems.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Search Results</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredItems.map(item => (
                <div
                  key={item._id}
                  className="relative group"
                >
                  <div className="flex flex-col rounded-lg transition-all duration-200 bg-white hover:bg-gray-50 border hover:shadow-md">
                    {/* Item Header - Always Visible */}
                    <div 
                      className="flex flex-col items-center p-4 cursor-pointer"
                    >
                      <div className="relative w-16 h-16 mb-3">
                        <img 
                          src={item.image || 'https://via.placeholder.com/50'} 
                          alt={item.itemName} 
                          className="w-full h-full rounded-full object-cover border-2 border-white shadow-md transition-shadow" 
                        />
                      </div>
                      <span className="text-sm font-medium text-center line-clamp-2">{item.itemName}</span>
                      <span className="text-sm font-bold mt-2 text-app-primary">₹{item.price}</span>
                      
                      {/* Spicy Level Selection */}
                      <div className="w-full mt-2">
                        <label className="block text-xs font-medium mb-2 text-gray-600">Select Spicy Level:</label>
                        <select 
                          className="w-full text-sm p-1 border rounded"
                          value={spicyPreferences[item._id]?.[0] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              setSpicyPreferences(prev => ({
                                ...prev,
                                [item._id]: [value]
                              }));
                            }
                          }}
                        >
                          <option value="">Select spice level</option>
                          {SPICY_LEVELS.map(level => (
                            <option key={level.id} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Quick Add to Cart Button */}
                      <button
                        className="w-full bg-app-primary text-white font-medium py-2 px-4 rounded-lg mt-3 hover:bg-app-primary/90"
                        onClick={() => {
                          // Set spicy level to Normal if none selected
                          if (!spicyPreferences[item._id] || spicyPreferences[item._id].length === 0) {
                            setSpicyPreferences(prev => ({
                              ...prev,
                              [item._id]: ['Normal']
                            }));
                            
                            // Add timeout to ensure state is updated before adding to cart
                            setTimeout(() => {
                              handleAddToCart({
                                ...item,
                                spicyPreferences: ['Normal']
                              });
                            }, 10);
                          } else {
                            handleAddToCart(item);
                          }
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {searchTerm && isSearching && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Search Results</h3>
            {renderLoading()}
          </div>
        )}
        
        {searchTerm && !isSearching && filteredItems.length === 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Search Results</h3>
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              No items found matching "{searchTerm}"
            </div>
          </div>
        )}
      </div>

      {/* Restaurants Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Restaurants</h3>
        {isLoadingRestaurants ? (
          renderLoading()
        ) : restaurantsError ? (
          <div className="p-4 bg-red-50 rounded-lg text-center text-red-500">
            Error loading restaurants. Please try again.
          </div>
        ) : restaurantsData && (restaurantsData.restaurants || restaurantsData.data?.restaurants || []).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(restaurantsData.restaurants || restaurantsData.data?.restaurants || []).map(restaurant => (
              <div
                key={restaurant._id}
                onClick={() => handleRestaurantClick(restaurant)}
                className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all hover:shadow-md h-[60px] ${
                  selectedRestaurant?._id === restaurant._id 
                    ? 'bg-gray-400 text-white shadow-md ring-2 ring-app-primary' 
                    : 'bg-white hover:bg-gray-50 border'
                }`}
              >
                <span className="text-sm font-medium text-center line-clamp-2">{restaurant.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            No restaurants found. Please check your connection or try again later.
          </div>
        )}
      </div>

      {/* Branches Section */}
      {selectedRestaurant && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Branches</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {isLoadingSubRestaurants ? renderLoading() : (
              subRestaurantsData?.subRestaurants?.map(subRestaurant => (
                <div
                  key={subRestaurant._id}
                  onClick={() => handleSubRestaurantClick(subRestaurant)}
                  className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all hover:shadow-md h-[60px] ${
                    selectedSubRestaurant?._id === subRestaurant._id 
                      ? 'bg-gray-400 text-white shadow-md ring-2 ring-app-primary' 
                      : 'bg-white hover:bg-gray-50 border'
                  }`}
                >
                  {/* <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-white shadow-md">
                    <img 
                      src={subRestaurant.image?.[0] || 'https://via.placeholder.com/50'} 
                      alt={subRestaurant.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div> */}
                  <span className="text-sm font-medium text-center line-clamp-2">{subRestaurant.name}</span>
                  {subRestaurant.address && (
                    <span className="text-xs text-center mt-1 opacity-75 line-clamp-1">{subRestaurant.address}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Menu Categories Section */}
      {selectedSubRestaurant && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Menu Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {isLoadingMenus ? renderLoading() : (
              menusData?.menu_list?.map(menu => (
                <div
                  key={menu._id}
                  onClick={() => handleMenuClick(menu)}
                  className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all hover:shadow-md h-[60px] ${
                    selectedMenu?._id === menu._id 
                      ? 'bg-gray-400 text-white shadow-md ring-2 ring-app-primary' 
                      : 'bg-white hover:bg-gray-50 border'
                  }`}
                >
                  {/* <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-white shadow-md">
                    <img 
                      src={menu.image || 'https://via.placeholder.com/50'} 
                      alt={menu.menuName} 
                      className="w-full h-full object-cover" 
                    />
                  </div> */}
                  <span className="text-sm font-medium text-center line-clamp-2">{menu.menuName}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Menu Items Section */}
      {selectedMenu && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Menu Items</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {isLoadingMenuItems ? renderLoading() : (
              menuItemsData?.menu_items?.map(item => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  isSelected={selectedItems.some(i => i._id === item._id)}
                  onSelect={handleItemClick}
                  onAddToCart={handleAddToCart}
                  spicyPreferences={spicyPreferences[item._id]}
                  onSpicyChange={handleSpicyPreferenceChange}
                  addOns={addOnsData?.data || []}
                  onAddOnToggle={isAddOnSelected}
                  onAddOnToggleChange={handleAddOnToggleChange}
                  specialInstructions={specialInstructions[item._id]}
                  onInstructionsChange={handleSpecialInstructionChange}
                />
              ))
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default RestaurantsList;
