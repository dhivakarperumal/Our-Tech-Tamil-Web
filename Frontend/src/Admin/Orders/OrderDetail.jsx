import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
    FiArrowLeft,
    FiPackage,
    FiTruck,
    FiClock,
    FiMail,
    FiPhone,
    FiMapPin,
    FiPrinter,
    FiCreditCard,
    FiXCircle
} from "react-icons/fi";
import logo from "/images/logo.jpeg";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

const formatOrderId = (order) => order.order_id || `ORD${String(order.id).padStart(5, "0")}`;

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Status update states
    const [selectedStatus, setSelectedStatus] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [courierName, setCourierName] = useState("");
    const [shippedAt, setShippedAt] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancelledAt, setCancelledAt] = useState("");

    const location = useLocation();

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    useEffect(() => {
        if (!loading && order && location.state?.autoPrint) {
            handlePrint();
            // Clear state so it doesn't print again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [loading, order, location.state]);

    const fetchOrderDetail = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
            setSelectedStatus(res.data.status);
            setTrackingNumber(res.data.tracking_number || "");
            setCourierName(res.data.courier_name || "");
            setShippedAt(res.data.shipped_at ? new Date(res.data.shipped_at).toISOString().slice(0, 16) : "");
            setCancellationReason(res.data.cancellation_reason || "");
            setCancelledAt(res.data.cancelled_at ? new Date(res.data.cancelled_at).toISOString().slice(0, 16) : "");
        } catch (error) {
            console.error("Fetch Order Detail Error:", error);
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!order) return;

        const logoUrl = logo.startsWith('http') ? logo : window.location.origin + (logo.startsWith('/') ? logo : '/' + logo);
        const items = Array.isArray(order.items) ? order.items : [];

        const itemsHTML = items
            .map((i, index) => {
                const sizeVal = i.variant_size || "";
                const colorVal = i.variant_color || "";
                const finalImgUrl = getProductImage(i);

                return `
          <tr>
            <td style="border:1px solid #ddd;padding:10px;text-align:center;">${index + 1}</td>
            <td style="border:1px solid #ddd;padding:10px;display:flex;align-items:center;gap:10px;">
              <img src="${finalImgUrl}" alt="${i.product_name || ""}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;border:1px solid #ddd;" />
              <div style="display:flex;flex-direction:column;text-align:left;">
                <span style="font-weight:bold;">${i.product_name || ""}</span>
                <small style="color:#666;margin-top:4px;font-size:10px;">${sizeVal ? 'Size: ' + sizeVal : ''} ${colorVal ? '| Color: ' + colorVal : ''}</small>
              </div>
            </td>
            <td style="border:1px solid #ddd;padding:10px;text-align:center;">${i.quantity || 1}</td>
            <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${Number(i.price || 0).toLocaleString()}</td>
            <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${Number((i.quantity || 1) * (i.price || 0)).toLocaleString()}</td>
          </tr>`;
            })
            .join("");

        const html = `
        <div id="printableArea" style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 40px; border: 1px solid #eee; max-width: 800px; margin: auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #3b82f6;padding-bottom:20px;margin-bottom:30px;">
            <img src="${logoUrl}" style="height:70px;" />
            <div style="text-align:right;">
                <div style="font-size:32px;color:#3b82f6;font-weight:900;text-transform:uppercase;letter-spacing:1px;">Invoice</div>
                <div style="font-size:14px;color:#94a3b8;font-weight:bold;margin-top:4px;">${formatOrderId(order)}</div>
            </div>
          </div>
    
          <div style="display:flex;justify-content:space-between;margin-top:20px;flex-wrap:wrap;gap:30px;">
            <div style="flex:1; min-width:240px; font-size:14px;">
              <h3 style="font-size:12px;text-transform:uppercase;color:#94a3b8;letter-spacing:1.5px;margin-bottom:15px;font-weight:900;">Customer Info</h3>
              <p style="margin:5px 0;"><strong>Name:</strong> ${order.customer_name || "Guest Customer"}</p>
              <p style="margin:5px 0;"><strong>Email:</strong> ${order.customer_email || "N/A"}</p>
              <p style="margin:5px 0;"><strong>Phone:</strong> ${order.customer_phone || "N/A"}</p>
              <p style="margin:5px 0;"><strong>Address:</strong> ${order.street_address || ""}, ${order.city || ""}, ${order.state || ""}, ${order.zip_code || ""}</p>
              <p style="margin:5px 0;"><strong>Country:</strong> ${order.country || "India"}</p>
            </div>
    
            <div style="flex:1; min-width:240px; font-size:14px;">
              <h3 style="font-size:12px;text-transform:uppercase;color:#94a3b8;letter-spacing:1.5px;margin-bottom:15px;font-weight:900;">Order Info</h3>
              <p style="margin:5px 0;"><strong>Shop:</strong> Sri Saravana Bangles</p>
              <p style="font-size:12px; color:#64748b; margin-bottom:10px; line-height:1.4;">
                78/3, Chetty Street Tirupattur,<br/>
                Near AVS Mahal and Jain Temple 635601<br/>
                Ph: +91 7010575375
              </p>
              <p style="margin:5px 0;"><strong>Status:</strong> <span style="text-transform:uppercase; font-size:10px; background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:4px; font-weight:bold;">${order.status || "-"}</span></p>
              <p style="margin:5px 0;"><strong>Payment:</strong> ${order.payment_method || "Online"}</p>
              <p style="margin:5px 0;"><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
    
          <h3 style="margin-top:40px;font-size:12px;text-transform:uppercase;color:#94a3b8;letter-spacing:1.5px;font-weight:900;">Item Manifest</h3>
          <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:13px;">
            <thead>
              <tr style="background:linear-gradient(90deg,#2e1065 0%,#4c1d95 55%,#86198f 100%); color:#FCD34D;">
                <th style="border:1px solid #e2e8f0;padding:12px;text-align:center;width:40px;">#</th>
                <th style="border:1px solid #e2e8f0;padding:12px;text-align:left;">Product Details</th>
                <th style="border:1px solid #e2e8f0;padding:12px;text-align:center;width:60px;">Qty</th>
                <th style="border:1px solid #e2e8f0;padding:12px;text-align:center;width:100px;">Price</th>
                <th style="border:1px solid #e2e8f0;padding:12px;text-align:center;width:100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
    
          <div style="margin-top:30px; border-top:2px solid #f1f5f9; padding-top:20px; display:flex; justify-content:flex-end;">
            <div style="width:250px; text-align:right; font-size:14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#64748b;">Subtotal:</span>
                    <span style="font-weight:bold;">₹${Number(order.subtotal || order.total_amount).toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#64748b;">Shipping:</span>
                    <span style="font-weight:bold;">₹0.00</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px solid #f1f5f9; margin-top:10px;">
                    <span style="font-size:16px; font-weight:900; color:#1e293b;">Total Amount:</span>
                    <span style="font-size:20px; font-weight:900; color:#3b82f6;">₹${Number(order.total_amount).toLocaleString()}</span>
                </div>
            </div>
          </div>
    
          <div style="text-align:center;margin-top:60px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:20px;">
            <p style="margin:0; font-weight:bold; color:#64748b;">Thank you for shopping with Sri Saravana Bangles!</p>
            <p style="margin:5px 0 0 0;">For any support, please contact us at support@saravanashoppings.in</p>
          </div>
        </div>
      `;

        // Create hidden iframe
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);

        const doc = (iframe.contentWindow && iframe.contentWindow.document) || iframe.contentDocument;

        try {
            doc.open();
            doc.write(`<!doctype html><html><head><title>Invoice - ${formatOrderId(order)}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`);
            doc.close();
        } catch (err) {
            console.error("Error writing to print iframe:", err);
            document.body.removeChild(iframe);
            window.print();
            return;
        }

        let printStarted = false;
        const triggerPrint = () => {
            if (printStarted) return;
            printStarted = true;
            try {
                const win = iframe.contentWindow || iframe;
                win.focus && win.focus();
                win.print && win.print();
            } catch (e) {
                console.error("Print error:", e);
            } finally {
                setTimeout(() => {
                    try { document.body.removeChild(iframe); } catch { }
                }, 1000);
            }
        };

        const imgs = doc.getElementsByTagName("img") || [];
        if (imgs.length === 0) {
            setTimeout(triggerPrint, 500);
        } else {
            let loaded = 0;
            const checkDone = () => {
                loaded++;
                if (loaded >= imgs.length) triggerPrint();
            };
            for (let i = 0; i < imgs.length; i++) {
                const img = imgs[i];
                if (img.complete) checkDone();
                else {
                    img.addEventListener("load", checkDone);
                    img.addEventListener("error", checkDone);
                }
            }
            setTimeout(triggerPrint, 4000);
        }
    };

    const getProductImage = (item) => {
        let imgUrl = null;
        try {
            // Helper to clean and prefix URL
            const processUrl = (url) => {
                if (!url || typeof url !== 'string') return null;
                if (url.startsWith('http') || url.startsWith('data:')) return url;
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                // Convert Windows backslashes to forward slashes
                const cleanPath = url.replace(/\\/g, '/');
                const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
                return `${backendUrl}${finalPath}`;
            };

            // 1. Check direct image from order item
            if (item.image && typeof item.image === 'string' && !item.image.startsWith('[')) {
                imgUrl = item.image;
            } 
            // 2. Check if image is a JSON string
            else if (item.image && typeof item.image === 'string' && item.image.startsWith('[')) {
                try {
                    const parsed = JSON.parse(item.image);
                    if (Array.isArray(parsed) && parsed.length > 0) imgUrl = parsed[0];
                } catch (e) {}
            }

            // 3. Fallback to variants from product join
            if (!imgUrl && item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
                const firstVariant = item.variants[0];
                if (firstVariant.images) {
                    const vImgs = typeof firstVariant.images === 'string' ? JSON.parse(firstVariant.images) : firstVariant.images;
                    if (Array.isArray(vImgs) && vImgs.length > 0) imgUrl = vImgs[0];
                }
            }

            // 4. Final attempt: item might have "images" directly
            if (!imgUrl && item.images) {
                const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                if (Array.isArray(imgs) && imgs.length > 0) imgUrl = imgs[0];
            }

            const finalUrl = processUrl(imgUrl);
            if (finalUrl) return finalUrl;

        } catch (error) {
            console.error("Error getting product image:", error);
        }

        // Final Fallback: UI Avatars
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name || 'Product')}&background=random`;
    };


    const handleStatusUpdate = async () => {
        if (!selectedStatus) return toast.error("Please select a status");

        setUpdating(true);
        try {
            const updateData = { status: selectedStatus };

            if (selectedStatus === 'Shipping') {
                if (!trackingNumber || !courierName) {
                    toast.error("Docket Number and Courier Name are required for Shipping");
                    setUpdating(false);
                    return;
                }
                updateData.tracking_number = trackingNumber;
                updateData.courier_name = courierName;
                if (shippedAt) updateData.shipped_at = shippedAt;
            }

            if (selectedStatus === 'Cancelled') {
                if (!cancellationReason) {
                    toast.error("Cancellation reason is required");
                    setUpdating(false);
                    return;
                }
                updateData.cancellation_reason = cancellationReason;
                if (cancelledAt) updateData.cancelled_at = cancelledAt;
            }

            await api.put(`/orders/${id}/status`, updateData);
            toast.success(`Order updated to ${selectedStatus}`);
            fetchOrderDetail();
        } catch (error) {
            toast.error("Status update failed");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Order Placed": return "bg-blue-100 text-blue-700";
            case "Packing": return "bg-indigo-100 text-indigo-700";
            case "Shipping": return "bg-amber-100 text-amber-700";
            case "Out for Delivery": return "bg-cyan-100 text-cyan-700";
            case "Delivered": return "bg-emerald-100 text-emerald-700";
            case "Cancelled": return "bg-red-100 text-red-700";
            case "New": return "bg-gray-100 text-gray-700 border border-gray-200";
            case "Processing": return "bg-indigo-50 text-indigo-500 border border-indigo-100";
            case "Shipped": return "bg-amber-50 text-amber-500 border border-amber-100";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Retrieving Order Artifacts...</p>
        </div>
    );

    if (!order) return (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <FiPackage className="mx-auto mb-4 text-slate-300" size={36} />
            <p className="text-lg font-bold text-slate-700">Order not found</p>
            <Link to="/admin/orders/all" className="mt-4 inline-flex text-sm font-bold text-violet-700 hover:text-fuchsia-700">
                Back to orders
            </Link>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="no-print overflow-hidden rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#86198f] text-white shadow-lg shadow-violet-950/10">
                <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <Link to="/admin/orders/all" aria-label="Back to orders" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20">
                            <FiArrowLeft size={20} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Order details</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{formatOrderId(order)}</h1>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-violet-100/80">
                                Placed {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20">
                            <FiPrinter size={16} /> Print
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-violet-950 transition hover:bg-amber-200">
                            <FiCreditCard size={16} /> Invoice
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Only Header (Hidden in Browser) */}
            <div className="hidden print:block border-b-4 border-slate-900 pb-8 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase">Store Invoice</h1>
                        <p className="text-sm font-bold text-gray-500 mt-2 italic">Official Manifest Record</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-black text-slate-800">{formatOrderId(order)}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] print-container print:block">
                <div className="space-y-6">
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                                    <FiPackage size={19} />
                                </span>
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-800">Order items</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">Products included in this order</p>
                                </div>
                            </div>
                            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
                                {order.items?.length || 0} items
                            </span>
                        </div>
                        {order.items?.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[620px] table-fixed text-left">
                                    <thead className="sr-only">
                                        <tr>
                                            <th scope="col">Product</th>
                                            <th scope="col">Quantity</th>
                                            <th scope="col">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.items.map((item, index) => {
                                            const unitPrice = Number(item.price) || 0;
                                            const quantity = Number(item.quantity) || 1;
                                            return (
                                                <tr key={item.id || `${order.id}-${index}`} className="hover:bg-violet-50/30">
                                                    <td className="w-[70%] px-5 py-5 sm:px-6">
                                                        <div className="flex min-w-0 items-center gap-4">
                                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                                                <img
                                                                    src={getProductImage(item)}
                                                                    alt={item.product_name || item.name || "Order product"}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(event) => {
                                                                        if (!event.currentTarget.src.includes("ui-avatars")) {
                                                                            event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name || item.name || "Product")}&background=ede9fe&color=4c1d95`;
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="truncate text-sm font-bold text-slate-800">{item.product_name || item.name || "Product"}</h3>
                                                                <p className="mt-1 text-xs text-slate-500">₹{unitPrice.toLocaleString("en-IN")} each</p>
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {item.variant_color && (
                                                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">Color: {item.variant_color}</span>
                                                                    )}
                                                                    {item.variant_size && (
                                                                        <span className="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">Size: {item.variant_size}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="w-[15%] px-4 py-5 text-center text-sm font-medium text-slate-500">Qty {quantity}</td>
                                                    <td className="w-[15%] px-5 py-5 text-right text-base font-extrabold text-violet-900 sm:px-6">
                                                        ₹{(unitPrice * quantity).toLocaleString("en-IN")}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <FiPackage className="mx-auto mb-2 text-slate-300" size={28} />
                                <p className="text-sm font-semibold text-slate-500">No item details found for this order.</p>
                            </div>
                        )}
                        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-6">
                            <div className="ml-auto flex max-w-sm items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Order total</p>
                                    <p className="mt-1 text-[11px] text-slate-400">{order.payment_method || "Payment method not set"}</p>
                                </div>
                                <p className="text-2xl font-black text-violet-900">₹{(Number(order.total_amount) || 0).toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    </section>

                    {/* Payment */}
                    {/* <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-center group">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                            <FiCreditCard />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Payment Channel</h3>
                            <p className="text-sm text-gray-400 font-bold mt-1">Processed via <span className="text-blue-600 font-black uppercase tracking-widest">{order.payment_method}</span> System</p>
                            {order.payment_id && (
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">Ref ID: <span className="text-slate-600">{order.payment_id}</span></p>
                            )}
                        </div>
                        <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border ${order.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {order.payment_status || 'Verified Payment'}
                        </div>
                    </div> */}

                    {/* Logistics Detail Card */}
                    {/* {(order.tracking_number || order.cancellation_reason) && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 animate-in fade-in duration-500">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                                {order.status === 'Cancelled' ? 'Incidence Report' : 'Logistics Intelligence'}
                            </h3>
                            {order.tracking_number && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Carrier Entity</p>
                                        <p className="text-sm font-black text-slate-800 uppercase">{order.courier_name || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Docket Ref</p>
                                        <p className="text-sm font-black text-blue-600 tracking-wider">{order.tracking_number}</p>
                                    </div>
                                    {order.shipped_at && (
                                        <div className="col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30 flex justify-between items-center">
                                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">System Shipped At</p>
                                            <p className="text-xs font-black text-blue-600 italic">{new Date(order.shipped_at).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {order.cancellation_reason && (
                                <div className="space-y-4">
                                    <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                                        <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-2">Primary Reason for Void</p>
                                        <p className="text-sm font-bold text-red-700 italic leading-relaxed">"{order.cancellation_reason}"</p>
                                    </div>
                                    {order.cancelled_at && (
                                        <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Termination Timestamp</p>
                                            <p className="text-xs font-black text-slate-600 italic">{new Date(order.cancelled_at).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )} */}
                </div>

                <div className="space-y-6">
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h2 className="text-base font-extrabold text-slate-800">Customer & delivery</h2>
                            <p className="mt-0.5 text-xs text-slate-500">Contact and shipping destination</p>
                        </div>
                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-100 text-lg font-black text-violet-800">
                                    {(order.customer_name || "Guest").charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-bold text-slate-800">{order.customer_name || "Guest Customer"}</h3>
                                    <p className="mt-1 text-[11px] font-semibold text-slate-500">{order.user_id ? "Registered customer" : "Guest customer"}</p>
                                </div>
                            </div>
                            {order.customer_phone && (
                                <div className="flex items-start gap-3">
                                    <FiPhone className="mt-0.5 shrink-0 text-violet-600" size={16} />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                                        <p className="mt-1 break-all text-sm font-semibold text-slate-700">{order.customer_phone}</p>
                                    </div>
                                </div>
                            )}
                            {order.customer_email && (
                                <div className="flex items-start gap-3">
                                    <FiMail className="mt-0.5 shrink-0 text-violet-600" size={16} />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                                        <p className="mt-1 break-all text-sm font-semibold text-slate-700">{order.customer_email}</p>
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex items-start gap-3">
                                    <FiMapPin className="mt-0.5 shrink-0 text-violet-600" size={17} />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shipping address</p>
                                        <div className="mt-2 space-y-1 text-sm leading-relaxed text-slate-700">
                                            {order.street_address && <p className="font-semibold">{order.street_address}</p>}
                                            {(order.city || order.district) && <p>{[order.city, order.district].filter(Boolean).join(", ")}</p>}
                                            {(order.state || order.zip_code) && <p>{[order.state, order.zip_code].filter(Boolean).join(" - ")}</p>}
                                            {order.country && <p>{order.country}</p>}
                                            {!order.street_address && order.address && <p>{order.address}</p>}
                                            {!order.street_address && !order.address && <p className="text-slate-400">No address provided</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h2 className="text-base font-extrabold text-slate-800">Order summary</h2>
                            <p className="mt-0.5 text-xs text-slate-500">Payment and fulfilment details</p>
                        </div>
                        <div className="space-y-4 p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-sm text-slate-500"><FiCreditCard className="text-violet-600" /> Payment method</span>
                                <span className="text-right text-sm font-bold text-slate-800">{order.payment_method || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-slate-500">Order type</span>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  order.items_type === "Combo" ? "bg-violet-50 text-violet-700" :
                                    order.items_type === "Mixed" ? "bg-amber-50 text-amber-700" :
                                      "bg-slate-100 text-slate-600"
                                }`}>{order.items_type || "Single"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-slate-500">Payment status</span>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${order.payment_status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {order.payment_status || "Pending"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-sm text-slate-500"><FiClock className="text-violet-600" /> Order date</span>
                                <span className="text-right text-xs font-semibold text-slate-700">{order.created_at ? new Date(order.created_at).toLocaleString() : "—"}</span>
                            </div>
                            {order.tracking_number && (
                                <div className="rounded-xl bg-violet-50 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-violet-800"><FiTruck /> Shipping details</div>
                                    <p className="mt-2 text-sm font-semibold text-slate-700">{order.courier_name || "Courier"} · {order.tracking_number}</p>
                                    {order.shipped_at && <p className="mt-1 text-xs text-slate-500">Shipped {new Date(order.shipped_at).toLocaleString()}</p>}
                                </div>
                            )}
                            {order.cancellation_reason && (
                                <div className="rounded-xl bg-red-50 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-700"><FiXCircle /> Cancellation</div>
                                    <p className="mt-2 text-sm text-red-800">{order.cancellation_reason}</p>
                                    {order.cancelled_at && <p className="mt-1 text-xs text-red-600">{new Date(order.cancelled_at).toLocaleString()}</p>}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Status Update Control */}
                    {/* <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6 no-print">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black uppercase tracking-widest text-[10px] opacity-40">Pipeline Control</h3>
                            {order.status !== selectedStatus && (
                                <span className="text-[9px] font-black bg-blue-600 px-2 py-0.5 rounded-full animate-pulse">Pending Sync</span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Update Order Progress</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black uppercase tracking-widest text-xs outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    {(() => {
                                        const flow = ["Order Placed", "Packing", "Shipping", "Out for Delivery", "Delivered"];
                                        const currentIndex = flow.indexOf(order.status);
                                        const options = currentIndex === -1 
                                            ? [...flow, "Cancelled", order.status] 
                                            : [...flow.slice(currentIndex), ...(currentIndex < 2 ? ["Cancelled"] : [])];
                                        
                                        // Since selectedStatus could be one of the future statuses the user is switching to,
                                        // we should also make sure it's included just in case
                                        const finalOptions = Array.from(new Set([...options, selectedStatus])).filter(Boolean);

                                        return finalOptions.map(status => (
                                            <option key={status} value={status} className="bg-slate-900">{status}</option>
                                        ));
                                    })()}
                                </select>
            </div>


            {selectedStatus === 'Shipping' && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-1">Docket Number / Tracking ID</label>
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter AWB or Docket Number"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-sm outline-none focus:border-blue-500/50 transition-all text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-1">Courier Service Name</label>
                        <input
                            type="text"
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                            placeholder="e.g. BlueDart, DTDC, Delhivery"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-sm outline-none focus:border-blue-500/50 transition-all text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-1">Shipment Time</label>
                        <input
                            type="datetime-local"
                            value={shippedAt || new Date().toISOString().slice(0, 16)}
                            onChange={(e) => setShippedAt(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-sm outline-none focus:border-blue-500/50 transition-all text-white"
                        />
                    </div>
                </div>
            )}


            {selectedStatus === 'Cancelled' && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-red-400 ml-1">Cancellation Reason</label>
                        <textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            rows="3"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-sm outline-none focus:border-red-500/50 transition-all resize-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-red-400 ml-1">Cancellation Time</label>
                        <input
                            type="datetime-local"
                            value={cancelledAt || new Date().toISOString().slice(0, 16)}
                            onChange={(e) => setCancelledAt(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-sm outline-none focus:border-red-500/50 transition-all text-white"
                        />
                    </div>
                </div>
            )}

            <button
                onClick={handleStatusUpdate}
                disabled={updating || order.status === selectedStatus && !(['Shipping', 'Cancelled'].includes(selectedStatus) && (trackingNumber !== order.tracking_number || courierName !== order.courier_name || cancellationReason !== order.cancellation_reason))}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-xl ${updating ? 'bg-white/10 text-white/30 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
            >
                {updating ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"></div>
                        <span>Syncing...</span>
                    </div>
                ) : 'Execute Status Update'}
            </button>
        </div>
                    </div > */}
                </div>
            </div >
        </div >
    );
};

export default OrderDetail;
