import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

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
  const initialValues = {
    name: customerData?.name || '',
    phone: customerData?.phone || '',
    address: customerData?.address || '',
    email: customerData?.email || '',
  };

  const handleSubmit = (values, { setSubmitting }) => {
    onCustomerInfoUpdate?.(values);
    onCustomerDataChange?.(values);
    setSubmitting(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, handleChange }) => (
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
                <p className="text-gray-600 text-sm mt-1">{errors.name}</p>
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
                <p className="text-gray-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address *</label>
              <Field
                as="textarea"
                name="address"
                placeholder="Delivery address"
                className="w-full px-3 py-2 border rounded-md"
                rows="2"
                onChange={(e) => {
                  handleChange(e);
                  onCustomerInfoUpdate?.({ ...values, [e.target.name]: e.target.value });
                  onCustomerDataChange?.({ ...values, [e.target.name]: e.target.value });
                }}
              />
              {errors.address && touched.address && (
                <p className="text-gray-600 text-sm mt-1">{errors.address}</p>
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
                <p className="text-gray-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </Form>
        )}
      </Formik>

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
