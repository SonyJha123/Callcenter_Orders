import React, { useState, useEffect } from 'react';
import { useToast } from "../hooks/use-toast";
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ShoppingCart, Tag, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { useCreateOrderMutation } from '../redux/services/restaurantApi';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

const validationSchema = Yup.object().shape({
  customer_name: Yup.string()
    .trim()
    .required('Customer name is required'),
  customer_phone: Yup.string()
    .trim()
    .required('Phone number is required')
    .matches(/^\d{10}$/, 'Please enter a valid 10-digit phone number'),
  customer_email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .nullable(),
  delivery_mode: Yup.string()
    .required('Delivery mode is required'),
  pickup_address: Yup.string()
    .trim()
    .when('delivery_mode', {
      is: (val) => val === 'TAKEAWAY',
      then: () => Yup.string().required('Pickup address is required'),
      otherwise: () => Yup.string().nullable()
    }),
  delivery_address: Yup.string()
    .trim()
    .when('delivery_mode', {
      is: (val) => val === 'HOME_DELIVERY',
      then: () => Yup.string().required('Delivery address is required'),
      otherwise: () => Yup.string().nullable()
    }),
  payment_method: Yup.string()
    .required('Please select a payment method')
});

const Cart = ({ cartItems, onRemoveItem, onUpdateQuantity, customerData, onOrderSuccess }) => {
  const [couponCode, setCouponCode] = useState('CULPA SED IN REPELLE');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [deliveryMode, setDeliveryMode] = useState('TAKEAWAY');
  const [additionalNotes, setAdditionalNotes] = useState('Dolores vero ullamco');
  const [promoDiscount, setPromoDiscount] = useState(94);
  const [additionalCharge, setAdditionalCharge] = useState(57);
  const [remainingBalance, setRemainingBalance] = useState(94);
  const [agentFields, setAgentFields] = useState({
    user_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    pickup_address: '',
    delivery_address: ''
  });
  const [errors, setErrors] = useState({
    cart: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    pickup_address: '',
    delivery_address: '',
    payment_method: '',
    total: ''
  });

  const { toast } = useToast();
  
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  
  const calculateItemTotal = (item) => {
    const basePrice = parseFloat(item.basePrice || item.price);
    const addOnTotal = item.addOns?.reduce((sum, addOn) => sum + parseFloat(addOn.price), 0) || 0;
    return (basePrice + addOnTotal) * item.quantity;
  };
  
  const calculateAddOnsTotal = (addOns) => {
    return addOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0;
  };
  
  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const discount = 0;
  
  const total = Math.round((
    subtotal + 
    tax + 
    deliveryFee - 
    discount - 
    (promoDiscount || 0) + 
    (additionalCharge || 0) - 
    (remainingBalance || 0)
  ) * 100) / 100;

  const handleApplyCoupon = () => {
    toast({
      title: "Coupon Status",
      description: "This coupon code is invalid or expired.",
      variant: "destructive",
    });
  };

  const resetAllFields = () => {
    onRemoveItem(-1);
    setAgentFields({
      user_id: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      pickup_address: '',
      delivery_address: ''
    });
    setAdditionalNotes('');
    setCouponCode('');
    setPromoDiscount(0);
    setAdditionalCharge(0);
    setRemainingBalance(0);
    setPaymentMethod('CASH');
    setDeliveryMode('TAKEAWAY');
  };

  const initialValues = {
    customer_name: customerData?.name || '',
    customer_phone: customerData?.phone || '',
    customer_email: customerData?.email || '',
    pickup_address: customerData?.address || '',
    delivery_address: customerData?.address || '',
    payment_method: paymentMethod,
    delivery_mode: deliveryMode
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const newErrors = {};
      
      if (cartItems.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Please add items to your cart before placing an order.",
          variant: "destructive",
        });
        return;
      }
      
      if (!agentFields.customer_name) {
        newErrors.customer_name = 'Customer name is required';
      }
      
      if (!agentFields.customer_phone) {
        newErrors.customer_phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(agentFields.customer_phone)) {
        newErrors.customer_phone = 'Please enter a valid 10-digit phone number';
      }
      
      if (deliveryMode === 'TAKEAWAY' && !agentFields.pickup_address) {
        newErrors.pickup_address = 'Pickup address is required';
      }
      
      if (deliveryMode === 'HOME_DELIVERY' && !agentFields.delivery_address) {
        newErrors.delivery_address = 'Delivery address is required';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        for (const error of Object.values(newErrors)) {
          toast({
            title: "Validation Error",
            description: error,
            variant: "destructive",
          });
        }
        return;
      }

      const orderData = {
        items: cartItems.map(item => ({
          item_id: item.originalItemId || item._id,
          quantity: item.quantity,
          price: item.price || item.basePrice,
          addOns: item.addOns || [],
          spicyPreference: item.spicyPreference || '',
          specialInstructions: item.specialInstructions || ''
        })),
        subtotal,
        tax,
        delivery_fees: deliveryFee,
        discount,
        promo_discount: promoDiscount || 0,
        remaining_balance: remainingBalance || 0,
        additional_charge: additionalCharge || 0,
        total,
        payment_method: paymentMethod,
        delivery_mode: deliveryMode,
        user_id: agentFields.user_id || '',
        customer_name: agentFields.customer_name,
        customer_phone: agentFields.customer_phone,
        customer_email: agentFields.customer_email || '',
        pickup_address: deliveryMode === 'TAKEAWAY' ? agentFields.pickup_address : '',
        delivery_address: deliveryMode === 'HOME_DELIVERY' ? agentFields.delivery_address : '',
        description: additionalNotes || ''
      };

      console.log('Submitting order:', orderData); // Debug log
      
      const response = await createOrder(orderData).unwrap();
      
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${response.orderId || ''} has been confirmed.`,
      });
      
      resetAllFields();
      
      if (onOrderSuccess) {
        onOrderSuccess();
      }
      
    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        title: "Order Failed",
        description: error?.data?.message || "There was an error placing your order.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const isOrderButtonDisabled = cartItems.length === 0 || isCreatingOrder;

  useEffect(() => {
    if (customerData) {
      setAgentFields(prev => ({
        ...prev,
        user_id: customerData._id || '',
        customer_name: customerData.name || prev.customer_name,
        customer_phone: customerData.phone || prev.customer_phone,
        customer_email: customerData.email || prev.customer_email,
        pickup_address: customerData.address || prev.pickup_address,
        delivery_address: customerData.address || prev.delivery_address
      }));
    }
  }, [customerData]);

  const getItemUniqueKey = (item) => {
    if (item.cartItemId) {
      return item.cartItemId;
    }
    
    const addOnsKey = item.addOns && item.addOns.length > 0 ? 
      JSON.stringify(item.addOns.map(a => a._id).sort()) : 'no-addons';
    
    const spicyKey = item.spicyPreferences ? 
      JSON.stringify(item.spicyPreferences) : 'no-spicy';
      
    const instructions = item.specialInstructions || 'no-instructions';
    
    return `${item._id}-${addOnsKey}-${spicyKey}-${instructions}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Your Order</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {cartItems.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Selected Items</h3>
            {cartItems.map((item) => (
              <Card key={getItemUniqueKey(item)} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || 'https://via.placeholder.com/40'}
                      alt={item.itemName || item.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">{item.itemName || item.name}</p>
                        <p className="text-sm font-medium text-app-primary">₹{(item.basePrice || item.price).toFixed(2)}</p>
                      </div>
                      
                      {item.spicyPreferences?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.spicyPreferences.map((pref, index) => (
                            <span 
                              key={index}
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                pref === 'Not Spicy' ? 'bg-green-100 text-green-700' :
                                pref === 'Normal' ? 'bg-blue-100 text-blue-700' :
                                pref === 'Spicy' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}
                            >
                              {pref}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.addOns && item.addOns.length > 0 ? (
                        <div className="mt-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Tag className="h-3 w-3 text-gray-600" />
                            <p className="text-xs font-medium text-gray-600">Add-ons</p>
                          </div>
                          <div className="bg-gray-50 rounded-md p-2 space-y-1.5">
                            {item.addOns.map((addOn) => (
                              <div key={addOn._id} className="flex justify-between text-xs">
                                <span className="text-gray-700">{addOn.itemName}</span>
                                <span className="text-app-primary font-medium">₹{parseFloat(addOn.price).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="text-xs font-medium text-gray-700 pt-1.5 border-t border-gray-200">
                              <div className="flex justify-between">
                                <span>Add-ons Total:</span>
                                <span className="text-app-primary">₹{item.addOns.reduce((sum, addOn) => sum + parseFloat(addOn.price), 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">No add-ons selected</p>
                        </div>
                      )}

                      {item.specialInstructions && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1 mb-1">
                            <svg className="h-3 w-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <p className="text-xs font-medium text-gray-600">Special Instructions</p>
                          </div>
                          <p className="text-xs text-gray-600 bg-gray-50 rounded-md p-2 italic">
                            {item.specialInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newQty = Math.max(0, item.quantity - 1);
                          if (newQty === 0) {
                            onRemoveItem(item.cartItemId || item._id);
                          } else {
                            onUpdateQuantity(item.cartItemId || item._id, newQty);
                          }
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.cartItemId || item._id, item.quantity + 1)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.cartItemId || item._id)}
                        className="p-1.5 rounded-full hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Base Price (₹{(item.basePrice || item.price).toFixed(2)} × {item.quantity})</span>
                    <span>₹{((item.basePrice || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.addOns?.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Add-ons (₹{item.addOns.reduce((sum, addOn) => sum + parseFloat(addOn.price), 0).toFixed(2)} × {item.quantity})</span>
                      <span>₹{(item.addOns.reduce((sum, addOn) => sum + parseFloat(addOn.price), 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-medium pt-1 border-t">
                    <span className="text-gray-700">Item Total</span>
                    <span className="text-app-primary">₹{calculateItemTotal(item).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Your cart is empty
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Customer Information</h3>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="customer_name" className="text-sm font-medium text-gray-700 mb-1 block">Full Name</Label>
              <Input
                id="customer_name"
                name="customer_name"
                placeholder="Full Name"
                value={agentFields.customer_name}
                onChange={(e) => {
                  setAgentFields({ ...agentFields, customer_name: e.target.value });
                  if (e.target.value) {
                    setErrors(prev => ({ ...prev, customer_name: '' }));
                  }
                }}
                className={errors.customer_name ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
            </div>
            
            <div>
              <Label htmlFor="customer_phone" className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</Label>
              <Input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                placeholder="Phone Number"
                value={agentFields.customer_phone}
                onChange={(e) => {
                  setAgentFields({ ...agentFields, customer_phone: e.target.value });
                  if (e.target.value && /^\d{10}$/.test(e.target.value)) {
                    setErrors(prev => ({ ...prev, customer_phone: '' }));
                  }
                }}
                className={errors.customer_phone ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.customer_phone && <p className="text-red-500 text-xs mt-1">{errors.customer_phone}</p>}
            </div>
            
            <div>
              <Label htmlFor="customer_email" className="text-sm font-medium text-gray-700 mb-1 block">Email Address (Optional)</Label>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                placeholder="Email Address"
                value={agentFields.customer_email}
                onChange={(e) => setAgentFields({ ...agentFields, customer_email: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Delivery Options</h3>
          <RadioGroup
            name="delivery_mode"
            value={deliveryMode}
            onValueChange={(value) => {
              setDeliveryMode(value);
              setErrors(prev => ({
                ...prev,
                pickup_address: '',
                delivery_address: ''
              }));
            }}
            className="grid gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="TAKEAWAY" id="takeaway" />
              <Label htmlFor="takeaway">Takeaway</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="HOME_DELIVERY" id="delivery" />
              <Label htmlFor="delivery">Home Delivery</Label>
            </div>
          </RadioGroup>

          {deliveryMode === 'TAKEAWAY' && (
            <div className="mt-3">
              <Label htmlFor="pickup_address" className="text-sm font-medium text-gray-700 mb-1 block">Pickup Address</Label>
              <Textarea
                id="pickup_address"
                name="pickup_address"
                placeholder="Enter pickup address"
                value={agentFields.pickup_address}
                onChange={(e) => {
                  setAgentFields({ ...agentFields, pickup_address: e.target.value });
                  if (e.target.value) {
                    setErrors(prev => ({ ...prev, pickup_address: '' }));
                  }
                }}
                className={`h-20 ${errors.pickup_address ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.pickup_address && <p className="text-red-500 text-xs mt-1">{errors.pickup_address}</p>}
            </div>
          )}

          {deliveryMode === 'HOME_DELIVERY' && (
            <div className="mt-3">
              <Label htmlFor="delivery_address" className="text-sm font-medium text-gray-700 mb-1 block">Delivery Address</Label>
              <Textarea
                id="delivery_address"
                name="delivery_address"
                placeholder="Enter delivery address"
                value={agentFields.delivery_address}
                onChange={(e) => {
                  setAgentFields({ ...agentFields, delivery_address: e.target.value });
                  if (e.target.value) {
                    setErrors(prev => ({ ...prev, delivery_address: '' }));
                  }
                }}
                className={`h-20 ${errors.delivery_address ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.delivery_address && <p className="text-red-500 text-xs mt-1">{errors.delivery_address}</p>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Payment Method</h3>
          <RadioGroup
            name="payment_method"
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value)}
            className="grid gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CASH" id="cash" />
              <Label htmlFor="cash">Cash</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CARD" id="card" />
              <Label htmlFor="card">Card</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="UPI" id="upi" />
              <Label htmlFor="upi">UPI</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Special Instructions</h3>
          <Textarea
            name="description"
            placeholder="Any special instructions or notes..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="h-20"
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            {promoDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo Discount</span>
                <span>-₹{promoDiscount.toFixed(2)}</span>
              </div>
            )}
            {additionalCharge > 0 && (
              <div className="flex justify-between">
                <span>Additional Charges</span>
                <span>₹{additionalCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-base pt-2 border-t">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          className="w-full"
          disabled={isOrderButtonDisabled}
          onClick={() => handleSubmit({}, { setSubmitting: () => {} })}
        >
          {isCreatingOrder ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Place Order
        </Button>
      </div>
    </div>
  );
};

export default Cart;
