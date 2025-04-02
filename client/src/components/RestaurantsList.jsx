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

  // Add console logs for debugging
  useEffect(() => {
    console.log('Restaurants Data:', restaurantsData);
    console.log('Loading State:', isLoadingRestaurants);
    console.log('Error:', restaurantsError);
  }, [restaurantsData, isLoadingRestaurants, restaurantsError]);

  // Update filtered items when search results arrive
  useEffect(() => {
    if (searchData?.data) {
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

  const handleItemClick = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(i => i._id === item._id);
      if (isSelected) {
        return prev.filter(i => i._id !== item._id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleAddOnToggle = (itemId, addOn) => {
    setSelectedAddOns(prev => {
      const currentAddOns = prev[itemId] || [];
      const exists = currentAddOns.some(a => a._id === addOn._id);
      
      if (exists) {
        return {
          ...prev,
          [itemId]: currentAddOns.filter(a => a._id !== addOn._id)
        };
      } else {
        return {
          ...prev,
          [itemId]: [...currentAddOns, addOn]
        };
      }
    });
  };

  const handleSpicyPreferenceChange = (itemId, value) => {
    setSpicyPreferences(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSpecialInstructionChange = (itemId, value) => {
    setSpecialInstructions(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleAddToCart = (item) => {
    const selectedItemAddOns = selectedAddOns[item._id] || [];
    const spicyPreference = spicyPreferences[item._id] || 'Normal';
    const specialInstruction = specialInstructions[item._id] || '';

    // Validation checks
    if (!spicyPreference) {
      toast({
        title: "Please select spicy preference",
        description: "Choose a spicy level for your item",
        variant: "destructive",
      });
      return;
    }

    // Create the item object with all selections
    const itemToAdd = {
      ...item,
      addOns: selectedItemAddOns,
      specialInstructions: specialInstruction,
      spicyPreference: spicyPreference,
      quantity: 1
    };

    onMenuItemSelect(itemToAdd);
    
    // Success toast with more details
    toast({
      title: "Item added to cart",
      description: `${item.itemName || item.name} with ${selectedItemAddOns.length} add-ons and ${spicyPreference} spice level. The quantity will be increased if this exact configuration already exists in your cart.`,
      variant: "default",
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
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-app-primary" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-4">
        <SearchBar 
          onCustomerSearch={handleSearch} 
          placeholder="Search for menu items..." 
          buttonText="Find" 
          searchType="menu"
        />
        
        {searchTerm && filteredItems.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md shadow-sm">
            <h3 className="text-sm font-medium mb-2">Search Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredItems.map(item => (
                <div 
                  key={item._id} 
                  className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 shadow-sm transition-all cursor-pointer"
                  onClick={() => handleAddToCart(item)}
                >
                  <div className="flex items-center">
                    <img 
                      src={item.image} 
                      alt={item.itemName || item.name} 
                      className="w-12 h-12 rounded-md mr-2 object-cover border border-gray-200" 
                    />
                    <div>
                      <div className="font-medium">{item.itemName || item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.description && item.description.substring(0, 50)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-app-primary">₹{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {searchTerm && isSearching && renderLoading()}
        
        {searchTerm && !isSearching && filteredItems.length === 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md text-center text-gray-500">
            No items found matching "{searchTerm}"
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Restaurants</h3>
        
        {isLoadingRestaurants ? renderLoading() : (
          <div className="flex flex-wrap gap-4">
            {restaurantsData?.restaurants?.map(restaurant => (
              <div
                key={restaurant._id}
                onClick={() => handleRestaurantClick(restaurant)}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedRestaurant?._id === restaurant._id ? 'bg-app-secondary text-white shadow-md' : 'bg-white hover:bg-gray-50 border'
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-white shadow-sm">
                  <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium">{restaurant.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRestaurant && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Branches</h3>
          
          {isLoadingSubRestaurants ? renderLoading() : (
            <div className="flex flex-wrap gap-4">
              {subRestaurantsData?.subRestaurants?.map(subRestaurant => (
                <div
                  key={subRestaurant._id}
                  onClick={() => handleSubRestaurantClick(subRestaurant)}
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedSubRestaurant?._id === subRestaurant._id ? 'bg-app-secondary text-white shadow-md' : 'bg-white hover:bg-gray-50 border'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-white shadow-sm">
                    <img src={subRestaurant.image?.[0] || 'https://via.placeholder.com/50'} alt={subRestaurant.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium">{subRestaurant.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSubRestaurant && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Menu Categories</h3>
          
          {isLoadingMenus ? renderLoading() : (
            <div className="flex flex-wrap gap-4">
              {menusData?.menu_list?.map(menu => (
                <div
                  key={menu._id}
                  onClick={() => handleMenuClick(menu)}
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedMenu?._id === menu._id ? 'bg-app-secondary text-white shadow-md' : 'bg-white hover:bg-gray-50 border'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-white shadow-sm">
                    <img src={menu.image || 'https://via.placeholder.com/50'} alt={menu.menuName} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium">{menu.menuName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedMenu && (
        <div>
          <h3 className="text-sm font-medium mb-3">Menu Items</h3>
          
          {isLoadingMenuItems ? renderLoading() : (
            <div className="flex flex-col gap-4">
              {/* Selected Items Section */}
              {selectedItems.length > 0 && (
                <div className="border-b pb-4">
                  <h4 className="text-sm font-medium mb-3 text-app-primary">Selected Items</h4>
                  <div className="flex flex-wrap gap-4">
                    {menuItemsData?.menu_items
                      ?.filter(item => selectedItems.some(i => i._id === item._id))
                      .map(item => (
                        <Card 
                          key={item._id} 
                          className="flex-grow sm:flex-grow-0 border-app-secondary border-2"
                        >
                          <div 
                            className="flex items-center p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleItemClick(item)}
                          >
                            <input 
                              type="checkbox"
                              checked={true}
                              onChange={() => handleItemClick(item)}
                              className="mr-3"
                            />
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-white shadow-sm">
                              <img src={item.image || 'https://via.placeholder.com/50'} alt={item.itemName} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-medium text-sm">{item.itemName}</h4>
                              <div className="text-sm font-bold text-app-primary">₹{item.price}</div>
                            </div>
                          </div>

                          <CardContent className="border-t border-gray-100 bg-gray-50 p-4">
                            <div className="mb-3">
                              <label className="block text-sm font-medium mb-2">Spicy Preference</label>
                              <div className="flex gap-3">
                                {['Not Spicy', 'Normal', 'Extra Spicy'].map((option) => (
                                  <label key={option} className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`spicy-${item._id}`}
                                      value={option}
                                      checked={spicyPreferences[item._id] === option}
                                      onChange={() => handleSpicyPreferenceChange(item._id, option)}
                                      className="mr-1"
                                    />
                                    <span className="text-sm">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {isLoadingAddOns ? (
                              <div className="text-center py-2">Loading add-ons...</div>
                            ) : (
                              addOnsData?.data?.length > 0 && (
                                <div className="mb-3">
                                  <label className="block text-sm font-medium mb-2">Add-ons</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {addOnsData.data.map(addOn => (
                                      <div key={addOn._id} className="flex items-center justify-between p-2 bg-white rounded border">
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedAddOns[item._id]?.some(a => a._id === addOn._id) || false}
                                            onChange={() => handleAddOnToggle(item._id, addOn)}
                                            className="mr-2"
                                          />
                                          <span className="text-sm">{addOn.itemName}</span>
                                        </label>
                                        <span className="text-sm text-app-primary font-medium">₹{addOn.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}

                            <div>
                              <label className="block text-sm font-medium mb-2">Special Instructions</label>
                              <textarea
                                placeholder="Any special instructions..."
                                value={specialInstructions[item._id] || ''}
                                onChange={(e) => handleSpecialInstructionChange(item._id, e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm"
                                rows="2"
                              />
                            </div>

                            <button
                              onClick={() => handleAddToCart(item)}
                              className="w-full mt-4 bg-app-primary text-black py-2 rounded-md text-sm font-medium hover:bg-app-primary/90 transition-colors"
                            >
                              Add to Cart
                            </button>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Unselected Items Section */}
              <div className="flex flex-wrap gap-4">
                {menuItemsData?.menu_items
                  ?.filter(item => !selectedItems.some(i => i._id === item._id))
                  .map(item => (
                    <Card 
                      key={item._id} 
                      className="flex-grow sm:flex-grow-0 border h-[72px]"
                    >
                      <div 
                        className="flex items-center p-4 cursor-pointer hover:bg-gray-50 h-full"
                        onClick={() => handleItemClick(item)}
                      >
                        <input 
                          type="checkbox"
                          checked={false}
                          onChange={() => handleItemClick(item)}
                          className="mr-3"
                        />
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-white shadow-sm">
                          <img src={item.image || 'https://via.placeholder.com/50'} alt={item.itemName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-sm">{item.itemName}</h4>
                          <div className="text-sm font-bold text-app-primary">₹{item.price}</div>
                        </div>
                      </div>
                    </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantsList;
