import React, { useState, useEffect } from 'react';

const CustomerForm = ({ customerData, onCustomerInfoUpdate, onCustomerDataChange }) => {
  const [customer, setCustomer] = useState({
    name: customerData?.name || '',
    phone: customerData?.phone || '',
    address: customerData?.address || '',
    email: customerData?.email || '',
  });

  useEffect(() => {
    if (customerData) {
      const updatedCustomer = {
        name: customerData.name || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
        email: customerData.email || '',
      };
      setCustomer(updatedCustomer);
      // Send data to Cart component
      onCustomerDataChange?.(updatedCustomer);
    }
  }, [customerData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedCustomer = { ...customer, [name]: value };
    setCustomer(updatedCustomer);
    onCustomerInfoUpdate(updatedCustomer);
    // Send data to Cart component
    onCustomerDataChange?.(updatedCustomer);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Customer name"
            className="w-full px-3 py-2 border rounded-md"
            value={customer.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            placeholder="Phone number"
            className="w-full px-3 py-2 border rounded-md"
            value={customer.phone}
            onChange={handleChange}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            name="address"
            placeholder="Delivery address"
            className="w-full px-3 py-2 border rounded-md"
            value={customer.address}
            onChange={handleChange}
            rows="2"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email (Optional)</label>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            className="w-full px-3 py-2 border rounded-md"
            value={customer.email}
            onChange={handleChange}
          />
        </div>
      </div>

      {customerData?.previousOrders && customerData.previousOrders.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Previous Orders</h3>
          <div className="space-y-2">
            {customerData.previousOrders.map((order, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div>
                  <span className="text-sm">Order #{order.id}: </span>
                  <span className="text-sm text-gray-600">{order.items.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">₹{order.total}</span>
                  <button 
                    className="text-xs px-2 py-1 bg-app-secondary text-white rounded-md hover:bg-opacity-90"
                    onClick={() => console.log("Reorder", order)}
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerForm;
