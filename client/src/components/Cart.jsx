import React, { useState, useEffect } from 'react';
import { useToast } from "../hooks/use-toast";
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ShoppingCart, Tag, Trash2, Plus, Minus, Loader2, AlertCircle } from "lucide-react";
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

const Cart = ({ cartItems, onRemoveItem, onUpdateQuantity, onUpdateAddonQuantity, customerData, onOrderSuccess }) => {
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [deliveryMode, setDeliveryMode] = useState('TAKEAWAY');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [additionalCharge, setAdditionalCharge] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
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
    
    const basePrice = parseFloat(item.basePrice || item.price || 0);
    
    const addOnTotal = Array.isArray(item.addOns) 
      ? item.addOns.reduce((sum, addOn) => {
          const addOnPrice = parseFloat(addOn.price || 0);
          const addOnQuantity = addOn.quantity || 1;
          return sum + (addOnPrice * addOnQuantity);
        }, 0) 
      : 0;
    
    const itemQuantity = item.quantity || 1;
    
    const total = (basePrice*itemQuantity + addOnTotal);
    
    return total;
  };
  
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };
  
  const subtotal = calculateSubtotal();
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
    if (!couponCode.trim()) {
      toast({
        title: "No Coupon Code",
        description: "Please enter a coupon code first.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Coupon Status",
      description: "This coupon code is invalid or expired.",
      variant: "destructive",
    });
  };

  const resetAllFields = () => {
    onRemoveItem(-1); // Clear all cart items
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
          price: parseFloat(item.price || item.basePrice || 0),
          addOns: Array.isArray(item.addOns) ? item.addOns.map(addOn => ({
            _id: addOn._id || addOn.id,
            quantity: addOn.quantity || 1,
            price: parseFloat(addOn.price || 0),
            name: addOn.name || addOn.itemName
          })) : [],
          spicyPreference: item.spicyPreferences || [],
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

      
      const response = await createOrder(orderData).unwrap();
      
      toast({
        title: "Order Placed Successfully!",
        description:` Order #${response.orderId || response._id || ''} has been confirmed.`,
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

  const renderAddOns = (item) => {
    if (!item.addOns || item.addOns.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-3 space-y-2 bg-gray-50 p-2 rounded-md">
        <div className="flex items-center gap-1 mb-2">
          <Tag className="h-[15px] w-[15px] text-app-primary" />
          <p className="text-xs font-medium text-[#000]">Add-ons</p>
        </div>
        {item.addOns.map((addOn, index) => (
          <div 
            key={`${item.cartItemId}-addon-${addOn._id || index}`} 
            className="flex flex-col border-b border-gray-200 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{addOn.name || addOn.itemName}</p>
                <p className="text-xs text-gray-500">${parseFloat(addOn.price || 0).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateAddonQuantity(item.cartItemId, addOn._id, Math.max(0, (addOn.quantity || 1) - 1))}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
                  type="button"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{addOn.quantity || 1}</span>
                <button 
                  onClick={() => onUpdateAddonQuantity(item.cartItemId, addOn._id, (addOn.quantity || 1) + 1)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
                  type="button"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex justify-end text-xs text-gray-700 mt-1">
              <span>Total: ${((parseFloat(addOn.price || 0) * (addOn.quantity || 1))).toFixed(2)}</span>
            </div>
          </div>
        ))}
        <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-gray-300">
          <span>Add-ons Total</span>
          <span>${(item.addOns.reduce((sum, addOn) => sum + parseFloat(addOn.price || 0) * (addOn.quantity || 1), 0)).toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const renderSpicyPreferences = (preferences) => {
    if (!preferences || preferences.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {preferences.map((pref, index) => (
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
    );
  };

  const renderSpecialInstructions = (instructions) => {
    if (!instructions) {
      return null;
    }

    return (
      <div className="mt-2">
        <div className="flex items-center gap-1 mb-1">
          <AlertCircle className="h-3 w-3 text-gray-600" />
          <p className="text-xs font-medium text-gray-600">Special Instructions</p>
        </div>
        <p className="text-xs text-gray-600 bg-gray-50 rounded-md p-2 italic">
          {instructions}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-[#ffe3e4a1] bg-[#ffe3e4a1]">
        <h2 className="text-[18px] font-semibold text-[#000]">Your Order</h2>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide p-4 space-y-6">
        {cartItems.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-[#000]">Selected Items</h3>
            {cartItems.map((item) => (
              <Card key={item.cartItemId} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image  || item.item_id.image ||'https://via.placeholder.com/40'}
                      alt={item.itemName ||  item.item_id.itemName || item.name}
                      className="w-10 h-10 rounded-[10px] object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col justify-between items-start">
                        <p className="font-medium text-sm">{item.itemName || item.name ||item.item_id.itemName}</p>
                        <p className="text-sm font-semibold text-app-primary">${(item.basePrice || item.price || 0).toFixed(2)}</p>
                      </div>
                      
                      {renderSpicyPreferences(item.spicyPreferences)}
                      {renderSpecialInstructions(item.specialInstructions)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newQty = Math.max(0, item.quantity - 1);
                          if (newQty === 0) {
                            onRemoveItem(item.cartItemId);
                          } else {
                            onUpdateQuantity(item.cartItemId, newQty);
                          }
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.cartItemId)}
                        className="p-1.5 rounded-full hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {renderAddOns(item)}
                
                <div className="mt-2 pt-2 border-t space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#000]">Base Price (${(item.basePrice || item.price || 0).toFixed(2)} × {item.quantity})</span>
                    <span>${((item.basePrice || item.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium pt-1 border-t">
                    <span className="text-[#000] font-semibold">Item Total</span>
                    <span className="text-app-primary font-semibold">${calculateItemTotal(item).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            Your cart is empty
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-[16px] text-[#000] font-semibold mb-4">Customer Information</h3>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="customer_name" className="text-sm font-semibold mb-2 block">Full Name</Label>
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
                className={errors.customer_name ? 'border-red-500 focus:ring-red-500' : 'rounded-[20px]'}
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
            </div>
            
            <div>
              <Label htmlFor="customer_phone" className="text-sm font-semibold mb-2 block">Phone Number</Label>
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
                className={errors.customer_phone ? 'border-red-500 focus:ring-red-500' : 'rounded-[20px]'}
              />
              {errors.customer_phone && <p className="text-red-500 text-xs mt-1">{errors.customer_phone}</p>}
            </div>
            
            <div>
              <Label htmlFor="customer_email" className="text-sm font-semibold mb-2 block">Email Address (Optional)</Label>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                placeholder="Email Address"
                value={agentFields.customer_email}
                onChange={(e) => setAgentFields({ ...agentFields, customer_email: e.target.value })}
                className="rounded-[20px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold mb-4">Delivery Options</h3>
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
              <Label htmlFor="takeaway" className='cursor-pointer'>Takeaway</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="HOME_DELIVERY" id="delivery" />
              <Label htmlFor="delivery" className='cursor-pointer'>Home Delivery</Label>
            </div>
          </RadioGroup>

          {deliveryMode === 'TAKEAWAY' && (
            <div className="mt-3">
              <Label htmlFor="pickup_address" className="text-sm font-semibold mb-4 block">Pickup Address</Label>
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
                className={`h-20 ${errors.pickup_address ? 'border-red-500 focus:ring-red-500' : 'rounded-[20px]'}`}
              />
              {errors.pickup_address && <p className="text-red-500 text-xs mt-1">{errors.pickup_address}</p>}
            </div>
          )}

          {deliveryMode === 'HOME_DELIVERY' && (
            <div className="mt-3">
              <Label htmlFor="delivery_address" className="text-sm font-semibold mb-4 block">Delivery Address</Label>
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
                className={`h-20 ${errors.delivery_address ? 'border-red-500 focus:ring-red-500' : 'rounded-[20px]'}`}
              />
              {errors.delivery_address && <p className="text-red-500 text-xs mt-1">{errors.delivery_address}</p>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold mb-4">Payment Method</h3>
          <RadioGroup
            name="payment_method"
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value)}
            className="grid gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CASH" id="cash" />
              <Label htmlFor="cash" className='cursor-pointer'>Cash</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CARD" id="card" />
              <Label htmlFor="card" className='cursor-pointer'>Card</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="UPI" id="upi" />
              <Label htmlFor="upi" className='cursor-pointer'>UPI</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold mb-4">Special Instructions</h3>
          <Textarea
            name="description"
            placeholder="Any special instructions or notes..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="h-20 rounded-[20px]"
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            
            {(promoDiscount > 0 || additionalCharge > 0 || remainingBalance > 0) && (
              <div className="p-3 bg-gray-50 rounded-md mt-2">
                <p className="text-sm font-medium text-gray-700 mb-4">Price Adjustments:</p>
                <div className="space-y-2 text-sm">
                  {promoDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Promo Discount</span>
                      <span className="text-green-600">-${promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {additionalCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Additional Charge</span>
                      <span>+${additionalCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {remainingBalance > 0 && (
                    <div className="flex justify-between">
                      <span>Remaining Balance</span>
                      <span className="text-green-600">-${remainingBalance.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Net Adjustment</span>
                    <span className={((promoDiscount + remainingBalance) > additionalCharge) ? "text-green-600" : ""}>
                      {((promoDiscount + remainingBalance) > additionalCharge) ? "-" : "+"}
                      ${Math.abs(additionalCharge - promoDiscount - remainingBalance).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between font-medium text-base pt-2 border-t">
              <span className='font-semibold'>Total</span>
              <span className='text-app-primary font-semibold'>${total.toFixed(2)}</span>
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
