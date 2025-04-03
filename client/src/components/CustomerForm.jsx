import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { MapPin, Clock, ShoppingBag, AlertCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Mock data for Indian cities and states
const INDIA_CITIES = [
  { name: "Mohali", state: "Punjab", lat: 30.7305, lng: 76.6942 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Chandigarh", state: "Punjab", lat: 30.7333, lng: 76.7794 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { name: "Mysore", state: "Karnataka", lat: 12.2958, lng: 76.6394 },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 }
];

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

  // Effect for address search/suggestions
  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      // Filter cities based on search term
      const filteredCities = INDIA_CITIES.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestedCities(filteredCities.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestedCities([]);
    }
  }, [searchTerm]);

  const handleSubmit = (values, { setSubmitting }) => {
    onCustomerInfoUpdate?.(values);
    onCustomerDataChange?.(values);
    setSubmitting(false);
  };
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
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
          
          // Find nearest city in our database
          let nearestCity = INDIA_CITIES[0];
          let minDistance = calculateDistance(latitude, longitude, INDIA_CITIES[0].lat, INDIA_CITIES[0].lng);
          
          INDIA_CITIES.forEach(city => {
            const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
            if (distance < minDistance) {
              minDistance = distance;
              nearestCity = city;
            }
          });
          
          // Format address with city and state
          const cityAddress = `${nearestCity.name}, ${nearestCity.state}, India`;
          
          if (setFieldValue) {
            setFieldValue('address', cityAddress);
          }
          
          onCustomerInfoUpdate?.({ ...initialValues, address: cityAddress });
          onCustomerDataChange?.({ ...initialValues, address: cityAddress });
          
          console.log('Found nearest city:', nearestCity.name);
          setGeoLocationStatus('success');
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
