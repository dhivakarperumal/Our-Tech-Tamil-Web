import React, { useState, useEffect, useRef } from "react";
import { FiArrowLeft, FiPlus, FiTrash2, FiSave, FiUser, FiPackage, FiSearch, FiCheckCircle, FiMapPin, FiTruck, FiArrowRight, FiX, FiClock, FiChevronDown, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

const SearchableDropdown = ({
    label,
    value,
    options,
    onChange,
    placeholder,
    emptyLabel,
    searchPlaceholder,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const searchRef = useRef(null);
    const selectedOption = options.find((option) => String(option.value) === String(value));
    const normalizedSearch = search.trim().toLowerCase();
    const filteredOptions = options.filter((option) =>
        `${option.label} ${option.meta || ""}`.toLowerCase().includes(normalizedSearch)
    );

    useEffect(() => {
        if (!isOpen) return undefined;
        const handlePointerDown = (event) => {
            if (!containerRef.current?.contains(event.target)) setIsOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        searchRef.current?.focus();
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const chooseOption = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
            <div className="relative" ref={containerRef}>
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    disabled={disabled}
                    onClick={() => setIsOpen((open) => !open)}
                    onKeyDown={(event) => {
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                            event.preventDefault();
                            setIsOpen(true);
                        }
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3.5 py-3 text-left shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        isOpen ? "border-violet-500 ring-4 ring-violet-100" : "border-slate-200 hover:border-violet-300"
                    }`}
                >
                    {selectedOption?.image && (
                        <img src={selectedOption.image} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 object-cover" />
                    )}
                    <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${selectedOption ? "text-slate-800" : "text-slate-400"}`}>
                        {selectedOption?.label || placeholder}
                    </span>
                    {selectedOption?.meta && <span className="hidden shrink-0 text-xs font-bold text-violet-700 sm:block">{selectedOption.meta}</span>}
                    <FiChevronDown className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-violet-700" : ""}`} />
                </button>
                {isOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15">
                        <div className="border-b border-slate-100 p-2.5">
                            <div className="relative">
                                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchRef}
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "ArrowDown" && filteredOptions[0]) {
                                            event.preventDefault();
                                            containerRef.current?.querySelector("[role='option']")?.focus();
                                        }
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
                                />
                            </div>
                        </div>
                        <div role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1.5">
                            {emptyLabel && (
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={!selectedOption}
                                    onClick={() => chooseOption({ value: "", label: emptyLabel })}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                        !selectedOption ? "bg-violet-50 font-bold text-violet-800" : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <span className="min-w-0 flex-1">{emptyLabel}</span>
                                    {!selectedOption && <FiCheck className="shrink-0 text-violet-700" />}
                                </button>
                            )}
                            {filteredOptions.map((option) => {
                                const isSelected = String(option.value) === String(value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => chooseOption(option)}
                                        onKeyDown={(event) => {
                                            if (event.key === "ArrowDown") {
                                                event.preventDefault();
                                                event.currentTarget.nextElementSibling?.focus();
                                            } else if (event.key === "ArrowUp") {
                                                event.preventDefault();
                                                event.currentTarget.previousElementSibling?.focus();
                                            }
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                            isSelected ? "bg-violet-50 text-violet-900" : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        {option.image && <img src={option.image} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-cover" />}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold">{option.label}</span>
                                            {option.detail && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{option.detail}</span>}
                                        </span>
                                        {option.meta && <span className="shrink-0 text-xs font-bold text-violet-700">{option.meta}</span>}
                                        {isSelected && <FiCheck className="shrink-0 text-violet-700" />}
                                    </button>
                                );
                            })}
                            {filteredOptions.length === 0 && (
                                <p className="px-3 py-6 text-center text-sm text-slate-500">No matching options found.</p>
                            )}
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] font-medium text-slate-400">
                            {filteredOptions.length} {filteredOptions.length === 1 ? "option" : "options"}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CreateOrder = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [combos, setCombos] = useState([]);
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [selectedCategoryType, setSelectedCategoryType] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedSize, setSelectedSize] = useState("");
    const [users, setUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [isGuest, setIsGuest] = useState(true);

    const [formData, setFormData] = useState({
        user_id: "", // For future use if logged in admin has a user_id
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        address: "", // legacy
        street_address: "",
        city: "",
        district: "",
        state: "",
        country: "India",
        zip_code: "",
        order_type: "Shop",
        payment_method: "Cash",
        status: "Order Placed",
        items: [],
        total_amount: 0,
        created_at: new Date().toISOString().slice(0, 16) // Default to current time for the datetime-local input
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, userRes, catRes, comboRes] = await Promise.all([
                    api.get("/products", { params: { limit: 100 } }),
                    api.get("/auth/users"),
                    api.get("/categories"),
                    api.get("/combos")
                ]);
                setProducts(Array.isArray(prodRes.data)
                    ? prodRes.data
                    : Array.isArray(prodRes.data?.products)
                        ? prodRes.data.products
                        : []);
                setUsers(Array.isArray(userRes.data) ? userRes.data : []);
                setCategories(Array.isArray(catRes.data) ? catRes.data : []);
                setCombos((Array.isArray(comboRes.data?.combos) ? comboRes.data.combos : [])
                    .filter((combo) => combo.status === "Active"));
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load initial data");
            }
        };
        fetchData();
    }, []);

    const getProductVariants = (product) => {
        if (!product) return [];
        if (Array.isArray(product.variants)) return product.variants;
        if (typeof product.variants === "string") {
            try {
                const parsed = JSON.parse(product.variants);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const getFirstImage = (images) => {
        if (typeof images === "string" && images.startsWith("[")) {
            try {
                images = JSON.parse(images);
            } catch {
                return "";
            }
        }
        return Array.isArray(images) ? images[0] || "" : typeof images === "string" ? images : "";
    };

    const resolveImageUrl = (image) => {
        if (!image) return "";
        let imageUrl = getFirstImage(image);
        if (typeof imageUrl !== "string") return "";
        if (!imageUrl) return "";
        if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        return `${backendUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    };

    const getProductImage = (product, variant) =>
        resolveImageUrl(
            getFirstImage(variant?.images) ||
            getFirstImage(product?.images) ||
            product?.image_url ||
            product?.image
        );

    const getDefaultSize = (variant) => {
        const stockSizes = Object.entries(variant?.sizesStock || {})
            .find(([, stock]) => parseInt(stock, 10) > 0);
        return stockSizes?.[0] || variant?.selectedSizes?.[0] || "Free Size";
    };

    const handleProductClick = (product) => {
        const firstVariant = getProductVariants(product)[0] || {
            color: "#4b0b78",
            colorName: "Standard",
            images: [],
            sizesStock: {}
        };
        setSelectedProductForVariant(product);
        setSelectedVariant(firstVariant);
        setSelectedSize(getDefaultSize(firstVariant));
    };

    const confirmAddItem = () => {
        if (!selectedVariant || !selectedSize) {
            toast.error("Please select color and size");
            return;
        }

        const product = selectedProductForVariant;
        const colorName = selectedVariant.colorName || selectedVariant.color || "Standard";

        // Check if same product with same variant already in cart
        const existingItemIndex = formData.items.findIndex(item =>
            item.product_id === product.id &&
            item.variant_color === colorName &&
            item.variant_size === selectedSize
        );

        const price = parseFloat(product.offer_price || product.price || 0);
        let updatedItems = [...formData.items];

        if (existingItemIndex > -1) {
            updatedItems[existingItemIndex].quantity += 1;
            updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
            toast.success("Increased quantity for item in cart");
        } else {
            const newItem = {
                product_id: product.id,
                name: product.name,
                price: price,
                quantity: 1,
                total: price,
                variant_color: colorName,
                variant_size: selectedSize,
                image: getProductImage(product, selectedVariant)
            };
            updatedItems.push(newItem);
        }

        updateTotal(updatedItems);

        setSelectedProductForVariant(null);
        setProductSearchTerm("");
    };

    const handleAddCombo = () => {
        if (!selectedCombo) {
            toast.error("Please select a combo first");
            return;
        }

        const price = parseFloat(selectedCombo.final_price || selectedCombo.offer_price || selectedCombo.mrp || 0);
        const image = selectedCombo.thumbnail || getFirstImage(selectedCombo.gallery_images);
        const existingItemIndex = formData.items.findIndex(
            (item) => Number(item.combo_id) === Number(selectedCombo.id)
        );
        const updatedItems = [...formData.items];

        if (existingItemIndex > -1) {
            updatedItems[existingItemIndex].quantity += 1;
            updatedItems[existingItemIndex].total =
                updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        } else {
            updatedItems.push({
                product_id: null,
                combo_id: Number(selectedCombo.id),
                item_type: "combo",
                name: selectedCombo.name,
                price,
                quantity: 1,
                total: price,
                variant_color: "",
                variant_size: "",
                image,
                minimum_order_quantity: Number(selectedCombo.minimum_order_quantity) || 1,
                maximum_order_quantity: Number(selectedCombo.maximum_order_quantity) || 0,
            });
        }

        updateTotal(updatedItems);
        setSelectedCombo(null);
    };

    const handleRemoveItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        updateTotal(updatedItems);
    };

    const handleQuantityChange = (index, qty) => {
        const updatedItems = [...formData.items];
        const item = updatedItems[index];
        const minimum = item.item_type === "combo" ? item.minimum_order_quantity || 1 : 1;
        const maximum = item.item_type === "combo" ? item.maximum_order_quantity : 0;
        const quantity = Math.max(minimum, parseInt(qty, 10) || minimum);
        item.quantity = maximum ? Math.min(quantity, maximum) : quantity;
        item.total = item.price * item.quantity;
        updateTotal(updatedItems);
    };

    const updateTotal = (items) => {
        const total = items.reduce((sum, item) => sum + item.total, 0);
        setFormData(prev => ({ ...prev, items, total_amount: total }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { customer_name, customer_phone, street_address, city, state, zip_code } = formData;

        if (!customer_name || !customer_phone || !street_address || !city || !state || !zip_code) {
            toast.error("Please fill all mandatory fields (Name, Phone, Street, City, State, and Zip Code)");
            return;
        }

        setLoading(true);
        try {
            await api.post("/orders", { ...formData, order_type: "Shop" });
            toast.success("Order created successfully!");
            setTimeout(() => navigate("/admin/orders/all"), 1500);
        } catch (error) {
            console.error("Order Creation Error:", error);
            toast.error(error.response?.data?.message || "Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    const categoryTypes = [...new Set(categories
        .map(category => category.categoryType || category.category_type || "General")
        .filter(Boolean))];
    const filteredCategories = categories.filter(category =>
        !selectedCategoryType ||
        (category.categoryType || category.category_type || "General") === selectedCategoryType
    );
    const filteredProducts = products.filter(p => {
        const search = productSearchTerm.toLowerCase();
        const matchesSearch = String(p.name || "").toLowerCase().includes(search) ||
            String(p.product_code || "").toLowerCase().includes(search);
        const productCategoryType = p.cat_type || p.category_type ||
            categories.find(category => category.name === p.category)?.categoryType || "General";
        const matchesCategoryType = !selectedCategoryType || productCategoryType === selectedCategoryType;
        const matchesCategory = !selectedCategory || p.category === selectedCategory.name;
        return matchesSearch && matchesCategoryType && matchesCategory;
    });
    const comboOptions = combos.map((combo) => ({
        value: combo.id,
        label: combo.name,
        meta: `₹${parseFloat(combo.final_price || combo.offer_price || combo.mrp || 0).toLocaleString("en-IN")}`,
        detail: `${combo.code || "Combo"} · ${combo.category || combo.category_type || ""}`,
        image: resolveImageUrl(combo.thumbnail || getFirstImage(combo.gallery_images)),
    }));

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.phone?.includes(userSearchTerm) ||
        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    const handleSelectUser = (user) => {
        setFormData(prev => ({
            ...prev,
            user_id: user.user_id || user.id,
            customer_name: user.name || user.username || "",
            customer_email: user.email || "",
            customer_phone: user.phone || "",
            street_address: user.street_address || "",
            city: user.city || "",
            district: user.district || "",
            state: user.state || "",
            country: user.country || "India",
            zip_code: user.zip_code || ""
        }));
        setUserSearchTerm(user.name || user.username || "");
        setIsGuest(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#86198f] text-white shadow-lg shadow-violet-950/10">
                <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Order management</p>
                            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Create New Shop Order</h1>
                            <p className="mt-1 text-sm text-violet-100/80">Create a showroom order for an in-store customer.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {[{ number: 1, title: "Products" }, { number: 2, title: "Customer details" }].map(({ number, title }) => (
                            <div
                                key={number}
                                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                                    step === number
                                        ? "bg-white text-violet-800"
                                        : step > number
                                            ? "bg-emerald-400/20 text-emerald-100"
                                            : "bg-white/10 text-violet-200"
                                }`}
                            >
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                                    step === number ? "bg-violet-100 text-violet-800" : "bg-white/15 text-white"
                                }`}>{number}</span>
                                {title}
                            </div>
                        ))}
                    </div>
                </div>
            </div>



            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3 xl:gap-8">
                <div className="space-y-6 xl:col-span-2">
                    {step === 1 ? (
                        /* Step 1: Product Selection */
                        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
                            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50/80 p-4 md:grid-cols-3 sm:p-5">
                                <SearchableDropdown
                                    label="1. Select Category Type"
                                    value={selectedCategoryType}
                                    options={categoryTypes.map((categoryType) => ({ value: categoryType, label: categoryType }))}
                                    emptyLabel="All Category Types"
                                    placeholder="All Category Types"
                                    searchPlaceholder="Search category types..."
                                    onChange={(value) => {
                                        setSelectedCategoryType(value);
                                        setSelectedCategory(null);
                                        setSelectedProductForVariant(null);
                                    }}
                                />
                                <SearchableDropdown
                                    label="2. Select Category"
                                    value={selectedCategory?.id || ""}
                                    options={filteredCategories.map((category) => ({
                                        value: category.id,
                                        label: category.name,
                                        detail: category.categoryType || category.category_type || "",
                                    }))}
                                    emptyLabel="All Categories"
                                    placeholder="All Categories"
                                    searchPlaceholder="Search categories..."
                                    onChange={(value) => {
                                        const category = filteredCategories.find((item) => String(item.id) === String(value));
                                        setSelectedCategory(category || null);
                                        setSelectedProductForVariant(null);
                                    }}
                                />
                                <SearchableDropdown
                                    label="3. Select Product"
                                    value={selectedProductForVariant?.id || ""}
                                    options={filteredProducts.map((product) => ({
                                        value: product.id,
                                        label: product.name,
                                        meta: `₹${parseFloat(product.offer_price || product.price || 0).toLocaleString("en-IN")}`,
                                        detail: product.product_code || product.category || "",
                                        image: getProductImage(product, getProductVariants(product)[0]),
                                    }))}
                                    placeholder="Choose a product..."
                                    searchPlaceholder="Search products..."
                                    onChange={(value) => {
                                        const product = filteredProducts.find((item) => String(item.id) === String(value));
                                        if (product) handleProductClick(product);
                                        else setSelectedProductForVariant(null);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                                <SearchableDropdown
                                    label="Add a Combo"
                                    value={selectedCombo?.id || ""}
                                    options={comboOptions}
                                    placeholder={combos.length ? "Choose a combo..." : "No active combos available"}
                                    searchPlaceholder="Search combos..."
                                    onChange={(value) => {
                                        setSelectedCombo(combos.find((combo) => String(combo.id) === String(value)) || null);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCombo}
                                    disabled={!selectedCombo || (
                                        Number(selectedCombo.track_inventory) === 1 &&
                                        Number(selectedCombo.allow_backorders) !== 1 &&
                                        Number(selectedCombo.available_stock) <= 0
                                    )}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    <FiPlus />
                                    Add Combo
                                </button>
                            </div>

                            {/* Variant Selection UI */}
                            {selectedProductForVariant && (
                                    <div className="space-y-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-4 shadow-sm sm:p-6 animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white bg-slate-100 shadow-sm ring-1 ring-slate-200">
                                                {getProductImage(selectedProductForVariant, selectedVariant) ? (
                                                    <img src={getProductImage(selectedProductForVariant, selectedVariant)} alt={selectedProductForVariant.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                                                ) : <div className="flex h-full w-full items-center justify-center text-slate-300"><FiPackage size={24} /></div>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">Selected product</p>
                                                <h3 className="mt-1 truncate font-bold text-slate-900">{selectedProductForVariant.name}</h3>
                                                <p className="mt-1 text-sm font-semibold text-slate-600">₹{parseFloat(selectedProductForVariant.offer_price || selectedProductForVariant.price || 0).toLocaleString("en-IN")}</p>
                                            </div>
                                        </div>
                                        <button type="button" aria-label="Close product options" onClick={() => setSelectedProductForVariant(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"><FiX /></button>
                                    </div>

                                    {/* Colors */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Available Colors</p>
                                        <div className="flex flex-wrap gap-3">
                                            {getProductVariants(selectedProductForVariant).length > 0 ? getProductVariants(selectedProductForVariant).map((v, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setSelectedVariant(v); setSelectedSize(getDefaultSize(v)); }}
                                                    type="button"
                                                    className={`group relative rounded-full border-2 p-1 transition-all ${selectedVariant === v ? 'border-[#4b0b78] scale-110 ring-4 ring-violet-100' : 'border-transparent hover:border-violet-200'}`}
                                                    title={v.colorName || v.color}
                                                >
                                                    <div
                                                        className="h-9 w-9 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
                                                        style={{ backgroundColor: v.color }}
                                                    ></div>
                                                    {v.colorName && (
                                                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase text-violet-700 opacity-0 transition-opacity group-hover:opacity-100">
                                                            {v.colorName}
                                                        </span>
                                                    )}
                                                </button>
                                            )) : (
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><span className="w-8 h-8 rounded-full bg-[#4b0b78] border border-gray-200"></span> Standard</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sizes */}
                                    {selectedVariant && (
                                        <div className="space-y-3 animate-in fade-in duration-500">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select Size</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(selectedVariant.sizesStock || {}).filter(([, stock]) => parseInt(stock, 10) > 0).length > 0 ? Object.entries(selectedVariant.sizesStock || {}).map(([size, stock]) => (
                                                    <button
                                                        type="button"
                                                        key={size}
                                                        disabled={parseInt(stock) <= 0}
                                                        onClick={() => setSelectedSize(size)}
                                                        className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${selectedSize === size ? 'bg-[#4b0b78] text-white shadow-md shadow-violet-900/15' : 'border border-slate-200 bg-white text-slate-600 shadow-sm'} ${parseInt(stock) <= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-violet-300'}`}
                                                    >
                                                        {size} <span className="opacity-50 ml-1">({stock})</span>
                                                    </button>
                                                )) : <button type="button" onClick={() => setSelectedSize("Free Size")} className="rounded-xl bg-[#4b0b78] px-4 py-2.5 text-xs font-bold text-white shadow-md">Free Size</button>}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={confirmAddItem}
                                        disabled={!selectedVariant || !selectedSize}
                                        className="w-full rounded-xl bg-[#4b0b78] py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-[#260642] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                    >
                                        Add Selection to Order
                                    </button>
                                </div>
                            )}

                            {/* Added Items List */}
                            <div className="space-y-3">
                                {formData.items.length === 0 ? (
                                    <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                                            <FiPackage size={32} />
                                        </div>
                                        <p className="text-gray-400 font-bold">Your cart is empty.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-gray-100 rounded-2xl">
                                        <table className="w-full text-left">
                                            <thead className="admin-table-header">
                                                <tr className="text-[10px] font-black uppercase tracking-widest">
                                                    <th className="px-6 py-4">Product / Variant</th>
                                                    <th className="px-6 py-4">Price</th>
                                                    <th className="px-6 py-4 w-24">Qty</th>
                                                    <th className="px-6 py-4 text-right">Total</th>
                                                    <th className="px-6 py-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {formData.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-14 w-14 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 shrink-0">
                                                                    {item.image ? (
                                                                        <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                                                    ) : (
                                                                        <FiPackage className="text-gray-300" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800 leading-tight">{item.name}</p>
                                                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider mt-0.5">
                                                                        {item.item_type === "combo" ? "Combo" : `${item.variant_color} • ${item.variant_size}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold text-gray-400">₹{item.price.toLocaleString()}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                max={item.item_type === "combo" && item.maximum_order_quantity ? item.maximum_order_quantity : undefined}
                                                                min={item.item_type === "combo" ? item.minimum_order_quantity || 1 : 1}
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                className="w-16 px-3 py-1 bg-gray-100 rounded-lg font-bold text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <p className="text-sm font-black text-slate-800">₹{item.total.toLocaleString()}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button onClick={() => handleRemoveItem(index)} className="text-red-300 hover:text-red-500">
                                                                <FiTrash2 />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Customer Details */
                        <div className="space-y-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7 animate-in slide-in-from-right-4 duration-500">

                            {/* User Selection */}
                            <div className="space-y-4 pb-6 border-b border-gray-50">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black italic text-blue-600 uppercase tracking-widest ml-1">Order For *</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsGuest(true);
                                                setFormData(prev => ({
                                                    ...prev, user_id: "", customer_name: "", customer_phone: "", customer_email: "", street_address: "", city: "", district: "", state: "", zip_code: "", country: "India"
                                                }));
                                                setUserSearchTerm("");
                                            }}
                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${isGuest ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                        >Guest Customer</button>
                                        <button
                                            type="button"
                                            onClick={() => setIsGuest(false)}
                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${!isGuest ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                        >Registered Customer</button>
                                    </div>
                                </div>

                                {!isGuest && (
                                    <div className="relative mt-4">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <FiSearch className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search registered users by name, email or phone..."
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                        />
                                        {userSearchTerm && filteredUsers.length > 0 && (
                                            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                                {filteredUsers.map(user => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => handleSelectUser(user)}
                                                        className="w-full text-left px-5 py-3 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0 transition-colors"
                                                    >
                                                        <span className="font-black text-sm text-slate-800">{user.name || user.username}</span>
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            <span>{user.phone}</span>
                                                            {user.email && <span>• {user.email}</span>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FiUser className="text-blue-500" /> Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full name"
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FiUser className="text-blue-500" /> Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contact number"
                                        value={formData.customer_phone}
                                        onChange={(e) => setFormData(p => ({ ...p, customer_phone: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                    />
                                </div>
                            </div>
                            {/* Order Time Selection */}

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FiUser className="text-blue-500" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="Optional email"
                                    value={formData.customer_email}
                                    onChange={(e) => setFormData(p => ({ ...p, customer_email: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FiMapPin className="text-blue-500" /> Shipping Details *
                                </label>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Street Address / Area / Landmark"
                                        value={formData.street_address}
                                        onChange={(e) => setFormData(p => ({ ...p, street_address: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="District"
                                            value={formData.district}
                                            onChange={(e) => setFormData(p => ({ ...p, district: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={formData.state}
                                            onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Zip Code"
                                            value={formData.zip_code}
                                            onChange={(e) => setFormData(p => ({ ...p, zip_code: e.target.value }))}
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 font-bold transition-all shadow-inner outline-none"
                                        />
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Country"
                                        value={formData.country}
                                        onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Payment & Order Type</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Order Type</label>
                                        <div className="w-full px-4 py-3 bg-purple-50 border border-[#4b0b78] rounded-lg font-bold text-[#4b0b78]">Shop Order</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Payment Type</label>
                                        <select
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData(p => ({ ...p, payment_method: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Card">Card</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Order Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-[#4b0b78] font-medium transition-all outline-none"
                                    >
                                        <option value="Order Placed">Order Placed</option>
                                        <option value="Packing">Packing</option>
                                        <option value="Shipping">Shipping</option>
                                        <option value="Out for Delivery">Out for Delivery</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-6">
                    <div className="sticky top-6 rounded-3xl bg-gradient-to-br from-[#260642] via-[#3b0963] to-[#5b1389] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-7">
                        <div className="mb-6 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">Billing overview</p>
                                <h3 className="mt-1 text-xl font-bold">Order Summary</h3>
                            </div>
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">{formData.items.length} {formData.items.length === 1 ? "item" : "items"}</span>
                        </div>

                        <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
                            <div className="flex justify-between text-sm opacity-60 font-bold">
                                <span>Total Items</span>
                                <span>{formData.items.length}</span>
                            </div>
                            <div className="flex justify-between text-sm opacity-60 font-bold">
                                <span>Subtotal</span>
                                <span>₹{formData.total_amount.toLocaleString()}</span>
                            </div>
                        </div>

                        {formData.items.length > 0 && (
                            <div className="mb-6 max-h-56 space-y-3 overflow-y-auto pr-1">
                                {formData.items.map((item, index) => (
                                    <div key={`${item.combo_id || item.product_id}-${item.variant_color}-${item.variant_size}-${index}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-2.5">
                                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/10">
                                            {item.image ? (
                                                <img src={resolveImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                                            ) : <div className="flex h-full items-center justify-center text-white/50"><FiPackage /></div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold">{item.name}</p>
                                            <p className="mt-0.5 truncate text-[10px] text-violet-200">{item.item_type === "combo" ? "Combo" : `${item.variant_color} · ${item.variant_size}`} · Qty {item.quantity}</p>
                                        </div>
                                        <p className="shrink-0 text-xs font-bold">₹{item.total.toLocaleString("en-IN")}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 mb-2">Grand Total</p>
                            <h2 className="text-4xl font-black tracking-tight">₹{formData.total_amount.toLocaleString("en-IN")}</h2>
                        </div>

                        {step === 1 ? (
                            <button
                                onClick={() => {
                                    if (formData.items.length === 0) return toast.error("Please add products first");
                                    setStep(2);
                                }}
                                className="w-full flex items-center justify-center gap-3 bg-white text-[#4b0b78] hover:bg-purple-100 py-4 rounded-xl text-sm font-black transition-all active:scale-[0.99] group shadow-lg shadow-black/10"
                            >
                                <span>Next Details</span>
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-white text-[#4b0b78] hover:bg-purple-100 py-4 rounded-xl text-base font-black transition-all active:scale-[0.99] shadow-xl shadow-purple-900/20"
                                >
                                    {loading ? <div className="w-6 h-6 border-2 border-t-white rounded-full animate-spin"></div> : (
                                        <>
                                            <FiCheckCircle />
                                            <span>Create Shop Order</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full text-center py-2 text-xs font-black text-white/30 hover:text-white transition-colors"
                                >
                                    Go Back to Edit Items
                                </button>
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div>
    );
};

export default CreateOrder;
