import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const SearchBar = ({ onCustomerSearch, placeholder = "Enter customer phone number", buttonText = "Search", validateInput, searchType = "customer", value, onChange }) => {
  const [searchInput, setSearchInput] = useState('');
  const { toast } = useToast();

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
        onCustomerSearch(newValue);
      }, 300);
      
      return () => clearTimeout(handler);
    }
  };

  const handleSearch = (e) => {
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
      
      // Normally this would be an API call
      const mockCustomerData = {
        id: Math.floor(Math.random() * 1000),
        name: searchInput === "9876543210" ? "John Doe" : "",
        phone: searchInput,
        address: searchInput === "9876543210" ? "123 Main St, Anytown" : "",
        previousOrders: searchInput === "9876543210" ? [
          { id: 1, items: ["Cheese Burger", "Fries"], total: 250 },
          { id: 2, items: ["Pepperoni Pizza", "Coke"], total: 350 }
        ] : []
      };
      
      onCustomerSearch(mockCustomerData);
      toast({
        title: mockCustomerData.name ? "Customer Found!" : "New Customer",
        description: mockCustomerData.name ? `Welcome back, ${mockCustomerData.name}` : "Please enter customer details",
      });
    } else {
      // For menu searches, just pass the input value
      onCustomerSearch(searchInput);
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
            className="flex-grow w-full pl-10 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-app-primary shadow-sm"
            value={searchInput}
            onChange={handleInputChange}
          />
        </div>
        <Button 
          type="submit" 
          variant="default"
          className="shadow-sm"
        >
          {buttonText}
        </Button>
      </form>
    </div>
  );
};

export default SearchBar;
