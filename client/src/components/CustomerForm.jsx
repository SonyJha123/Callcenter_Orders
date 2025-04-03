import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { MapPin, Clock, ShoppingBag, AlertCircle, ChevronDown, ChevronUp, Search, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLazyGetUserByPhoneQuery, useCreateUserMutation } from '../redux/services/userApi';
import { useLazyGetMenuItemQuery } from '../redux/services/restaurantApi';
import { useToast } from "../hooks/use-toast";

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Customer name is required'),
  phone: Yup.string()
    .required('Phone number is required')
    .matches(/^\d{10}$/, 'Please enter a valid 10-digit phone number'),
  address: Yup.string()
    .required('Address is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .nullable()
    .transform((value, originalValue) => {
      // Convert empty strings to undefined (not null)
      return originalValue.trim() === '' ? undefined : value;
    })
});

const CustomerForm = ({ customerData, onCustomerInfoUpdate, onCustomerDataChange, onAddToCart }) => {
  const [geoLocationStatus, setGeoLocationStatus] = useState(null);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [suggestedCities, setSuggestedCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [customerFound, setCustomerFound] = useState(false);
  
  // RTK Query hooks
  const [getUserByPhone, { isLoading: isLoadingUser, error: userError }] = useLazyGetUserByPhoneQuery();
  const [createUser, { isLoading: isCreatingUser, error: createError }] = useCreateUserMutation();
  const [getMenuItem] = useLazyGetMenuItemQuery();
  
  // Get toast hook
  const { toast } = useToast();
  
  const initialValues = {
    name: customerData?.name || '',
    phone: customerData?.phone || '',
    address: customerData?.address || '',
    email: customerData?.email || '',
  };

  // Update states when new customer data is received
  useEffect(() => {
    if (customerData) {
      console.log('Received customer data:', customerData);
      
      // If customer data has an isExistingCustomer flag, use it
      if (customerData.isExistingCustomer !== undefined) {
        setIsExistingCustomer(customerData.isExistingCustomer);
        setCustomerFound(customerData.isExistingCustomer);
      } else if (customerData?.name && customerData?.previousOrders?.length > 0) {
        // Otherwise use the name and orders to determine if existing
        setIsExistingCustomer(true);
        setCustomerFound(true);
      } else if (customerData?._id) {
        // If they have an ID but no orders, they're still an existing customer
      setIsExistingCustomer(true);
        setCustomerFound(true);
      }
      
      // Set search term for address if an address exists
      if (customerData.address) {
        setSearchTerm(customerData.address.split(',')[0] || '');
      }
    }
  }, [customerData]);

  // Update the useEffect for address search to skip for existing customers
  useEffect(() => {
    // Skip address search if this is an existing customer
    if (isExistingCustomer) {
      return;
    }
    
    const searchCities = async () => {
      if (searchTerm && searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          // Using OpenStreetMap Nominatim API for geocoding (free, no API key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=in&limit=8&addressdetails=1`,
            { headers: { 'Accept-Language': 'en-US,en' } }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            // Extract unique cities from results
            const cities = data.reduce((acc, location) => {
              const address = location.address;
              const cityName = address.city || address.town || address.village || address.hamlet || address.municipality;
              const stateName = address.state;
              
              if (cityName && stateName && !acc.some(city => city.name === cityName)) {
                acc.push({
                  name: cityName,
                  state: stateName,
                  displayName: location.display_name
                });
              }
              return acc;
            }, []);
            
            setSuggestedCities(cities);
          }
        } catch (error) {
          console.error('Error searching for cities:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestedCities([]);
      }
    };
    
    // Debounce search to avoid making too many requests
    const timer = setTimeout(() => {
      searchCities();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, isExistingCustomer]); // Added isExistingCustomer to dependency array

  // Handle API errors
  useEffect(() => {
    if (userError) {
      setApiError('Failed to check for existing customer');
      console.error('User lookup error:', userError);
    } else if (createError) {
      setApiError('Failed to save customer data');
      console.error('Create user error:', createError);
    } else {
      setApiError(null);
    }
  }, [userError, createError]);

  // Check if customer exists by phone number
  const checkExistingCustomer = async (phone) => {
    if (!phone || phone.length !== 10) return;
    
    setApiError(null);
    setCustomerFound(false);
    
    try {
      console.log('Checking customer with phone:', phone);
      const response = await getUserByPhone(phone).unwrap();
      console.log('API response:', response);
      
      if (response && response.status === 200 && response.user) {
        const user = response.user;
        // Format the orders data from API response
        const formattedOrders = Array.isArray(response.orders) ? response.orders.map(order => ({
          id: order._id,
          items: order.items.map(item => {
            // Make sure items are always strings
            if (typeof item === 'object') {
              // Make item_id more user-friendly by showing it in a shorter format
              const itemId = item.item_id;
              const shortId = itemId && itemId.length > 6 ? itemId.substring(itemId.length - 6) : itemId;
              return `${item.quantity || '1'}x ${item.item_name || (shortId ? `Item #${shortId}` : 'Unknown Item')}`;
            }
            return String(item);
          }),
          total: order.total,
          date: order.createdAt,
          status: order.status,
          paymentMethod: order.payment_method,
          deliveryMode: order.delivery_mode,
          rawData: order // Keep the original data
        })) : [];

        console.log('Formatted orders:', formattedOrders);
        
        // User exists, update form with user data
        const userData = {
          _id: user._id,
          name: user.name,
          phone: user.phone.toString(),
          address: user.location?.address || '',
          email: user.email || '',
          city: user.location?.city || '',
          state: user.location?.state || '',
          country: user.location?.country || '',
          zipCode: user.location?.zipCode || '',
          previousOrders: formattedOrders
        };
        
        // Update customer data in parent component
        onCustomerDataChange?.(userData);
        
        // Set existing customer flag
        setIsExistingCustomer(true);
        setCustomerFound(true);
        
        console.log('Customer found:', userData);
      } else {
        console.log('No customer found with phone:', phone);
        setIsExistingCustomer(false);
      }
    } catch (error) {
      console.error('Error checking existing customer:', error);
      // Error will be handled by the useEffect watching userError
    }
  };

  // Explicit check for customer button
  const handleCheckCustomer = (phone, setFieldValue) => {
    if (phone && phone.length === 10) {
      checkExistingCustomer(phone);
    } else {
      setApiError('Please enter a valid 10-digit phone number');
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setApiError(null);
    
    try {
      if (!isExistingCustomer) {
        // Extract address components
        const addressParts = values.address.split(',').map(part => part.trim());
        const city = addressParts[0] || '';
        const state = addressParts[1] || '';
        const country = addressParts[2] || 'India';
        
        // Format user data for API
        const userData = {
          name: values.name,
          phone: parseInt(values.phone, 10),
          location: {
            address: values.address,
            city: city,
            state: state,
            country: country,
            zipCode: "000000" // Adding default zipCode to prevent validation error
          }
        };
        
        // Only add email if it has a value (prevents null email)
        if (values.email && values.email.trim() !== '') {
          userData.email = values.email.trim();
        }
        
        console.log('Creating new customer:', userData);
        
        // Create new user using RTK mutation
        const response = await createUser(userData).unwrap();
        console.log('Create user response:', response);
        
        if (response && response.status === 200 && response.User) {
          // Update with created user data including ID
          onCustomerDataChange?.({
            ...values,
            _id: response.User._id,
            previousOrders: []
          });
          
          // Set notification for new customer creation
          console.log('New customer created with ID:', response.User._id);
        }
      }
      
      // Update customer info in parent component
    onCustomerInfoUpdate?.(values);
    } catch (error) {
      console.error('Error saving customer data:', error);
      // Display more detailed error message
      if (error.data && error.data.message) {
        setApiError(`Failed to save customer data: ${error.data.message}`);
      } else {
        setApiError('Failed to save customer data. Please try again.');
      }
    } finally {
    setSubmitting(false);
    }
  };
  
  const getGeolocation = (setFieldValue = null) => {
    setGeoLocationStatus('loading');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Get location coordinates
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          console.log('Geolocation coordinates:', latitude, longitude);
          
          // Use reverse geocoding to find city
          findCityFromCoordinates(latitude, longitude, setFieldValue);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setGeoLocationStatus('error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      console.error('Geolocation not supported by this browser');
      setGeoLocationStatus('not-supported');
    }
  };

  // Find city using a reverse geocoding API
  const findCityFromCoordinates = async (latitude, longitude, setFieldValue) => {
    try {
      // This uses a free geocoding API - you may need to replace with a different service
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await response.json();
      
      // Extract city and state from the response
      const cityName = data.address.city || data.address.town || data.address.village || data.address.hamlet;
      const stateName = data.address.state;
      const countryName = data.address.country;
      
      console.log('Reverse geocoding result:', data.address);
      
      // Format the address
      const fullAddress = `${cityName || ''}${cityName && stateName ? ', ' : ''}${stateName || ''}${(cityName || stateName) && countryName ? ', ' : ''}${countryName || ''}`;
      
      if (setFieldValue) {
        setFieldValue('address', fullAddress);
      }
      
      onCustomerInfoUpdate?.({ ...initialValues, address: fullAddress });
      onCustomerDataChange?.({ ...initialValues, address: fullAddress });
      setSearchTerm(cityName || '');
      setGeoLocationStatus('success');
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      setGeoLocationStatus('error');
      
      // As a fallback, show the raw coordinates
      const fallbackAddress = `Near coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      if (setFieldValue) {
        setFieldValue('address', fallbackAddress);
      }
      
      onCustomerInfoUpdate?.({ ...initialValues, address: fallbackAddress });
      onCustomerDataChange?.({ ...initialValues, address: fallbackAddress });
    }
  };

  // Handle city selection from suggestions
  const handleCitySelect = (city, setFieldValue) => {
    const cityAddress = `${city.name}, ${city.state}, India`;
    
    setFieldValue('address', cityAddress);
    onCustomerInfoUpdate?.({ ...initialValues, address: cityAddress });
    onCustomerDataChange?.({ ...initialValues, address: cityAddress });
    setSuggestedCities([]);
    setSearchTerm(city.name);
  };

  // Update the handleReorder function to fetch item details
  const handleReorder = async (order) => {
    console.log("Reordering items from order:", order);
    
    // Debug the exact structure of the order and its items
    if (order.rawData && order.rawData.items) {
      console.log("Raw order items:", JSON.stringify(order.rawData.items));
    }
    if (order.items) {
      console.log("Formatted order items:", JSON.stringify(order.items));
    }
    
    // Get a valid order ID
    const orderId = order._id || order.id || (order.rawData && order.rawData._id) || 'unknown';
    
    // Show loading toast
    toast({
      title: "Processing Reorder",
      description: "Fetching item details..."
    });
    
    try {
      // Items to add to cart
      let itemsToAdd = [];
      let itemsToProcess = [];
      
      // If this is a raw order object
      if (order._id && order.items && Array.isArray(order.items)) {
        itemsToProcess = order.items;
      }
      // If it's a formatted order with rawData
      else if (order.rawData && order.rawData.items && Array.isArray(order.rawData.items)) {
        itemsToProcess = order.rawData.items;
      }
      
      if (itemsToProcess.length > 0 && typeof onAddToCart === 'function') {
        // Process each item - try to fetch current details from API
        for (const item of itemsToProcess) {
          try {
            // Try to get current item details to get image and current price
            const response = await getMenuItem(item.item_id).unwrap();
            console.log("Item details response:", response);
            
            if (response && response.item) {
              const menuItem = response.item;
              itemsToAdd.push({
                _id: item.item_id,
                name: menuItem.name || item.item_name || `Item #${item.item_id.substring(item.item_id.length - 6)}`,
                price: menuItem.price || item.price || 0,
                quantity: item.quantity || 1,
                image: menuItem.image || 'https://via.placeholder.com/40'
              });
            } else {
              // Fallback if item not found
              itemsToAdd.push({
                _id: item.item_id,
                name: item.item_name || `Item #${item.item_id.substring(item.item_id.length - 6)}`,
                price: item.price || 0,
                quantity: item.quantity || 1,
                image: 'https://via.placeholder.com/40'
              });
            }
          } catch (error) {
            console.error("Error fetching menu item:", error);
            // Fallback for error
            itemsToAdd.push({
              _id: item.item_id,
              name: item.item_name || `Item #${item.item_id.substring(item.item_id.length - 6)}`,
              price: item.price || 0,
              quantity: item.quantity || 1,
              image: 'https://via.placeholder.com/40'
            });
          }
        }
        
        // Add each item to the cart
        itemsToAdd.forEach(item => {
          onAddToCart(item);
        });
        
        // Show success toast
        toast({
          title: "Items Added to Cart",
          description: `Added ${itemsToAdd.length} item(s) from Order #${orderId}`
        });
      } else {
        // Fallback message if we can't add to cart
        toast({
          title: "Reorder Failed",
          description: `Cannot add items from Order #${orderId} - missing item data`
        });
      }
    } catch (error) {
      console.error("Error processing reorder:", error);
      toast({
        title: "Reorder Failed",
        description: "An error occurred while processing your reorder request"
      });
    }
  };

  // Toggle expanded state for a specific order
  const toggleOrderExpand = (orderId) => {
    // orderId could be a string ID or a numeric index
    console.log("Toggling order expand for:", orderId);
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Determine if any API operation is loading
  const isLoading = isLoadingUser || isCreatingUser;

  // Render customer info block
  const renderCustomerInfoBlock = () => {
    if (!customerData || !isExistingCustomer) return null;
    
    return (
      <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
        <h3 className="font-medium text-gray-700 mb-2 flex items-center">
          <UserCheck size={16} className="text-app-primary mr-2" />
          Customer Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <p className="text-gray-500">Customer ID</p>
            <p className="font-medium">{customerData._id || 'N/A'}</p>
          </div>
          {customerData.city && (
            <div>
              <p className="text-gray-500">City</p>
              <p className="font-medium">{customerData.city}</p>
            </div>
          )}
          {customerData.state && (
            <div>
              <p className="text-gray-500">State</p>
              <p className="font-medium">{customerData.state}</p>
            </div>
          )}
          {customerData.country && (
            <div>
              <p className="text-gray-500">Country</p>
              <p className="font-medium">{customerData.country}</p>
            </div>
          )}
          {customerData.previousOrders && customerData.previousOrders.length > 0 && (
            <div>
              <p className="text-gray-500">Order History</p>
              <p className="font-medium">{customerData.previousOrders.length} previous orders</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Customer Information</h2>
        {isExistingCustomer && (
          <div className="bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full">
            Existing Customer
          </div>
        )}
        {customerFound && (
          <div className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded-full ml-2 flex items-center">
            <UserCheck size={12} className="mr-1" />
            Customer Found
          </div>
        )}
      </div>
      
      {/* Render customer info summary block */}
      {renderCustomerInfoBlock()}
      
      {apiError && (
        <div className="bg-red-50 text-red-600 p-2 rounded-md mb-4 text-sm flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {apiError}
        </div>
      )}
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, handleChange, setFieldValue }) => (
          <Form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Field
                type="text"
                name="name"
                placeholder="Customer name"
                className="w-full px-3 py-2 border rounded-md"
                onChange={(e) => {
                  handleChange(e);
                  onCustomerInfoUpdate?.({ ...values, [e.target.name]: e.target.value });
                  onCustomerDataChange?.({ ...values, [e.target.name]: e.target.value });
                }}
              />
              {errors.name && touched.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <div className="flex relative">
              <Field
                type="tel"
                name="phone"
                placeholder="Phone number"
                  className="w-full px-3 py-2 border rounded-l-md"
                onChange={(e) => {
                  handleChange(e);
                  onCustomerInfoUpdate?.({ ...values, [e.target.name]: e.target.value });
                  onCustomerDataChange?.({ ...values, [e.target.name]: e.target.value });
                }}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value.length === 10) {
                      checkExistingCustomer(e.target.value);
                    }
                  }}
                />
                <button 
                  type="button"
                  className="bg-app-primary text-white px-3 py-2 rounded-r-md hover:bg-app-primary/90 transition-colors flex items-center"
                  onClick={() => handleCheckCustomer(values.phone, setFieldValue)}
                  disabled={isLoading}
                >
                  <UserCheck size={16} />
                </button>
                {isLoading && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
              {errors.phone && touched.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="md:col-span-2 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Address *</label>
                {!isExistingCustomer && ( // Only show geolocation button for new customers
                <button
                  type="button"
                  onClick={() => getGeolocation(setFieldValue)}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <MapPin size={14} />
                  Use my location
                </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  name="address"
                  placeholder={isExistingCustomer ? "Address from customer profile" : "Start typing city name..."}
                  className={`w-full pl-10 px-3 py-2 border rounded-md ${isExistingCustomer ? 'bg-gray-50' : ''}`}
                  value={searchTerm}
                  onChange={(e) => {
                    // Only allow address modification for new customers
                    if (!isExistingCustomer) {
                    setSearchTerm(e.target.value);
                    handleChange({
                      target: {
                        name: 'address',
                        value: e.target.value
                      }
                    });
                    }
                  }}
                  disabled={isExistingCustomer} // Disable input field for existing customers
                />
              </div>
              
              {/* City suggestions dropdown - only show for new customers */}
              {!isExistingCustomer && suggestedCities.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
                  <ul className="max-h-60 overflow-auto py-1">
                    {suggestedCities.map((city, index) => (
                      <li 
                        key={index}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        onClick={() => handleCitySelect(city, setFieldValue)}
                      >
                        <MapPin size={14} className="mr-2 text-gray-500" />
                        <span>{city.name}, {city.state}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {!isExistingCustomer && isSearching && (
                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <span className="animate-spin">↻</span> Searching cities...
                </div>
              )}
              
              {!isExistingCustomer && geoLocationStatus === 'loading' && (
                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <span className="animate-spin">↻</span> Finding your city...
                </div>
              )}
              {!isExistingCustomer && geoLocationStatus === 'error' && (
                <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Unable to get your location. Please enter city manually.
                </div>
              )}
              {errors.address && touched.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Field
                type="email"
                name="email"
                placeholder="Email address (Optional)"
                className="w-full px-3 py-2 border rounded-md"
                onChange={(e) => {
                  handleChange(e);
                  onCustomerInfoUpdate?.({ ...values, [e.target.name]: e.target.value });
                  onCustomerDataChange?.({ ...values, [e.target.name]: e.target.value });
                }}
              />
              {errors.email && touched.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-app-primary text-white rounded-md hover:bg-app-primary/90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : isExistingCustomer ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {isExistingCustomer && customerData?.previousOrders && customerData.previousOrders.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <button 
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center justify-between w-full bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-600" />
              <h3 className="text-sm font-semibold">Order History</h3>
              <span className="bg-app-primary text-white text-xs px-2 py-0.5 rounded-full">
                {customerData.previousOrders.length}
              </span>
            </div>
            {isHistoryExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {isHistoryExpanded && (
            <div className="mt-3 space-y-3">
              {customerData.previousOrders.map((order, index) => (
                <div key={order.id || index} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleOrderExpand(order.id || index)}
                    className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-app-primary" />
                      <span className="text-xs font-medium">Order #{order.id || (order.rawData && order.rawData._id) || index}</span>
                      <span className="text-xs text-gray-500">
                        {order.date ? formatDistanceToNow(new Date(order.date), { addSuffix: true }) : 'Previous order'}
                      </span>
                      {order.status && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          order.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-app-primary">₹{Math.abs(order.total || 0).toFixed(2)}</span>
                      {expandedOrderId === (order.id || index) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  
                  {expandedOrderId === (order.id || index) && (
                    <div className="px-3 pb-3">
                      <div className="bg-white p-2 rounded border text-xs mb-2">
                        <p className="font-medium mb-1">Items:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {Array.isArray(order.items) && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                              <li key={idx}>
                                {typeof item === 'object' 
                                  ? `${item.quantity || '1'}x ${item.item_name || (item.item_id ? `Item #${item.item_id.substring(item.item_id.length - 6)}` : 'Unknown Item')}`
                                  : String(item)}
                              </li>
                            ))
                          ) : (
                            <li>No item details available</li>
                          )}
                        </ul>
                        
                        {/* Additional order details */}
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-gray-500">Payment Method</p>
                              <p className="font-medium">{order.paymentMethod || 'Cash'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Delivery Mode</p>
                              <p className="font-medium">{order.deliveryMode === 'HOME_DELIVERY' ? 'Home Delivery' : 'Takeaway'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button 
                          type="button"
                          className="text-xs px-3 py-1 bg-app-primary text-white rounded-md hover:bg-app-primary/90 transition-colors"
                          onClick={() => handleReorder(order)}
                        >
                          Reorder Items
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerForm;
