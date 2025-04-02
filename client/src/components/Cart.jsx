import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ShoppingCart, Tag, Trash2, Plus, Minus } from "lucide-react";
import { useCreateOrderMutation } from '../redux/services/restaurantApi';

const Cart = ({ cartItems, onRemoveItem, onUpdateQuantity, customerData, onOrderSuccess }) => {
  const [couponCode, setCouponCode] = useState('CULPA SED IN REPELLE');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [deliveryMode, setDeliveryMode] = useState('TAKEAWAY');
  const [additionalNotes, setAdditionalNotes] = useState('Dolores vero ullamco');
  const [promoDiscount, setPromoDiscount] = useState(94);
  const [additionalCharge, setAdditionalCharge] = useState(57);
  const [remainingBalance, setRemainingBalance] = useState(94);
  const [agentFields, setAgentFields] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    pickup_address: '',
    delivery_address: ''
  });

  const { toast } = useToast();
  
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  
  const calculateItemTotal = (item) => {
    const addOnTotal = item.addOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0;
    return (item.price + addOnTotal) * item.quantity;
  };
  
  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const discount = 0;
  const total = subtotal + tax + deliveryFee - discount - promoDiscount + additionalCharge;

  const handleApplyCoupon = () => {
    toast({
      title: "Coupon Status",
      description: "This coupon code is invalid or expired.",
      variant: "destructive",
    });
  };

  const resetAllFields = () => {
    // Clear cart items
    onRemoveItem(-1);
    
    // Reset all form fields
    setAgentFields({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      pickup_address: '',
      delivery_address: ''
    });
    
    // Reset all other fields
    setAdditionalNotes('');
    setCouponCode('');
    setPromoDiscount(0);
    setAdditionalCharge(0);
    setRemainingBalance(0);
    setPaymentMethod('CASH');
    setDeliveryMode('TAKEAWAY');
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        items: cartItems.map(item => ({
          item_id: item._id,
          quantity: item.quantity,
          price: item.price,
          addOns: item.addOns,
          spicyPreference: item.spicyPreference,
          specialInstructions: item.specialInstructions
        })),
        subtotal,
        tax,
        delivery_fees: deliveryFee,
        discount,
        promo_discount: promoDiscount,
        remaining_balance: remainingBalance,
        additional_charge: additionalCharge,
        total,
        payment_method: paymentMethod,
        delivery_mode: deliveryMode,
        customer_name: agentFields.customer_name,
        customer_phone: agentFields.customer_phone,
        customer_email: agentFields.customer_email,
        pickup_address: deliveryMode === 'TAKEAWAY' ? agentFields.pickup_address : '',
        delivery_address: deliveryMode === 'HOME_DELIVERY' ? agentFields.delivery_address : '',
        description: additionalNotes
      };
      
      const response = await createOrder(orderData).unwrap();
      
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${response.orderId || ''} has been confirmed.`,
      });
      
      // Reset all fields
      resetAllFields();
      
      // Call parent handler to clear customer data
      onOrderSuccess?.();
      
    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        title: "Order Failed",
        description: error?.data?.message || "There was an error placing your order.",
        variant: "destructive",
      });
    }
  };
  
  const isOrderButtonDisabled = cartItems.length === 0 || isCreatingOrder;

  // Update agentFields when customerData changes
  useEffect(() => {
    if (customerData) {
      setAgentFields(prev => ({
        ...prev,
        customer_name: customerData.name || prev.customer_name,
        customer_phone: customerData.phone || prev.customer_phone,
        customer_email: customerData.email || prev.customer_email,
        pickup_address: customerData.address || prev.pickup_address,
        delivery_address: customerData.address || prev.delivery_address
      }));
    }
  }, [customerData]);

  return (
    <Card className="sticky top-6 h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="p-6 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <ShoppingCart className="mr-3 h-5 w-5 text-app-primary" />
            Order Summary
          </h2>
          {cartItems.length > 0 && (
            <span className="bg-app-primary text-white text-xs font-bold px-4 py-2 rounded-full">
              {cartItems.length}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 overflow-y-auto flex-grow">
        {cartItems.length === 0 ? (
          <div className="text-center text-gray-500 py-10 flex flex-col items-center">
            <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-base">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-2">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {cartItems.map((item, index) => (
              <div key={index} className="flex flex-col pb-6 border-b last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h4 className="font-medium text-base mb-3">{item.itemName || item.name}</h4>
                    <div className="flex items-center">
                      <button 
                        className="w-9 h-9 flex items-center justify-center border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 text-base">{item.quantity}</span>
                      <button 
                        className="w-9 h-9 flex items-center justify-center border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-app-primary text-base mb-2">₹{calculateItemTotal(item)}</div>
                    <button 
                      className="text-sm text-red-500 flex items-center justify-end hover:text-red-600"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </button>
                  </div>
                </div>
                
                {item.addOns && item.addOns.length > 0 && (
                  <div className="mt-3 pl-4 text-sm">
                    <div className="font-medium text-gray-500">Add-ons:</div>
                    {item.addOns.map((addOn, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600">
                        <span>{addOn.itemName}</span>
                        <span>₹{addOn.price}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {item.spicyPreference && (
                  <div className="mt-2 pl-4 text-sm text-gray-600">
                    <span className="font-medium">Spicy:</span> {item.spicyPreference}
                  </div>
                )}
              </div>
            ))}

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount</span>
                <span>₹{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Promo Discount</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 px-2 py-1 border rounded text-right"
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(Number(e.target.value))}
                  />
                  <span>₹</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Additional Charge</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 px-2 py-1 border rounded text-right"
                    value={additionalCharge}
                    onChange={(e) => setAdditionalCharge(Number(e.target.value))}
                  />
                  <span>₹</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remaining Balance</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 px-2 py-1 border rounded text-right"
                    value={remainingBalance}
                    onChange={(e) => setRemainingBalance(Number(e.target.value))}
                  />
                  <span>₹</span>
                </div>
              </div>
              <div className="flex justify-between font-medium text-base pt-3 mt-3 border-t">
                <span>Total</span>
                <span className="text-app-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border rounded-lg p-4 bg-gray-50">
              <div className="flex-grow relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Tag className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  className="w-full pl-12 pr-4 py-3 border rounded-lg text-sm"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
              </div>
              <button 
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                onClick={handleApplyCoupon}
              >
                Apply
              </button>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium text-base mb-4">Customer Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    value={agentFields.customer_name}
                    onChange={(e) => setAgentFields(prev => ({ ...prev, customer_name: e.target.value }))}
                    readOnly={!!customerData?.name}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    value={agentFields.customer_phone}
                    onChange={(e) => setAgentFields(prev => ({ ...prev, customer_phone: e.target.value }))}
                    readOnly={!!customerData?.phone}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    value={agentFields.customer_email}
                    onChange={(e) => setAgentFields(prev => ({ ...prev, customer_email: e.target.value }))}
                    readOnly={!!customerData?.email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Address</label>
                  <textarea
                    placeholder="Customer Address"
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    value={agentFields.pickup_address}
                    onChange={(e) => setAgentFields(prev => ({ 
                      ...prev, 
                      pickup_address: e.target.value,
                      delivery_address: e.target.value 
                    }))}
                    rows="3"
                    readOnly={!!customerData?.address}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Delivery Mode</label>
                <select
                  className="w-full px-4 py-3 border rounded-lg text-sm"
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                >
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="HOME_DELIVERY">Home Delivery</option>
                  <option value="DINE_IN">Dine In</option>
                </select>
              </div>

              {deliveryMode === 'TAKEAWAY' && (
                <div>
                  <label className="block text-sm font-medium mb-3">Pickup Address *</label>
                  <textarea
                    placeholder="Enter pickup address"
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    value={agentFields.pickup_address}
                    onChange={(e) => setAgentFields(prev => ({ ...prev, pickup_address: e.target.value }))}
                    rows="3"
                  />
                </div>
              )}

              {deliveryMode === 'HOME_DELIVERY' && (
                <div>
                  <label className="block text-sm font-medium mb-3">Delivery Address *</label>
                  <textarea
                    placeholder="Enter delivery address"
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                    value={agentFields.delivery_address}
                    onChange={(e) => setAgentFields(prev => ({ ...prev, delivery_address: e.target.value }))}
                    rows="3"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-3">Payment Method</label>
                <select
                  className="w-full px-4 py-3 border rounded-lg text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Additional Notes</label>
                <textarea
                  placeholder="Any special instructions..."
                  className="w-full px-4 py-3 border rounded-lg text-sm"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows="3"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-6 border-t mt-auto bg-gray-50">
        <Button
          className="w-full bg-app-primary hover:bg-app-primary/90 py-3 text-black font-medium"
          disabled={isOrderButtonDisabled}
          onClick={handlePlaceOrder}
        >
          {isCreatingOrder ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </Card>
  );
};

export default Cart;
