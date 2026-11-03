import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api";

const formatOrderId = (order) => order.order_id || `ORD${String(order.id).padStart(5, "0")}`;

function OrdersDropdown({ value, options, onChange, ariaLabel, className = "", icon: Icon, triggerClassName = "" }) {
  const dropdownId = React.useId();
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [menuPosition, setMenuPosition] = React.useState(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const estimatedHeight = Math.min(280, options.length * 40 + 8);
    const openBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(100, Math.min(280, openBelow ? spaceBelow : spaceAbove));
    setMenuPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      top: openBelow ? rect.bottom + 6 : Math.max(8, rect.top - maxHeight - 6),
      width: rect.width,
      maxHeight,
    });
  }, [options.length]);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    updateMenuPosition();
    const handleOutsidePointer = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  React.useEffect(() => {
    if (isOpen) {
      menuRef.current?.querySelector(`[data-option-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, isOpen]);

  const openMenu = () => {
    const selectedIndex = options.findIndex((option) => String(option.value) === String(value));
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const selectOption = (option) => {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + direction + options.length) % options.length);
    } else if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && isOpen) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      if (options[activeIndex]) selectOption(options[activeIndex]);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${dropdownId}-listbox`}
        aria-activedescendant={isOpen ? `${dropdownId}-option-${activeIndex}` : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`group flex w-full items-center justify-between gap-2 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-violet-500/15 ${triggerClassName || "rounded-xl border border-violet-100 bg-white px-3.5 py-3 text-[13px] font-semibold text-slate-700 hover:border-violet-300"}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {Icon && <Icon size={16} className="shrink-0 text-violet-500" aria-hidden="true" />}
          <span className="truncate">{selectedOption?.label ?? value}</span>
        </span>
        <span className={`shrink-0 text-violet-500 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
      </button>
      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={`${dropdownId}-listbox`}
          role="listbox"
          aria-label={ariaLabel}
          className={`fixed z-[9999] overflow-y-auto rounded-xl border border-violet-100 bg-white p-1.5 shadow-[0_16px_40px_rgba(31,10,60,0.2)] ${className}`}
          style={menuPosition}
        >
          {options.map((option, index) => {
            const selected = String(option.value) === String(value);
            const active = index === activeIndex;
            return (
              <div
                key={`${option.value}-${index}`}
                id={`${dropdownId}-option-${index}`}
                data-option-index={index}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selected ? "bg-violet-700 font-bold text-white" : active ? "bg-violet-100 font-semibold text-violet-900" : "font-medium text-slate-700 hover:bg-violet-50"
                }`}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selected && <span aria-hidden="true">✓</span>}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
import { Link } from "react-router-dom";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiTruck,
  FiCheckCircle,
  FiShoppingBag,
  FiPackage,
  FiXCircle,
  FiCalendar,
  FiGrid,
  FiList,
  FiPrinter,
  FiX,
  FiPlus,
  FiFileText,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

const Orders = ({ statusFilter = "All" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const { ordersCache, setOrdersCache } = useAdmin();
  const [orders, setOrders] = useState(ordersCache[statusFilter] || []);
  const [loading, setLoading] = useState(!ordersCache[statusFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    orderId: null,
    status: "",
    tracking: "",
    courier: "",
    reason: ""
  });

  const [activeStatus, setActiveStatus] = useState(statusFilter);
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    setActiveStatus(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [activeStatus]);

  const fetchOrders = async () => {
    if (!ordersCache[activeStatus]) setLoading(true);
    try {
      const res = await api.get(`/orders?status=${activeStatus}`);
      const data = res.data || [];
      setOrders(data);
      setOrdersCache((prev) => ({ ...prev, [activeStatus]: data }));
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === "Shipping" || newStatus === "Cancelled") {
      setModalData({
        orderId,
        status: newStatus,
        tracking: "",
        courier: "",
        reason: ""
      });
      setShowModal(true);
      return;
    }

    performStatusUpdate(orderId, { status: newStatus });
  };

  const performStatusUpdate = async (orderId, updateData) => {
    setLoading(true);
    try {
      await api.put(`/orders/${orderId}/status`, updateData);
      toast.success(`Pipeline synchronized to: ${updateData.status}`);
      fetchOrders();
    } catch (error) {
      console.error("Status Sync Error:", error);
      toast.error("Failed to sync pipeline status");
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const updateData = { status: modalData.status };

    if (modalData.status === "Shipping") {
      if (!modalData.tracking || !modalData.courier) {
        return toast.error("Logistics data incomplete");
      }
      updateData.tracking_number = modalData.tracking;
      updateData.courier_name = modalData.courier;
      updateData.shipped_at = new Date().toISOString();
    } else if (modalData.status === "Cancelled") {
      if (!modalData.reason) {
        return toast.error("Cancellation rationale required");
      }
      updateData.cancellation_reason = modalData.reason;
      updateData.cancelled_at = new Date().toISOString();
    }

    performStatusUpdate(modalData.orderId, updateData);
    setShowModal(false);
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      formatOrderId(order),
      order.id,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      order.user_id,
    ].some((value) => String(value || "").toLowerCase().includes(query));
    const paymentMethod = String(order.payment_method || "").toLowerCase();
    const matchesPayment = paymentFilter === "All"
      || (paymentFilter === "COD" && /cash|cod/i.test(paymentMethod))
      || (paymentFilter === "Online" && Boolean(paymentMethod) && !/cash|cod/i.test(paymentMethod));
    return matchesSearch && matchesPayment;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const firstVisibleItem = filteredOrders.length ? indexOfFirstItem + 1 : 0;
  const lastVisibleItem = Math.min(indexOfLastItem, filteredOrders.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - currentPage) <= 1);

  const handlePrintTable = () => {
    const printWindow = window.open("", "", "width=1000,height=700");
    if (!printWindow) return;

    const rows = filteredOrders.map((order, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${formatOrderId(order)}</td>
        <td>${order.customer_name || "Guest Customer"}</td>
        <td>${order.items_type || "Single"}</td>
        <td>₹${Number(order.total_amount || 0).toFixed(2)}</td>
        <td>${order.payment_method || "-"}</td>
        <td>${order.status || "-"}</td>
        <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : "-"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`<!doctype html><html><head><title>Orders Report</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}h1{color:#350866;margin:0 0 6px}p{color:#64748b;margin:0 0 24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dbe1ea;padding:10px;text-align:left;font-size:12px}th{background:linear-gradient(90deg,#2e1065 0%,#4c1d95 55%,#86198f 100%);color:#FCD34D;text-transform:uppercase;font-size:11px}tr:nth-child(even){background:#f8fafc}</style></head><body><h1>Orders Report</h1><p>${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}</p><table><thead><tr><th>S No</th><th>Order ID</th><th>Customer</th><th>Order Type</th><th>Amount</th><th>Payment</th><th>Status</th><th>Order Date</th></tr></thead><tbody>${rows || '<tr><td colspan="8">No orders found</td></tr>'}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeStatus, paymentFilter, itemsPerPage]);

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "Order Placed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Packing":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Shipping":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Out for Delivery":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "New":
        return "bg-gray-100 text-gray-500 border-gray-200";
      case "Processing":
        return "bg-indigo-50 text-indigo-400 border-indigo-100";
      case "Shipped":
        return "bg-amber-50 text-amber-500 border-amber-100";
      default:
        return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  const statusFilterOptions = [
    { value: "All", label: "All Status" },
    { value: "Order Placed", label: "Confirmed" },
    { value: "Shipping", label: "Shipped" },
    { value: "Out for Delivery", label: "Out for Delivery" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
  ];
  const paymentFilterOptions = [
    { value: "All", label: "All Payment" },
    { value: "Online", label: "Online" },
    { value: "COD", label: "Cash on Delivery" },
  ];
  const pageSizeOptions = [10, 25, 50].map((size) => ({ value: size, label: `${size} per page` }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-[#f8f9fc] to-[#f2edff] pb-10 font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-[1600px] space-y-6 px-3 py-5 sm:px-6 sm:py-6 lg:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-800 text-white shadow-lg shadow-violet-500/25">
              <FiShoppingBag size={25} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#211936] sm:text-3xl">Orders Management</h1>
              <p className="mt-1 text-sm text-slate-500">Track, manage and process customer orders.</p>
            </div>
          </div>
          <Link
            to="/admin/orders/shop-create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-700/20 transition hover:brightness-110"
          >
            <FiPlus size={18} aria-hidden="true" />
            New Order
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <FiShoppingBag size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-800 leading-none my-0.5">{filteredOrders.length || 0}</h3>
              <p className="text-[10px] text-gray-400">All orders placed</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <FiCheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Confirmed Orders</p>
              <h3 className="text-3xl font-black text-slate-800 leading-none my-0.5">{orders.filter((o) => ["Order Placed", "Processing", "New"].includes(o.status)).length || 0}</h3>
              <p className="text-[10px] text-gray-400">Orders confirmed</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <FiTruck size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Shipped Orders</p>
              <h3 className="text-3xl font-black text-slate-800 leading-none my-0.5">{orders.filter((o) => ["Shipping", "Out for Delivery", "Shipped", "Packing"].includes(o.status)).length || 0}</h3>
              <p className="text-[10px] text-gray-400">Orders shipped</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <FiShoppingBag size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Delivered Orders</p>
              <h3 className="text-3xl font-black text-slate-800 leading-none my-0.5">{orders.filter((o) => o.status === "Delivered").length || 0}</h3>
              <p className="text-[10px] text-gray-400">Orders delivered</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <FiXCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Cancelled Orders</p>
              <h3 className="text-3xl font-black text-slate-800 leading-none my-0.5">{orders.filter((o) => o.status === "Cancelled").length || 0}</h3>
              <p className="text-[10px] text-gray-400">Orders cancelled</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-violet-100/80 bg-white/90 p-3 shadow-[0_8px_24px_rgba(54,22,93,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:max-w-md sm:flex-1">
              <input
                type="text"
                placeholder="Search by Order ID, Customer, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search orders by order ID, customer, email, or phone"
                className="w-full rounded-xl border border-violet-100 bg-white py-3 pl-10 pr-4 text-[13px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
              />
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-600" aria-hidden="true" />
            </div>

            <div className="w-full sm:w-40">
              <OrdersDropdown
                value={activeStatus}
                options={statusFilterOptions}
                onChange={setActiveStatus}
                ariaLabel="Filter by order status"
                icon={FiFilter}
              />
            </div>

            <div className="w-full sm:w-40">
              <OrdersDropdown
                value={paymentFilter}
                options={paymentFilterOptions}
                onChange={setPaymentFilter}
                ariaLabel="Filter by payment method"
                icon={FiFilter}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              onClick={handlePrintTable}
              className="rounded-xl border border-violet-100 bg-white p-3 text-violet-700 shadow-sm transition-colors hover:bg-violet-700 hover:text-white"
              aria-label="Print orders table"
              title="Print orders table"
            >
              <FiPrinter size={16} />
            </button>
            <div className="flex items-center gap-1 rounded-xl border border-violet-100 bg-violet-50/70 p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-lg p-2.5 transition-colors ${viewMode === "table" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-violet-700"}`}
                aria-label="Table mode"
                title="Table mode"
              >
                <FiList size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`rounded-lg p-2.5 transition-colors ${viewMode === "card" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-violet-700"}`}
                aria-label="Card mode"
                title="Card mode"
              >
                <FiGrid size={16} />
              </button>
            </div>
           
         
          </div>
        </div>

        {viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-[0_12px_35px_rgba(54,22,93,0.10)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-gradient-to-r from-[#4c168e] via-[#6825ad] to-[#4c168e] text-white">
                <tr className="border-b border-violet-900/20">
                  <th scope="col" className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider">Order Type</th>
                  <th scope="col" className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider">Payment</th>
                  <th scope="col" className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-4 text-[11px] font-extrabold uppercase tracking-wider">Order Date</th>
                  <th scope="col" className="px-4 py-4 text-center text-[11px] font-extrabold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-sm font-semibold text-slate-500">Loading orders...</td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-sm font-semibold text-slate-500">No orders found.</td>
                  </tr>
                ) : (
                  currentItems.map((order, idx) => {
                    const paymentMethod = order.payment_method || "Unknown";
                    const paymentStatus = order.payment_status || "Pending";
                    const customerName = order.customer_name || "Guest Customer";
                    const customerPhone = order.customer_phone || order.customer_email || "Contact not provided";
                    const itemCount = Array.isArray(order.items)
                      ? order.items.reduce((count, item) => count + (Number(item.quantity) || 1), 0)
                      : Number(order.item_count ?? order.items_count ?? 0);

                    return (
                      <tr key={order.id} className={`group border-b border-violet-100/80 transition-colors hover:bg-violet-50/70 ${idx % 2 ? "bg-[#fbfaff]" : "bg-white"}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                              <FiFileText size={16} aria-hidden="true" />
                            </span>
                            <span className="text-[13px] font-black text-violet-700">{formatOrderId(order)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-[170px] items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                              {customerName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="max-w-[190px] truncate text-[13px] font-bold text-[#211936]">{customerName}</div>
                              <div className="mt-0.5 max-w-[190px] truncate text-[11px] font-medium text-slate-500">{customerPhone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${
                            order.items_type === "Combo" ? "bg-violet-100 text-violet-700" :
                              order.items_type === "Mixed" ? "bg-amber-100 text-amber-700" :
                                "border-slate-200 bg-slate-100 text-slate-600"
                          }`}>
                            <FiPackage size={13} aria-hidden="true" />
                            {order.items_type || "Single"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[14px] font-black text-[#211936]">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</div>
                          <div className="mt-0.5 text-[11px] font-medium text-slate-500">{itemCount ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Order total"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-[145px] items-center gap-2">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${/cash|cod/i.test(paymentMethod) ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                              {/cash|cod/i.test(paymentMethod) ? <FiShoppingBag size={15} aria-hidden="true" /> : <FiCheckCircle size={15} aria-hidden="true" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block max-w-[150px] truncate text-[10px] font-extrabold uppercase text-violet-700">{paymentMethod}</span>
                              <span className={`mt-0.5 block text-[10px] font-semibold ${/paid|success/i.test(paymentStatus) ? "text-emerald-600" : "text-slate-500"}`}>{paymentStatus}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="min-w-[150px]">
                            <OrdersDropdown
                              value={order.status}
                              onChange={(status) => handleQuickStatusUpdate(order.id, status)}
                              ariaLabel={`Update status for ${formatOrderId(order)}`}
                              triggerClassName={`w-full rounded-xl border px-3 py-2 text-left text-[11px] font-bold ${getStatusBadgeClasses(order.status)}`}
                              options={(() => {
                                const flow = ["Order Placed", "Packing", "Shipping", "Out for Delivery", "Delivered"];
                                const currentIndex = flow.indexOf(order.status);
                                const options = currentIndex === -1 ? [...flow, "Cancelled", order.status] : [...flow.slice(currentIndex), ...(currentIndex < 2 ? ["Cancelled"] : [])];
                                return Array.from(new Set(options)).map((status) => ({ value: status, label: status }));
                              })()}
                            />
                            <div className="mt-1.5 text-[10px] font-medium text-slate-500">
                              {order.status === "Delivered" ? "Delivered on" : order.status === "Shipped" || order.status === "Out for Delivery" ? "Shipped on" : order.status === "Cancelled" ? "Cancelled on" : "Updated on"}
                              {order.updated_at && <span className="ml-1">{new Date(order.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-[130px] items-start gap-2.5">
                            <FiCalendar size={17} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
                            <div>
                              <div className="text-[12px] font-bold text-[#211936]">{order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unknown"}</div>
                              <div className="mt-0.5 text-[11px] font-medium text-slate-500">{order.created_at ? new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              aria-label={`View ${formatOrderId(order)}`}
                              title="View order"
                              className="rounded-xl border border-violet-100 bg-white p-2.5 text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                            >
                              <FiEye size={17} aria-hidden="true" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-violet-100 bg-gradient-to-r from-white to-violet-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[13px] font-semibold text-slate-600">
              Showing <span className="font-extrabold text-[#211936]">{firstVisibleItem}–{lastVisibleItem}</span> of <span className="font-extrabold text-[#211936]">{filteredOrders.length}</span> orders
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
              <div className="w-36">
                <OrdersDropdown
                  value={itemsPerPage}
                  options={pageSizeOptions}
                  onChange={(size) => setItemsPerPage(Number(size))}
                  ariaLabel="Orders per page"
                  triggerClassName="w-full rounded-xl border border-violet-100 bg-white px-3 py-2 text-left text-[12px] font-bold text-[#211936]"
                />
              </div>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Previous page" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-100 bg-white text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40">
                  ‹
                </button>
                {pageNumbers.map((pageNumber, index) => (
                  <React.Fragment key={pageNumber}>
                    {index > 0 && pageNumber - pageNumbers[index - 1] > 1 && <span className="px-1 text-slate-400" aria-hidden="true">…</span>}
                    <button
                      type="button"
                      aria-label={`Page ${pageNumber}`}
                      aria-current={currentPage === pageNumber ? "page" : undefined}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`h-9 min-w-9 rounded-xl px-2 text-[12px] font-bold shadow-sm transition ${currentPage === pageNumber ? "border border-violet-700 bg-violet-700 text-white" : "border border-violet-100 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700"}`}
                    >
                      {pageNumber}
                    </button>
                  </React.Fragment>
                ))}
                <button type="button" aria-label="Next page" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-100 bg-white text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full bg-white rounded-xl border border-gray-100 px-6 py-10 text-center text-gray-400 text-sm font-semibold">
                Loading orders...
              </div>
            ) : currentItems.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-gray-100 px-6 py-10 text-center text-gray-400 text-sm font-semibold">
                No orders found.
              </div>
            ) : (
              currentItems.map((order) => {
                const customerName = order.customer_name || "Guest Customer";
                const paymentMethod = order.payment_method || "Unknown";
                const paymentStatus = order.payment_status || "Pending";

                return (
                  <article key={order.id} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-violet-900/5">
                    <div className="flex items-start justify-between gap-3 border-b border-violet-100 pb-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order ID</p>
                        <h3 className="mt-1 text-sm font-black text-violet-700">{formatOrderId(order)}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${getStatusBadgeClasses(order.status)}`}>
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <div className="py-4 space-y-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer</p>
                        <p className="mt-1 text-sm font-bold text-[#211936]">{customerName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.customer_phone || order.customer_email || "Contact not provided"}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order Type</p>
                          <p className="mt-1 text-xs font-bold text-[#211936]">{order.items_type || "Single"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                          <p className="mt-1 text-base font-black text-[#211936]">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</p>
                          <p className="mt-1 text-xs font-bold text-[#211936]">{paymentMethod} · {paymentStatus}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order Date</p>
                        <p className="text-xs font-semibold text-gray-600 mt-1">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unknown"}
                        </p>
                      </div>
                    </div>

                    <Link to={`/admin/orders/${order.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 py-2.5 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-700 hover:text-white">
                      <FiEye size={14} /> View order
                    </Link>
                  </article>
                );
              })
            )}
          </div>
        )}

        {showModal && (
          createPortal(
          <div className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center bg-transparent p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px] animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className={`flex items-start justify-between p-8 ${modalData.status === "Cancelled" ? "bg-red-600" : "admin-table-header"}`}>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">{modalData.status} Pipeline Meta</h3>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1 italic">Order Ref: #ORD-0{modalData.orderId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  aria-label="Close order status modal"
                  title="Close"
                  className="ml-4 rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <FiX size={20} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-8 space-y-6">
                {modalData.status === "Shipping" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Docket Number / AWB</label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 transition-all outline-none font-bold"
                        placeholder="Enter Tracking ID..."
                        value={modalData.tracking}
                        onChange={(e) => setModalData((p) => ({ ...p, tracking: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Courier Intelligence Unit</label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 transition-all outline-none font-bold"
                        placeholder="e.g. BlueDart, Delhivery..."
                        value={modalData.courier}
                        onChange={(e) => setModalData((p) => ({ ...p, courier: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cancellation Rationale</label>
                    <textarea
                      required
                      rows="4"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500/20 transition-all outline-none font-bold resize-none"
                      placeholder="Reason for order termination..."
                      value={modalData.reason}
                      onChange={(e) => setModalData((p) => ({ ...p, reason: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-gray-100 text-gray-400 hover:bg-gray-50 transition-all">
                    Abort
                  </button>
                  <button type="submit" className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition-all active:scale-95 ${modalData.status === "Cancelled" ? "bg-red-600 shadow-red-500/20 hover:bg-red-500" : "admin-table-header shadow-blue-500/20 hover:brightness-110"}`}>
                    Sync Pipeline
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
          )
        )}
      </div>
    </div>
  );
};

export default Orders;
