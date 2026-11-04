import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiHeadphones,
  FiInfo,
  FiLoader,
  FiLock,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiTag,
  FiTruck,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";
import indianStates from "./indianStates";

const formatPrice = (value) => Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let razorpayScriptPromise;
const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
};

function Checkout() {
  const { user } = useContext(AuthContext);
  const { cart, loadingCart, fetchCart } = useContext(StoreContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [form, setForm] = useState({
    recipient_name: user?.username || user?.name || "",
    customer_email: user?.email || "",
    phone: user?.phone || "",
    street_address: "",
    city: "",
    district: "",
    state: "",
    zip_code: "",
  });
  const orderTotal = cart.reduce((total, item) => total + Number(item.subtotal ?? item.total_price ?? 0), 0);
  const checkoutTotal = appliedCoupon ? Number(appliedCoupon.total) : orderTotal;

  useEffect(() => {
    let active = true;
    const loadAddresses = async () => {
      setIsLoadingAddresses(true);
      try {
        const { data } = await api.get("/checkout/addresses");
        if (active) setSavedAddresses(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load saved addresses.");
        }
      } finally {
        if (active) setIsLoadingAddresses(false);
      }
    };

    if (user?.user_id) loadAddresses();
    return () => {
      active = false;
    };
  }, [user?.user_id]);

  const filteredAddresses = useMemo(() => {
    const query = addressSearch.trim().toLowerCase();
    const uniqueAddresses = savedAddresses.filter((address, index, addresses) => {
      const signature = [
        address.recipient_name,
        address.phone,
        address.email,
        address.street_address,
        address.city,
        address.district,
        address.state,
        address.zip_code,
      ].map((value) => String(value || "").trim().toLowerCase()).join("|");
      return addresses.findIndex((candidate) => [
        candidate.recipient_name,
        candidate.phone,
        candidate.email,
        candidate.street_address,
        candidate.city,
        candidate.district,
        candidate.state,
        candidate.zip_code,
      ].map((value) => String(value || "").trim().toLowerCase()).join("|") === signature) === index;
    });

    if (!query) return [];
    return uniqueAddresses.filter((address) =>
      [
        address.recipient_name,
        address.phone,
        address.street_address,
        address.city,
        address.district,
        address.state,
        address.zip_code,
      ].some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [addressSearch, savedAddresses]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSelectedAddressId(null);
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    setForm((current) => ({
      ...current,
      recipient_name: address.recipient_name || current.recipient_name,
      customer_email: address.email || current.customer_email,
      phone: address.phone || current.phone,
      street_address: address.street_address || "",
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      zip_code: address.zip_code || "",
    }));
    toast.success("Saved delivery address selected.");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code.");
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const { data } = await api.post("/checkout/coupon", { code: couponCode.trim() });
      setAppliedCoupon(data);
      setCouponCode(data.coupon.code);
      toast.success("Coupon applied successfully.");
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || "Unable to apply this coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
        { headers: { "Accept-Language": "en" } },
      );
      if (!response.ok) throw new Error("Address lookup failed. Please enter your address manually.");

      const result = await response.json();
      const address = result.address;
      if (!address) throw new Error("Could not find an address for your current location.");

      const city = address.city || address.town || address.village || address.municipality || address.suburb || "";
      const streetAddress = [
        address.house_number,
        address.road || address.pedestrian || address.footway,
        address.neighbourhood || address.suburb,
      ].filter(Boolean).join(", ");
      const fullAddress = result.display_name || [
        streetAddress,
        city,
        address.state_district || address.county,
        address.state,
        address.postcode,
        address.country,
      ].filter(Boolean).join(", ");
      const locationFields = {
        street_address: fullAddress,
        city,
        district: address.state_district || address.county || "",
        state: address.state || "",
        zip_code: address.postcode || "",
      };
      const populatedFields = Object.values(locationFields).filter(Boolean).length;
      if (!populatedFields) throw new Error("Could not find delivery address details for your current location.");

      setForm((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(locationFields).filter(([, value]) => value),
        ),
      }));
      toast.success("Delivery address filled from your current location.");
    } catch (error) {
      if (error && typeof error.code === "number") {
        const messages = {
          1: "Location permission was denied. Allow location access or enter your address manually.",
          2: "Your current location is unavailable. Please try again or enter your address manually.",
          3: "Location request timed out. Please try again.",
        };
        toast.error(messages[error.code] || "Unable to get your current location.");
      } else {
        toast.error(error.message || "Unable to look up your current address.");
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) throw new Error("Unable to load Razorpay checkout. Please try again.");
      const { data: paymentOrder } = await api.post("/checkout/razorpay/order", {
        coupon_code: appliedCoupon?.coupon?.code || "",
      });
      const payment = new window.Razorpay({
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Our Tech Tamil",
        description: "Order payment",
        order_id: paymentOrder.order_id,
        prefill: {
          name: form.recipient_name,
          email: form.customer_email,
          contact: form.phone,
        },
        handler: async (result) => {
          try {
            const { data } = await api.post("/checkout/razorpay/verify", {
              ...form,
              coupon_code: appliedCoupon?.coupon?.code || "",
              ...result,
            });
            setPlacedOrder(data);
            await fetchCart();
            toast.success("Payment successful and order placed.");
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verification failed. Please contact support if you were charged.");
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
        theme: { color: "#5b21b6" },
      });
      payment.on("payment.failed", (failure) => {
        toast.error(failure.error?.description || "Payment failed. Please try again.");
        setIsSubmitting(false);
      });
      payment.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to place your order.");
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <>
        <PageHeader title="Checkout" align="left" />
        <PageContainer className="py-12">
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-text-primary">Sign in to checkout</h1>
            <p className="mt-2 text-sm text-text-secondary">Please sign in to place your order.</p>
            <Link to="/login" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white">
              Sign in
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  if (placedOrder) {
    return (
      <>
        <PageHeader title="Order placed" align="left" />
        <PageContainer className="py-12 sm:py-16">
          <div className="mx-auto max-w-xl rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
            <FiCheckCircle className="mx-auto text-emerald-600" size={52} />
            <h1 className="mt-4 text-2xl font-extrabold text-text-primary">Order placed!</h1>
            <p className="mt-2 text-sm text-text-secondary">Your order number is <strong>{placedOrder.order_id}</strong>.</p>
            <p className="mt-1 text-sm text-text-secondary">
              Payment: {placedOrder.payment_method}
              {placedOrder.payment_status ? ` · ${placedOrder.payment_status}` : ""}
            </p>
            <p className="mt-4 text-lg font-extrabold text-primary">₹{formatPrice(placedOrder.total_amount)}</p>
            <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark">
              Continue Shopping
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  if (!loadingCart && cart.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" align="left" />
        <PageContainer className="py-12">
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-text-primary">Your cart is empty</h1>
            <p className="mt-2 text-sm text-text-secondary">Add products before continuing to checkout.</p>
            <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white">
              Continue Shopping
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const inputClass = "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-sm text-text-primary outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <>
      <PageHeader title="Checkout" align="left" />
      <main className="min-h-[60vh] bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <PageContainer className="py-5 sm:py-8">
      {loadingCart ? (
        <div className="mt-6 rounded-xl border border-border bg-white p-8 text-center text-sm text-text-secondary">Loading your cart...</div>
      ) : (
        <>
        <header className="relative mb-5 flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-100 via-white to-purple-50 p-4 shadow-sm sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <Link to="/cart" aria-label="Back to cart" className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-primary transition hover:bg-violet-100">
              <FiShoppingCart size={19} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-text-primary sm:text-2xl">Checkout</h1>
              <p className="text-xs text-text-secondary sm:text-sm">Complete your order securely</p>
            </div>
          </div>
          <ol aria-label="Checkout progress" className="flex w-full items-center justify-between gap-1 sm:w-auto sm:min-w-[440px] sm:gap-3">
            <li className="flex flex-col items-center gap-1 text-[11px] font-semibold text-emerald-700 sm:text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-violet-100"><FiShoppingCart size={15} /></span>
              <span className="flex items-center gap-1">Cart <FiCheckCircle size={13} /></span>
            </li>
            <li aria-hidden="true" className="mb-5 h-px flex-1 bg-primary/40 sm:w-9 sm:flex-none" />
            <li aria-current="step" className="flex flex-col items-center gap-1 text-[11px] font-bold text-primary sm:text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-violet-200"><FiMapPin size={16} /></span>
              Address
            </li>
            <li aria-hidden="true" className="mb-5 h-px flex-1 bg-violet-200 sm:w-9 sm:flex-none" />
            <li className="flex flex-col items-center gap-1 text-[11px] text-text-secondary sm:text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-white"><FiCreditCard size={15} /></span>
              Payment
            </li>
            <li aria-hidden="true" className="mb-5 h-px flex-1 bg-violet-200 sm:w-9 sm:flex-none" />
            <li className="flex flex-col items-center gap-1 text-[11px] text-text-secondary sm:text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-white"><FiCheck size={15} /></span>
              Complete
            </li>
          </ol>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <form id="checkout-form" onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-violet-200"><FiMapPin size={21} /></span>
                <div>
                  <h2 className="text-lg font-extrabold text-text-primary">Delivery address</h2>
                  <p className="text-xs text-text-secondary sm:text-sm">Add or choose your delivery address</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLocating ? <FiLoader className="animate-spin" size={16} /> : <FiMapPin size={16} />}
                <span>{isLocating ? "Finding..." : "Fetch live location"}</span>
              </button>
            </div>
            <div className="space-y-5 p-4 sm:p-6 lg:p-7">
            <section>
              <div className="mb-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary"><FiMapPin className="text-primary" size={17} /> Saved addresses</h3>
                <div className="mt-2">
                  <div className="relative min-w-0 flex-1">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="search"
                      value={addressSearch}
                      onChange={(event) => setAddressSearch(event.target.value)}
                      placeholder="Search saved addresses..."
                      aria-label="Search saved addresses"
                      className={`${inputClass} mt-0 pl-9`}
                    />
                  </div>
                </div>
                {isLoadingAddresses ? (
                  <p className="mt-3 text-sm text-text-secondary">Loading saved addresses...</p>
                ) : savedAddresses.length === 0 ? (
                  <p className="mt-3 text-sm text-text-secondary">No saved addresses yet. Enter a new address below.</p>
                ) : addressSearch.trim() && filteredAddresses.length === 0 ? (
                  <p className="mt-3 text-sm text-text-secondary">No saved addresses match your search.</p>
                ) : filteredAddresses.length > 0 ? (
                  <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {filteredAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => handleSelectAddress(address)}
                        aria-pressed={selectedAddressId === address.id}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                          selectedAddressId === address.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                            : "border-border bg-white hover:border-primary/50 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selectedAddressId === address.id ? "border-primary bg-primary text-white" : "border-slate-300 text-transparent"}`}>
                          <FiCheck size={12} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-text-primary">{address.recipient_name}</span>
                            {selectedAddressId === address.id && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-primary">Selected</span>}
                          </span>
                          <span className="mt-1 block text-xs text-text-secondary">{address.phone}</span>
                          <span className="mt-1 block text-xs leading-snug text-text-secondary">
                            {[address.street_address, address.city, address.district, address.state, address.zip_code]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <h3 className="flex items-center gap-2 border-t border-border pt-5 text-base font-bold text-text-primary">
                <FiMapPin className="text-primary" size={17} /> Enter new address
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-semibold text-text-primary sm:col-span-2 lg:col-span-1">
                  Full name *
                  <input className={inputClass} name="recipient_name" value={form.recipient_name} onChange={handleChange} maxLength={160} autoComplete="name" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  Phone number *
                  <input className={inputClass} name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={32} autoComplete="tel" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  Email
                  <input className={inputClass} name="customer_email" type="email" value={form.customer_email} onChange={handleChange} maxLength={191} autoComplete="email" />
                </label>
                <label className="text-sm font-semibold text-text-primary sm:col-span-2 lg:col-span-3">
                  Street address *
                  <textarea className={`${inputClass} min-h-24 resize-y`} name="street_address" value={form.street_address} onChange={handleChange} maxLength={512} autoComplete="street-address" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  City *
                  <input className={inputClass} name="city" value={form.city} onChange={handleChange} maxLength={120} autoComplete="address-level2" required />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  District
                  <input className={inputClass} name="district" value={form.district} onChange={handleChange} maxLength={120} />
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  State *
                  <select className={inputClass} name="state" value={form.state} onChange={handleChange} autoComplete="address-level1" required>
                    <option value="" disabled>Select a state or union territory</option>
                    {form.state && !indianStates.includes(form.state) && (
                      <option value={form.state}>{form.state}</option>
                    )}
                    {indianStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-text-primary">
                  Postal code *
                  <input className={inputClass} name="zip_code" value={form.zip_code} onChange={handleChange} maxLength={24} autoComplete="postal-code" required />
                </label>
              </div>
            </section>
            </div>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-100 via-violet-50 to-white px-4 py-3.5 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-violet-200">
                  <FiShoppingBag size={20} />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-text-primary sm:text-lg">Order Summary</h2>
                  <p className="text-xs text-text-secondary">Review your items and total</p>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 border-b border-violet-100 pb-3 last:border-0">
                      <div className="flex min-w-0 gap-3">
                        <img src={item.image || "https://ui-avatars.com/api/?name=Product&background=f3f4f6&color=240046"} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 bg-gray-50 p-1 object-contain" />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-bold text-text-primary">{item.name}</p>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.item_type === "combo" || item.combo_id
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {item.item_type === "combo" || item.combo_id ? "Combo" : "Normal"}
                          </span>
                          <p className="mt-1 text-xs text-text-secondary">Qty: {item.quantity}{item.colorName ? ` · ${item.colorName}` : ""}{item.size ? ` · ${item.size}` : ""}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-text-primary">₹{formatPrice(item.subtotal ?? item.total_price)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-violet-100 pt-3">
                  <label htmlFor="checkout-coupon" className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
                    <FiTag className="text-primary" size={17} /> Coupon Code
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="checkout-coupon"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value);
                        setAppliedCoupon(null);
                      }}
                      placeholder="Enter coupon code"
                      maxLength={64}
                      className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      disabled={isApplyingCoupon || isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || isSubmitting}
                      className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      {appliedCoupon.coupon.name} applied · You save ₹{formatPrice(appliedCoupon.discount)}
                    </p>
                  )}
                </div>

                <div className="mt-3 space-y-2 border-t border-violet-100 pt-3 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span><span className="font-semibold text-text-primary">₹{formatPrice(orderTotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="flex items-center gap-1.5">Delivery Charges <FiInfo className="text-slate-400" size={14} /></span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Free</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between font-semibold text-emerald-700">
                      <span>Coupon discount</span><span>−₹{formatPrice(appliedCoupon.discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-100 to-purple-100 px-3 py-2.5 font-extrabold text-text-primary">
                    <span>Total Amount</span><span className="text-lg sm:text-xl">₹{formatPrice(checkoutTotal)}</span>
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="text-sm font-bold text-text-primary">Payment method</h3>
              <label className="mt-3 flex items-center gap-2 rounded-lg border border-primary bg-white p-3 text-sm font-semibold text-primary">
                <input type="radio" name="payment_method" value="razorpay" checked readOnly />
                Pay online with Razorpay
              </label>
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || !cart.length}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiLock size={16} />
                {isSubmitting ? "Opening secure payment..." : `Pay securely · ₹${formatPrice(checkoutTotal)}`}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-text-secondary"><FiLock size={12} /> You’ll complete payment securely with Razorpay.</p>
            </section>
            <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary"><FiShield className="text-primary" size={18} /> Why shop with us?</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-text-secondary">
                <p className="flex items-center gap-2 rounded-xl bg-violet-50 p-3"><FiShield className="shrink-0 text-primary" size={18} /><span><span className="block font-bold text-text-primary">Secure payment</span>Protected checkout</span></p>
                <p className="flex items-center gap-2 rounded-xl bg-violet-50 p-3"><FiTruck className="shrink-0 text-primary" size={18} /><span><span className="block font-bold text-text-primary">Delivery support</span>Help with your order</span></p>
                <p className="flex items-center gap-2 rounded-xl bg-violet-50 p-3"><FiRefreshCw className="shrink-0 text-primary" size={18} /><span><span className="block font-bold text-text-primary">Returns information</span>Clear policy details</span></p>
                <p className="flex items-center gap-2 rounded-xl bg-violet-50 p-3"><FiHeadphones className="shrink-0 text-primary" size={18} /><span><span className="block font-bold text-text-primary">Support</span>We’re here to help</span></p>
              </div>
            </section>
            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-bold text-text-primary"><FiShield className="text-emerald-600" size={18} /> Secure payment options</p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-extrabold text-slate-600">
                {["Razorpay", "Cards", "UPI", "Netbanking"].map((method) => (
                  <span key={method} className="rounded-lg border border-violet-100 bg-violet-50/50 px-2 py-2">{method}</span>
                ))}
              </div>
            </section>
          </aside>
        </div>
        </>
      )}
      </PageContainer>
      </main>
    </>
  );
}

export default Checkout;
