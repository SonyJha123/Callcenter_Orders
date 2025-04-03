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
      
      // Mock customer data with order history for existing customers
      const mockCustomerData = {
        id: Math.floor(Math.random() * 1000),
        name: searchInput === "9876543210" ? "John Doe" : "",
        phone: searchInput,
        address: searchInput === "9876543210" ? "123 Main St, Anytown" : "",
        previousOrders: searchInput === "9876543210" ? [
          { 
            id: 1001, 
            items: ["Cheese Burger", "Fries", "Coke"], 
            total: 250,
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
          },
          { 
            id: 1002, 
            items: ["Pepperoni Pizza", "Garlic Bread", "Sprite"], 
            total: 350,
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
          },
          { 
            id: 1003, 
            items: ["Chicken Wings", "Onion Rings", "Iced Tea"], 
            total: 280,
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
          }
        ] : []
      };
      
      onCustomerSearch(mockCustomerData);
      toast({
        title: mockCustomerData.name ? "Customer Found!" : "New Customer",
        description: mockCustomerData.name 
          ? `Welcome back, ${mockCustomerData.name}. ${mockCustomerData.previousOrders.length} previous orders found.`
          : "Please enter customer details",
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
