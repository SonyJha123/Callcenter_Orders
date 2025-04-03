import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { MapPin, Clock, ShoppingBag, AlertCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
});

const CustomerForm = ({ customerData, onCustomerInfoUpdate, onCustomerDataChange }) => {
  const [geoLocationStatus, setGeoLocationStatus] = useState(null);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [suggestedCities, setSuggestedCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const initialValues = {
    name: customerData?.name || '',
    phone: customerData?.phone || '',
    address: customerData?.address || '',
    email: customerData?.email || '',
  };

  useEffect(() => {
    // Determine if this is an existing customer with history
    if (customerData?.name && customerData?.previousOrders?.length > 0) {
      setIsExistingCustomer(true);
    } else {
      setIsExistingCustomer(false);
    }
  }, [customerData]);

  // Effect for address search/suggestions using API
  useEffect(() => {
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
  }, [searchTerm]);

  const handleSubmit = (values, { setSubmitting }) => {
    onCustomerInfoUpdate?.(values);
    onCustomerDataChange?.(values);
    setSubmitting(false);
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

  // Add a callback for passing to the parent component
  const handleReorder = (order) => {
    // This would be implemented in a real app to add the items back to cart
    console.log("Reordering items from order:", order);
    
    // Create a mock notification for demonstration
    alert(`Reordering items from Order #${order.id}: ${order.items.join(", ")}`);
    
    // In a real implementation, you would dispatch an action or call a callback
    // to add these items to the cart
  };

  // Toggle expanded state for a specific order
  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
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
      </div>
      
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
              <Field
                type="tel"
                name="phone"
                placeholder="Phone number"
                className="w-full px-3 py-2 border rounded-md"
                onChange={(e) => {
                  handleChange(e);
                  onCustomerInfoUpdate?.({ ...values, [e.target.name]: e.target.value });
                  onCustomerDataChange?.({ ...values, [e.target.name]: e.target.value });
                }}
              />
              {errors.phone && touched.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="md:col-span-2 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Address *</label>
                <button
                  type="button"
                  onClick={() => getGeolocation(setFieldValue)}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <MapPin size={14} />
                  Use my location
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  name="address"
                  placeholder="Start typing city name..."
                  className="w-full pl-10 px-3 py-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleChange({
                      target: {
                        name: 'address',
                        value: e.target.value
                      }
                    });
                  }}
                />
              </div>
              
              {/* City suggestions dropdown */}
              {suggestedCities.length > 0 && (
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
              
              {isSearching && (
                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <span className="animate-spin">↻</span> Searching cities...
                </div>
              )}
              
              {geoLocationStatus === 'loading' && (
                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <span className="animate-spin">↻</span> Finding your city...
                </div>
              )}
              {geoLocationStatus === 'error' && (
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
                <div key={index} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleOrderExpand(order.id)}
                    className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-app-primary" />
                      <span className="text-xs font-medium">Order #{order.id}</span>
                      <span className="text-xs text-gray-500">
                        {order.date ? formatDistanceToNow(new Date(order.date), { addSuffix: true }) : 'Previous order'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-app-primary">₹{order.total}</span>
                      {expandedOrderId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  
                  {expandedOrderId === order.id && (
                    <div className="px-3 pb-3">
                      <div className="bg-white p-2 rounded border text-xs mb-2">
                        <p className="font-medium mb-1">Items:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {order.items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
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
