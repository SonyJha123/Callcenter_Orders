import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './SearchBar';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Tag } from "lucide-react";
import {
  useGetMenuListQuery,
  useGetAllItemsQuery,
  useGetItemsByMenuIdQuery,
  useGetMenuItemQuery,
  useGetAddOnsQuery,
  useSearchItemsQuery
} from '../redux/services/restaurantApi';
import { useToast } from "@/hooks/use-toast";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';



const SPICY_LEVELS = [
  { id: 'not-spicy', label: 'Not Spicy', value: 'Not Spicy' },
  { id: 'normal', label: 'Normal', value: 'Normal' },
  { id: 'spicy', label: 'Spicy', value: 'Spicy' },
  { id: 'extra-spicy', label: 'Extra Spicy', value: 'Extra Spicy' }
];

const MenuItemCard = ({ item, isSelected, onSelect, onAddToCart, spicyPreferences, onSpicyChange, addOns, onAddOnToggle, onAddOnToggleChange, specialInstructions, onInstructionsChange, onClose }) => {
  const itemName = item.itemName || item.name || item.title || '';
  const itemPrice = parseFloat(item.price) || 0;
  const itemImage = item.image || item.imageUrl || item.img || 'https://via.placeholder.com/50';

  useEffect(() => {
    if (isSelected) {
    }
  }, [isSelected, item._id, addOns]);

  return (
    <div
      className={`${isSelected ? 'sm:col-span-2 md:col-span-2 lg:col-span-2' : ''
        } relative group`}
    >
      <div
        className={`flex flex-col rounded-lg transition-all duration-200 overflow-hidden shadow-[0px_0px_8px_#d9d9d9] ${isSelected
          ? 'bg-white border-2 border-app-primary shadow-lg'
          : 'bg-white hover:bg-gray-50 border hover:shadow-md'
          }`}
      >
        <div
          onClick={() => onSelect(item)}
          className={`relative cursor-pointer ${isSelected ? 'pb-2' : 'h-full'}`}
        >
          <div className="relative">
            <img
              src={itemImage}
              alt={itemName}
              className="object-cover w-[200px] lg:max-h-[80px] xl:max-h-[105px]"
            />
            {/* <div className="absolute -top-2 -right-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(item)}
                className="h-5 w-5 rounded-md border-2 border-app-primary text-app-primary focus:ring-app-primary cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div> */}
          </div>
          <div className="px-4 pt-4 pb-4 flex flex-col">
            <span className="text-[16px] font-medium items-center overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">{itemName}</span>
            <span className="font-bold mt-2 text-app-primary text-[18px] border-b pb-2">${itemPrice.toFixed(2)}</span>
            <span className="rounded-[5px] text-center text-sm font-medium bg-app-primary text-primary-foreground hover:bg-app-primary/90 px-4 py-2 rounded-md px-3">Customise deal</span>
          </div>
          {/* <div className="absolute -top-2 -right-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(item)}
                className="h-5 w-5 rounded-md border-2 border-app-primary text-app-primary focus:ring-app-primary cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div> */}
        </div>

        {isSelected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative max-w-md w-full mx-4 bg-white rounded-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
                <div className="mb-4">
                  <label className="block text-[16px] font-semibold mb-2 text[#000]">Spicy Levels (Select Multiple)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPICY_LEVELS.map((level) => (
                      <label
                        key={level.id}
                        className={`flex items-center justify-between p-2 rounded border transition-all ${spicyPreferences?.includes(level.value)
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
                            className="h-4 w-4 rounded text-app-primary border-gray-300 focus:ring-app-primary accent-app-primary"
                          />
                          <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {addOns && addOns.data && addOns.data.length > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      <Tag className="h-[20px] w-[20px] text-app-primary" />
                      <label className="text-[16px] font-semibold mb-2 text[#000]">Add-ons</label>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {addOns.data.map(addOn => (
                        <label
                          key={addOn._id}
                          className={`flex items-center justify-between p-2 rounded border transition-all ${onAddOnToggle(item._id, addOn)
                            ? 'bg-app-primary/5 border-app-primary'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                            } cursor-pointer`}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={onAddOnToggle(item._id, addOn)}
                              onChange={() => onAddOnToggleChange(item._id, addOn)}
                              className="mr-2 text-app-primary rounded border-gray-300 focus:ring-app-primary accent-app-primary"
                            />
                            <span className="text-sm">{addOn.itemName || addOn.name}</span>
                          </div>
                          <span className="text-app-primary font-medium text-sm">${addOn.price}</span>
                        </label>
                      ))}
                    </div>

                    {onAddOnToggle && (
                      <div className="mt-2 text-xs text-gray-600">
                        {addOns.data.filter(addOn => onAddOnToggle(item._id, addOn)).length > 0 && (
                          <div className="flex justify-between pt-1 border-t">
                            <span className='text-[14px] font-semibold mb-2 text[#000]'>Selected Add-ons ({addOns.data.filter(addOn => onAddOnToggle(item._id, addOn)).length})</span>
                            <span>${addOns.data.filter(addOn => onAddOnToggle(item._id, addOn))
                              .reduce((sum, addOn) => sum + parseFloat(addOn.price), 0).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      <Tag className="h-[20px] w-[20px] text-app-primary" />
                      <label className="text-[16px] font-semibold mb-2 text[#000]">Add-ons</label>
                    </div>
                    <p className="text-xs text-gray-500 italic p-2 border rounded">No add-ons available for this item</p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-[16px] font-semibold mb-2 text[#000]">Special Instructions</label>
                  <textarea
                    placeholder="Any special requests..."
                    rows="2"
                    className="w-full text-sm p-2 border rounded bg-white text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-app-primary shadow-sm"
                    value={specialInstructions}
                    onChange={(e) => onInstructionsChange(item._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

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
            </div>
          </div>


        )}
      </div>
    </div>
  );
};

const RestaurantsList = ({ onMenuItemSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const sliderRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollPosition - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setScrollPosition(sliderRef.current.scrollLeft);
  };

  const scroll = (offset) => {
    const newPosition = scrollPosition + offset;
    setScrollPosition(newPosition);
    sliderRef.current.scrollLeft = newPosition;
  };

  const handleCloseModal = () => {
    setSelectedItems([]);
  };

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState({});
  const [spicyPreferences, setSpicyPreferences] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [allItems, setAllItems] = useState([]);

  const { toast } = useToast();

  const { data: menusData, isLoading: isLoadingMenus, error: menusError } = useGetMenuListQuery();
  const { data: allItemsData, isLoading: isLoadingAllItems } = useGetAllItemsQuery();
  const { data: menuItemsData, isLoading: isLoadingMenuItems } = useGetItemsByMenuIdQuery(
    selectedMenu?._id,
    { skip: !selectedMenu }
  );
  const { data: searchData, isLoading: isSearching } = useSearchItemsQuery(
    searchTerm,
    { skip: !searchTerm || searchTerm.length < 2 }
  );

  useEffect(() => {
    if (searchData) {
    }
  }, [searchData]);

  const {
    data: addOnsData,
    isLoading: isLoadingAddOns,
    error: addOnsError
  } = useGetAddOnsQuery(
    selectedItems.length > 0 ? selectedItems[0]._id : null,
    {
      skip: selectedItems.length === 0,
      refetchOnMountOrArgChange: true
    }
  );

  useEffect(() => {
    if (addOnsError) {
      console.error("Error loading add-ons:", addOnsError);
    }
  }, [addOnsData, selectedItems, isLoadingAddOns, addOnsError]);

  useEffect(() => {
    if (allItemsData) {
      setAllItems(allItemsData);

      if (!selectedMenu && !searchTerm) {
        setFilteredItems(allItemsData);
      }
    }
  }, [allItemsData, selectedMenu, searchTerm]);

  useEffect(() => {
    if (searchTerm && searchData) {
      if (Array.isArray(searchData)) {
        setFilteredItems(searchData);
      } else if (searchData.data && Array.isArray(searchData.data)) {
        setFilteredItems(searchData.data);
      }
    } else if (!searchTerm && !selectedMenu) {
      setFilteredItems(allItems);
    }
  }, [searchData, searchTerm, selectedMenu, allItems]);

  useEffect(() => {
    if (selectedMenu) {
      if (menuItemsData) {
        let items = [];

        if (Array.isArray(menuItemsData)) {
          items = menuItemsData;
        } else if (menuItemsData.items && Array.isArray(menuItemsData.items)) {
          items = menuItemsData.items;
        }

        if (items.length > 0) {
          setFilteredItems(items);
        } else {
          filterItemsByMenuId(selectedMenu._id);
        }
      } else if (!isLoadingMenuItems) {
        filterItemsByMenuId(selectedMenu._id);
      }
    }
  }, [selectedMenu, menuItemsData, isLoadingMenuItems, allItems]);

  const filterItemsByMenuId = (menuId) => {
    if (!menuId || !allItems || allItems.length === 0) {
      return;
    }

    const menuItems = allItems.filter(item => {
      const matches =
        item.menuId === menuId ||
        (item.menu === menuId) ||
        (item.menu && item.menu._id === menuId) ||
        item.menuObjectId === menuId ||
        item.menuRef === menuId ||
        item.category === menuId ||
        item.categoryId === menuId;

      if (matches) {
      }

      return matches;
    });

    setFilteredItems(menuItems.length > 0 ? menuItems : []);
  };

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
    setSelectedItems([]);
  };

  const handleClearMenuFilter = () => {
    setSelectedMenu(null);
    setFilteredItems(allItems);
  };

  const handleItemSelect = (item) => {
    const isAlreadySelected = selectedItems.some(selectedItem => selectedItem._id === item._id);

    if (isAlreadySelected) {
      setSelectedItems(prevItems => prevItems.filter(prevItem => prevItem._id !== item._id));

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
      setSelectedItems(prevItems => {
        return [item];
      });
    }
  };

  const handleAddToCart = (item) => {
    const itemName = item.itemName || item.name || item.title || '';
    const itemPrice = parseFloat(item.price) || 0;
    const itemImage = item.image || item.imageUrl || item.img || 'https://via.placeholder.com/50';

    const itemAddOns = selectedAddOns[item._id] || [];

    const instructions = specialInstructions[item._id] || '';
    const spicy = spicyPreferences[item._id] || [];

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


    onMenuItemSelect(cartItem);

    toast({
      title: "Item Added",
      description: `${itemName} has been added to your cart.`
    });

    setSelectedItems(prevItems => prevItems.filter(it => it._id !== item._id));

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
        currentSelections.splice(levelIndex, 1);
      } else {
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
        currentAddOns.splice(addOnIndex, 1);
      } else {
        currentAddOns.push(addOn);
      }


      return {
        ...prev,
        [itemId]: currentAddOns
      };
    });
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);

    if (!term) {
      if (selectedMenu) {
        filterItemsByMenuId(selectedMenu._id);
      } else {
        setFilteredItems(allItems);
      }
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
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for items..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-[20px] leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-app-primary shadow-sm"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {isLoadingMenus ? (
        renderLoading()
      ) : menusError ? (
        renderError("Could not load menus. Please try again.")
      ) : (
        <div className="mb-6">
          {/* <h3 className="text-[#000] text-[18px] font-semibold mb-3">Categories</h3> */}
          <div className="flex flex-wrap w-full gap-2">
            <button
              key="all-items"
              onClick={handleClearMenuFilter}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors mb-[10px] ${!selectedMenu
                  ? 'bg-app-primary text-white font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Items
            </button>
            {Array.isArray(menusData) ? (
              menusData.map(menu => (
                <button
                  key={menu._id}
                  onClick={() => handleMenuClick(menu)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors mb-[10px] ${selectedMenu?._id === menu._id
                      ? 'bg-app-primary text-white font-semibold'
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
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors mb-[10px] ${selectedMenu?._id === menu._id
                      ? 'bg-app-primary text-white font-semibold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {menu.menuName}
                </button>
              ))
            ) : (
              <span className="text-red-500">No menu categories found</span>
            )}
          </div>
        </div>
      )}

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
            <h3 className="font-semibold text-[18px] text-[#000] mb-3">
              {searchTerm ? 'Search Results' : selectedMenu ? `Items in ${selectedMenu.menuName}` : 'All Items'}
            </h3>

            {filteredItems && filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map(item => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    isSelected={selectedItems.some(selectedItem => selectedItem._id === item._id)}
                    onSelect={handleItemSelect}
                    onAddToCart={handleAddToCart}
                    spicyPreferences={spicyPreferences[item._id] || []}
                    onSpicyChange={handleSpicyChange}
                    addOns={addOnsData}
                    onAddOnToggle={handleAddOnToggle}
                    onAddOnToggleChange={handleAddOnToggleChange}
                    specialInstructions={specialInstructions[item._id] || ''}
                    onInstructionsChange={handleInstructionsChange}
                    onClose={handleCloseModal}
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
  )
};

export default RestaurantsList;
