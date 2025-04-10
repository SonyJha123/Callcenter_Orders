
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useLazyGetUserByPhoneQuery } from '../redux/services/userApi';
import { useLazySearchItemsQuery } from '../redux/services/restaurantApi';

const SearchBar = ({ onCustomerSearch, placeholder = "Enter customer phone number", buttonText = "Search", validateInput, searchType = "customer", value, onChange }) => {
  const [searchInput, setSearchInput] = useState('');
  const { toast } = useToast();
  
  // RTK Query hooks
  const [getUserByPhone, { isLoading: isLoadingUser }] = useLazyGetUserByPhoneQuery();
  const [searchMenuItems, { isLoading: isSearchingMenu }] = useLazySearchItemsQuery();
  
  const isLoading = isLoadingUser || isSearchingMenu;

  // Synchronize with external value if provided
  useEffect(() => {
    if (value !== undefined) {
      setSearchInput(value);
    }
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
    
    // If onChange prop is provided, call it
    if (onChange) {
      onChange(e);
    }
    
    // If menu search and no onChange handler, do immediate search on type
    if (searchType === "menu" && !onChange && newValue.length > 2) {
      // Debounce search for better performance
      const handler = setTimeout(() => {
        performMenuSearch(newValue);
      }, 300);
      
      return () => clearTimeout(handler);
    }
  };

  const performMenuSearch = async (term) => {
    if (term.length < 2) return;
    
    try {
      const results = await searchMenuItems(term).unwrap();
      if (results && results.data && Array.isArray(results.data)) {
        onCustomerSearch(results.data);
      } else if (Array.isArray(results)) {
        onCustomerSearch(results);
      } else {
        onCustomerSearch([]);
      }
    } catch (error) {
      console.error("Error performing menu search:", error);
      toast({
        title: "Search Error",
        description: "Unable to search menu items at this time",
        variant: "destructive",
      });
      onCustomerSearch([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (searchType === "customer") {
      if (!searchInput || searchInput.length < 10) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number",
          variant: "destructive",
        });
        return;
      }
      
      try {
        // Use RTK Query to search for customer by phone number
        const result = await getUserByPhone(searchInput).unwrap();
        
        if (result && result.status === 200 && result.user) {
          // Customer found
          const user = result.user;
          const userData = {
            _id: user._id,
            name: user.name,
            phone: user.phone.toString(),
            address: user.location?.address || '',
            email: user.email || '',
            // Format location data
            city: user.location?.city || '',
            state: user.location?.state || '',
            country: user.location?.country || '',
            zipCode: user.location?.zipCode || '',
            // Order history
            previousOrders: result.orders || [],
            // Flag as existing customer
            isExistingCustomer: true
          };
          
          onCustomerSearch(userData);
          
          toast({
            title: "Customer Found!",
            description: `Welcome back, ${userData.name}. ${userData.previousOrders.length} previous order(s) found.`,
          });
        } else {
          // No customer found, create new customer object with just the phone
          const newCustomer = {
            phone: searchInput,
            name: '',
            address: '',
            email: '',
            previousOrders: [],
            isExistingCustomer: false
          };
          
          onCustomerSearch(newCustomer);
          
          toast({
            title: "New Customer",
            description: "Please enter customer details",
          });
        }
      } catch (err) {
        console.error('Error searching for customer:', err);
        
        // Still create a new customer object - error shouldn't block workflow
        const newCustomer = {
          phone: searchInput,
          name: '',
          address: '',
          email: '',
          previousOrders: [],
          isExistingCustomer: false
        };
        
        onCustomerSearch(newCustomer);
        
        // More user-friendly message when API error occurs
        toast({
          title: "New Customer",
          description: "Creating new customer entry",
        });
      }
    } else {
      // For menu searches, call the search function
      await performMenuSearch(searchInput);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSearch} className="flex gap-2 relative">
        <div className="relative flex-grow">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          <input
            type={searchType === "customer" ? "tel" : "text"}
            placeholder={placeholder}
            className="flex-grow w-full pl-10 px-4 py-2 border rounded-[20px] focus:outline-none focus:ring-1 focus:ring-app-primary shadow-sm"
            value={searchInput}
            onChange={handleInputChange}
          />
        </div>
        <Button 
          type="submit" 
          variant="default"
          className="shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {buttonText}
        </Button>
      </form>
    </div>
  );
};

export default SearchBar;
