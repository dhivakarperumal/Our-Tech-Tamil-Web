import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    FiArrowLeft,
    FiSave,
    FiBox,
    FiLayers,
    FiImage,
    FiUploadCloud,
    FiTrash2,
    FiInfo,
    FiPlus,
    FiPercent,
    FiActivity,
    FiHash,
    FiEdit2,
    FiX,
    FiChevronDown,
    FiCheck
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import imageCompression from "browser-image-compression";

const CATEGORY_TYPES = [
    "Gadgets & Electronics",
    "Natural Products",
    "Clothing & Fashion",
];
// Helper: Color to Name Utility
const productColors = [
    { name: "Pure Red", hex: "#FF0000" },
    { name: "Crimson", hex: "#DC143C" },
    { name: "Deep Maroon", hex: "#800000" },
    { name: "Rose Pink", hex: "#FFC0CB" },
    { name: "Hot Pink", hex: "#FF69B4" },
    { name: "Magenta", hex: "#FF00FF" },
    { name: "Royal Purple", hex: "#800080" },
    { name: "Violet", hex: "#EE82EE" },
    { name: "Indigo", hex: "#4B0082" },
    { name: "Navy Blue", hex: "#000080" },
    { name: "Royal Blue", hex: "#4169E1" },
    { name: "Sky Blue", hex: "#87CEEB" },
    { name: "Teal", hex: "#008080" },
    { name: "Cyan", hex: "#00FFFF" },
    { name: "Emerald Green", hex: "#50C878" },
    { name: "Forest Green", hex: "#228B22" },
    { name: "Olive Green", hex: "#808000" },
    { name: "Lime Green", hex: "#32CD32" },
    { name: "Golden Yellow", hex: "#FFD700" },
    { name: "Mustard", hex: "#FFDB58" },
    { name: "Bright Orange", hex: "#FFA500" },
    { name: "Coral", hex: "#FF7F50" },
    { name: "Peach", hex: "#FFDAB9" },
    { name: "Beige", hex: "#F5F5DC" },
    { name: "Cream", hex: "#FFFDD0" },
    { name: "Pure White", hex: "#FFFFFF" },
    { name: "Jet Black", hex: "#000000" },
    { name: "Steel Grey", hex: "#808080" },
    { name: "Silver Tone", hex: "#C0C0C0" },
    { name: "Chocolate Brown", hex: "#8B4513" },
    { name: "Copper", hex: "#B87333" },
    { name: "Terracotta", hex: "#E2725B" },
    { name: "Turquoise", hex: "#40E0D0" }
];

const getNearestColorName = (hex) => {
    hex = hex.replace("#", "");
    const r1 = parseInt(hex.substring(0, 2), 16);
    const g1 = parseInt(hex.substring(2, 4), 16);
    const b1 = parseInt(hex.substring(4, 6), 16);

    let minDistance = Infinity;
    let nearestName = "Custom Shade";

    productColors.forEach(color => {
        const h = color.hex.replace("#", "");
        const r2 = parseInt(h.substring(0, 2), 16);
        const g2 = parseInt(h.substring(2, 4), 16);
        const b2 = parseInt(h.substring(4, 6), 16);

        const distance = Math.sqrt(
            Math.pow(r2 - r1, 2) +
            Math.pow(g2 - g1, 2) +
            Math.pow(b2 - b1, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestName = color.name;
        }
    });

    return nearestName;
};

const resolveImageUrl = (image) => {
    if (!image || typeof image !== "string") return "";
    if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) return image;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const cleanPath = image.replace(/\\/g, "/");
    return `${backendUrl}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

const createSlug = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CustomDropdown = ({ name, value, options, placeholder, onChange, disabled = false, required = false, ariaLabel, validationField, invalid = false, className = "" }) => {
    const dropdownId = useId();
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [menuPosition, setMenuPosition] = useState(null);
    const normalizedOptions = options.map(option => typeof option === "string"
        ? { value: option, label: option }
        : option);
    const selectedOption = normalizedOptions.find(option => String(option.value) === String(value));

    const updateMenuPosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;
        const openBelow = spaceBelow >= Math.min(240, normalizedOptions.length * 40 + 8) || spaceBelow >= spaceAbove;
        const availableHeight = Math.max(100, Math.min(260, openBelow ? spaceBelow : spaceAbove));
        setMenuPosition({
            left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
            top: openBelow ? rect.bottom + 6 : Math.max(8, rect.top - availableHeight - 6),
            width: rect.width,
            maxHeight: availableHeight,
        });
    }, [normalizedOptions.length]);

    useEffect(() => {
        if (!isOpen) return undefined;
        updateMenuPosition();
        const handleOutsidePointer = (event) => {
            if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleViewportChange = () => updateMenuPosition();
        document.addEventListener("pointerdown", handleOutsidePointer);
        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);
        return () => {
            document.removeEventListener("pointerdown", handleOutsidePointer);
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
        };
    }, [isOpen, updateMenuPosition]);

    useEffect(() => {
        if (!isOpen || activeIndex < 0) return;
        menuRef.current?.querySelector(`[data-option-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, isOpen]);

    const openMenu = (initialIndex) => {
        if (disabled || !normalizedOptions.length) return;
        const selectedIndex = normalizedOptions.findIndex(option => String(option.value) === String(value));
        setActiveIndex(initialIndex ?? (selectedIndex >= 0 ? selectedIndex : 0));
        setIsOpen(true);
    };

    const chooseOption = (option) => {
        onChange({ target: { name, value: option.value } });
        setIsOpen(false);
    };

    const handleKeyDown = (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) {
                openMenu();
                return;
            }
            const direction = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex(index => (index + direction + normalizedOptions.length) % normalizedOptions.length);
        } else if (event.key === "Home" && isOpen) {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === "End" && isOpen) {
            event.preventDefault();
            setActiveIndex(normalizedOptions.length - 1);
        } else if ((event.key === "Enter" || event.key === " ") && isOpen) {
            event.preventDefault();
            if (normalizedOptions[activeIndex]) chooseOption(normalizedOptions[activeIndex]);
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
                name={name}
                role="combobox"
                aria-label={ariaLabel}
                aria-required={required || undefined}
                aria-invalid={invalid || undefined}
                data-validation-field={validationField}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={`${dropdownId}-listbox`}
                aria-activedescendant={isOpen ? `${dropdownId}-option-${activeIndex}` : undefined}
                disabled={disabled}
                onClick={() => isOpen ? setIsOpen(false) : openMenu()}
                onKeyDown={handleKeyDown}
                className={`product-dropdown-trigger group flex w-full items-center justify-between gap-3 rounded-xl border ${invalid ? "border-red-400 bg-red-50/40" : "border-gray-200 bg-white"} px-3.5 py-2.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50/30 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            >
                <span className={`min-w-0 truncate ${selectedOption ? "" : "font-medium text-gray-400"}`}>
                    {selectedOption?.label ?? placeholder}
                </span>
                <FiChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:text-violet-700 ${isOpen ? "rotate-180 text-violet-700" : ""}`} />
            </button>
            {isOpen && menuPosition && createPortal(
                <div
                    ref={menuRef}
                    id={`${dropdownId}-listbox`}
                    role="listbox"
                    aria-label={placeholder || "Options"}
                    className="product-dropdown-menu fixed z-[9999] overflow-y-auto rounded-xl border border-violet-100 bg-white p-1.5 shadow-[0_16px_40px_rgba(31,10,60,0.18)]"
                    style={menuPosition}
                >
                    {normalizedOptions.map((option, index) => {
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
                                onClick={() => chooseOption(option)}
                                className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${selected ? "bg-violet-50 font-bold text-[#3D01B1]" : "font-medium text-gray-700"} ${active ? "bg-violet-100 text-[#1F0A3C]" : "hover:bg-violet-50"}`}
                            >
                                <span className="min-w-0 truncate">{option.label}</span>
                                {selected && <FiCheck className="h-4 w-4 shrink-0 text-violet-700" />}
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};

const toDateInputValue = (value) => {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
};

const AddProducts = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [pendingUploads, setPendingUploads] = useState(0);
    const [editingSpecificationIndex, setEditingSpecificationIndex] = useState(null);
    const [specificationDraft, setSpecificationDraft] = useState({ key: "", value: "" });
    const [validationErrors, setValidationErrors] = useState({});

    // Main State
    const [formData, setFormData] = useState({
        name: "",
        product_code: "",
        slug: "",
        cat_type: "",
        description: "",
        category: "",
        subcategory: "",
        brand: "",
        model_number: "",
        mrp: "",
        offer: "",
        offer_price: "",
        total_stock: "0",
        unit: "Piece",
        stock_status: "Out of Stock",
        images: [],
        size_chart: "",
        video: "",
        warranty: "",
        return_policy: "",
        featured: false,
        trending: false,
        new_arrival: false,
        status: "Active",
        rating: "5",
        gender: "",
        material: "",
        wash_care: "Dry Clean Only",
        available_sizes: [],
        available_colors: [],
        pattern: "",
        fit_type: "",
        sleeve_type: "",
        neck_type: "",
        connectivity: "",
        weight: "",
        dimensions: "",
        power_battery: "",
        specifications: [],
        natural_product_type: "",
        ingredients: "",
        net_quantity: "",
        quantity_unit: "g",
        manufacturing_date: "",
        expiry_date: "",
        shelf_life: "",
        organic_certification: "",
        storage_instructions: "",
        country_of_origin: "",
    });

    const [variants, setVariants] = useState([]);
    const categoryTypes = CATEGORY_TYPES;
    const categoriesForType = categories.filter(cat =>
        (cat.categoryType || cat.category_type || "General") === formData.cat_type
    );
    const selectedCategory = categories.find(cat => cat.name === formData.category);
    const isClothingCategory = /clothing|apparel|fashion|garment|textile|ethnic wear|traditional wear|footwear/i
        .test(`${formData.cat_type} ${selectedCategory?.name || ""}`);
    const isGadgetCategory = /gadget|electronic/i.test(`${formData.cat_type} ${selectedCategory?.name || ""}`);
    const isNaturalCategory = /natural/i.test(`${formData.cat_type} ${selectedCategory?.name || ""}`);
    const usesSideBySideProductLayout = isClothingCategory || isGadgetCategory;
    const isFootwearCategory = /footwear/i.test(`${formData.cat_type} ${selectedCategory?.name || ""}`);
    const isFreeSizeCategory = /free size|one size|material/i.test(selectedCategory?.name || "");
    const sizeOptions = !isClothingCategory
        ? []
        : isFreeSizeCategory
            ? ["Free Size"]
            : isFootwearCategory
                ? ["5", "6", "7", "8", "9", "10", "11", "12"]
                : ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

    // Track if total stock was manually edited
    const [isStockManuallyEdited, setIsStockManuallyEdited] = useState(false);

    // Calculate offer price from the manually entered MRP and discount percentage.
    useEffect(() => {
        const mrpValue = parseFloat(formData.mrp) || 0;
        const offerValue = Math.min(100, Math.max(0, parseFloat(formData.offer) || 0));
        const nextOfferPrice = mrpValue > 0
            ? (mrpValue * (1 - offerValue / 100)).toFixed(2)
            : "";
        setFormData(prev => prev.offer_price === nextOfferPrice
            ? prev
            : { ...prev, offer_price: nextOfferPrice });
    }, [formData.mrp, formData.offer]);

    // Keep total stock synchronized with color quantities or clothing size quantities.
    useEffect(() => {
        if (isStockManuallyEdited || !variants.length) return;
        const total = variants.reduce((sum, variant) => {
            const variantStock = isClothingCategory
                ? Object.values(variant.sizesStock || {}).reduce((sizeTotal, quantity) => sizeTotal + (Number.parseInt(quantity, 10) || 0), 0)
                : (Number.parseInt(variant.quantity, 10) || 0);
            return sum + variantStock;
        }, 0);
        setFormData(prev => prev.total_stock === String(total) ? prev : { ...prev, total_stock: String(total) });
    }, [variants, isStockManuallyEdited, isClothingCategory]);

    useEffect(() => {
        const quantity = Number.parseInt(formData.total_stock, 10) || 0;
        const stockStatus = quantity === 0 ? "Out of Stock" : quantity < 10 ? "Low Stock" : "In Stock";
        setFormData(prev => prev.stock_status === stockStatus ? prev : { ...prev, stock_status: stockStatus });
    }, [formData.total_stock]);

    useEffect(() => {
        const fetchEssentialData = async () => {
            try {
                if (isEdit) {
                    const [catRes, editRes] = await Promise.all([
                        api.get("/categories"),
                        api.get(`/products/${id}`)
                    ]);

                    const categoryList = Array.isArray(catRes.data) ? catRes.data : [];
                    const p = editRes.data;
                    const selectedCat = categoryList.find(cat => cat.name === p.category);
                    setCategories(categoryList);
                    setFormData({
                        name: p.name || "",
                        product_code: p.product_code || "",
                        slug: p.slug || createSlug(p.name || ""),
                        cat_type: p.cat_type || p.category_type || selectedCat?.categoryType || selectedCat?.category_type || "General",
                        description: p.description || "",
                        category: p.category || "",
                        subcategory: p.subcategory || "",
                        brand: p.brand || "",
                        model_number: p.model_number || "",
                        mrp: p.mrp?.toString() || "",
                        offer: p.offer?.toString() || "0",
                        offer_price: p.offer_price?.toString() || "",
                        total_stock: p.total_stock?.toString() || "0",
                        unit: p.unit || "Piece",
                        stock_status: p.stock_status || "Out of Stock",
                        images: Array.isArray(p.images) ? p.images : p.images ? JSON.parse(p.images) : [],
                        size_chart: p.size_chart || "",
                        video: p.video || "",
                        warranty: p.warranty || "",
                        return_policy: p.return_policy || "",
                        featured: Boolean(p.featured),
                        trending: Boolean(p.trending),
                        new_arrival: Boolean(p.new_arrival),
                        rating: p.rating?.toString() || "5",
                        status: p.status || "Active",
                        material: p.material || "",
                        wash_care: p.wash_care || "",
                        gender: p.gender || "",
                        available_sizes: Array.isArray(p.available_sizes) ? p.available_sizes : [],
                        available_colors: Array.isArray(p.available_colors) ? p.available_colors : [],
                        pattern: p.pattern || "",
                        fit_type: p.fit_type || "",
                        sleeve_type: p.sleeve_type || "",
                        neck_type: p.neck_type || "",
                        connectivity: p.connectivity || "",
                        weight: p.weight?.toString() || "",
                        dimensions: p.dimensions || "",
                        power_battery: p.power_battery || "",
                        specifications: Array.isArray(p.specifications) ? p.specifications : [],
                        natural_product_type: p.natural_product_type || "",
                        ingredients: p.ingredients || "",
                        net_quantity: p.net_quantity?.toString() || "",
                        quantity_unit: p.quantity_unit || "g",
                        manufacturing_date: toDateInputValue(p.manufacturing_date),
                        expiry_date: toDateInputValue(p.expiry_date),
                        shelf_life: p.shelf_life || "",
                        organic_certification: p.organic_certification || "",
                        storage_instructions: p.storage_instructions || "",
                        country_of_origin: p.country_of_origin || "",
                    });
                    const loadedVariants = Array.isArray(p.variants) ? p.variants : p.variants ? JSON.parse(p.variants) : [];
                    const loadedClothingCategory = /clothing|apparel|fashion|garment|textile|ethnic wear|traditional wear|footwear/i
                        .test(`${p.cat_type || p.category_type || selectedCat?.categoryType || selectedCat?.category_type || ""} ${p.category || ""}`);
                    const normalizedVariants = !loadedClothingCategory && loadedVariants.length > 0 &&
                        loadedVariants.every(variant => variant.quantity === undefined)
                        ? loadedVariants.map((variant, index) => ({
                            ...variant,
                            quantity: index === 0 ? Number.parseInt(p.total_stock, 10) || 0 : 0,
                        }))
                        : loadedVariants;
                    setVariants(normalizedVariants);
                    setIsStockManuallyEdited(false);
                    setFetching(false);
                } else {
                    const [catRes, codeRes] = await Promise.all([
                        api.get("/categories"),
                        api.get("/products/latest-code")
                    ]);

                    const categoryList = Array.isArray(catRes.data) ? catRes.data : [];
                    setCategories(categoryList);
                    setFormData(prev => ({
                        ...prev,
                        cat_type: "",
                        category: "",
                        subcategory: "",
                        product_code: codeRes.data.latestCode || "OTP0001"
                    }));
                    setVariants([]);
                    setFetching(false);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error(error.response?.data?.message || "Failed to load product form data.");
                setFetching(false);
            }
        };
        fetchEssentialData();
    }, [id, isEdit]);

    // Keep subcategory selection aligned with the selected category.
    useEffect(() => {
        const selectedCat = categories.find(c => c.name === formData.category);
        const options = Array.isArray(selectedCat?.subcategory) ? selectedCat.subcategory : [];
        setSubcategories(options);
        if (formData.subcategory && !options.includes(formData.subcategory)) {
            setFormData(prev => ({ ...prev, subcategory: "" }));
        }
    }, [formData.category, categories]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === "total_stock") setIsStockManuallyEdited(true);
        setValidationErrors(prev => {
            if (!prev[name] && !(name === "total_stock" && prev.color_stock)) return prev;
            const next = { ...prev };
            delete next[name];
            if (name === "total_stock") delete next.color_stock;
            return next;
        });
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === "name" ? { slug: createSlug(value) } : {}),
        }));
    };

    const handleOfferPercentageChange = (e) => {
        const input = e.target.value;
        const percentage = input === "" ? "" : String(Math.min(100, Math.max(0, Number(input) || 0)));
        setValidationErrors(prev => {
            if (!prev.offer) return prev;
            const next = { ...prev };
            delete next.offer;
            return next;
        });
        setFormData(prev => ({ ...prev, offer: percentage }));
    };

    const addSpecification = () => {
        setEditingSpecificationIndex("new");
        setSpecificationDraft({ key: "", value: "" });
    };

    const editSpecification = (index) => {
        setEditingSpecificationIndex(index);
        setSpecificationDraft({ ...formData.specifications[index] });
    };

    const saveSpecification = () => {
        const key = specificationDraft.key.trim();
        const value = specificationDraft.value.trim();
        if (!key || !value) {
            toast.error("Enter both a specification title and answer.");
            return;
        }
        if (key.length > 100 || value.length > 500) {
            toast.error("Specification titles must be 100 characters or fewer and answers 500 characters or fewer.");
            return;
        }

        setFormData(prev => ({
            ...prev,
            specifications: editingSpecificationIndex === "new"
                ? [...prev.specifications, { key, value }]
                : prev.specifications.map((specification, index) =>
                    index === editingSpecificationIndex ? { key, value } : specification,
                ),
        }));
        setEditingSpecificationIndex(null);
        setSpecificationDraft({ key: "", value: "" });
    };

    const cancelSpecificationEdit = () => {
        setEditingSpecificationIndex(null);
        setSpecificationDraft({ key: "", value: "" });
    };

    const removeSpecification = (index) => {
        cancelSpecificationEdit();
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const handleCategoryTypeChange = (e) => {
        const catType = e.target.value;
        setValidationErrors(prev => {
            const next = { ...prev };
            delete next.cat_type;
            delete next.category;
            delete next.subcategory;
            return next;
        });
        setFormData(prev => ({
            ...prev,
            cat_type: catType,
            category: "",
            subcategory: "",
            total_stock: "0",
            size_chart: "",
        }));
        setVariants([]);
        setIsStockManuallyEdited(false);
    };

    const handleCategoryChange = (e) => {
        setValidationErrors(prev => {
            const next = { ...prev };
            delete next.category;
            delete next.subcategory;
            return next;
        });
        setFormData(prev => ({
            ...prev,
            category: e.target.value,
            subcategory: "",
            total_stock: "0",
        }));
        setVariants([]);
        setIsStockManuallyEdited(false);
    };

    useEffect(() => {
        if (variants.length === 0) {
            const initialVariant = {
                color: "#3D01B1",
                colorName: "Purple",
                images: [],
                ...(!isClothingCategory ? { quantity: Number.parseInt(formData.total_stock, 10) || 0 } : {}),
                selectedSizes: sizeOptions.length === 1 ? [sizeOptions[0]] : [],
                sizesStock: sizeOptions.length === 1 ? { [sizeOptions[0]]: 0 } : {},
            };
            setVariants([initialVariant]);
        }
    }, [isClothingCategory, variants.length, sizeOptions.length, formData.total_stock]);

    // Reset stock to auto-calculate
    const resetStockCalculation = () => {
        setIsStockManuallyEdited(false);
    };

    // Variant Operations
    const addVariant = () => {
        const sizes = sizeOptions;
        const nextColor = productColors.find(color =>
            !variants.some(variant => variant.color?.toLowerCase() === color.hex.toLowerCase())
        ) || productColors[0];
        const initialVariant = {
            color: nextColor.hex,
            colorName: nextColor.name,
            images: [],
            ...(!isClothingCategory ? { quantity: 0 } : {}),
            selectedSizes: sizes.length === 1 ? [sizes[0]] : [],
            sizesStock: sizes.length === 1 ? { [sizes[0]]: 0 } : {}
        };
        setVariants([...variants, initialVariant]);
        setIsStockManuallyEdited(false);
        setValidationErrors(prev => {
            const next = { ...prev };
            delete next.color_stock;
            return next;
        });
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
        setIsStockManuallyEdited(false);
        setValidationErrors(prev => {
            if (!prev.color_stock) return prev;
            const next = { ...prev };
            delete next.color_stock;
            return next;
        });
    };

    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        const newVariant = { ...updated[index], [field]: value };

        // Auto-set colorName if color is updated
        if (field === "color") {
            newVariant.colorName = getNearestColorName(value);
        }

        updated[index] = newVariant;
        setVariants(updated);
        setValidationErrors(prev => {
            if (!prev.color_stock) return prev;
            const next = { ...prev };
            delete next.color_stock;
            return next;
        });
    };

    const toggleSize = (vIndex, size) => {
        const updated = [...variants];
        const selected = updated[vIndex].selectedSizes || [];
        if (selected.includes(size)) {
            updated[vIndex].selectedSizes = selected.filter(s => s !== size);
            delete updated[vIndex].sizesStock[size];
        } else {
            updated[vIndex].selectedSizes = [...selected, size];
            if (!updated[vIndex].sizesStock) updated[vIndex].sizesStock = {};
            updated[vIndex].sizesStock[size] = 0; // Default stock 0
        }
        setVariants(updated);
        setIsStockManuallyEdited(false);
        setValidationErrors(prev => {
            if (!prev.color_stock) return prev;
            const next = { ...prev };
            delete next.color_stock;
            return next;
        });
    };

    const handleStockChange = (vIndex, size, value) => {
        const updated = [...variants];
        if (!updated[vIndex].sizesStock) updated[vIndex].sizesStock = {};
        updated[vIndex].sizesStock[size] = Math.max(0, parseInt(value, 10) || 0);
        setVariants(updated);
        setIsStockManuallyEdited(false);
        setValidationErrors(prev => {
            if (!prev.color_stock) return prev;
            const next = { ...prev };
            delete next.color_stock;
            return next;
        });
    };

    const handleColorStockChange = (vIndex, value) => {
        const updated = [...variants];
        updated[vIndex] = { ...updated[vIndex], quantity: Math.max(0, Number.parseInt(value, 10) || 0) };
        setVariants(updated);
        setIsStockManuallyEdited(false);
        setValidationErrors(prev => {
            if (!prev.color_stock) return prev;
            const next = { ...prev };
            delete next.color_stock;
            return next;
        });
    };

    const handleProductImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        if (formData.images.length + files.length > 10) {
            toast.error("Add up to 10 product images.");
            return;
        }

        const uploadData = new FormData();
        setPendingUploads(count => count + 1);
        try {
            const compressedFiles = await Promise.all(files.map(file => imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1600,
            })));
            compressedFiles.forEach(file => uploadData.append("images", file));
            const response = await api.post("/products/upload", uploadData);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...response.data.images] }));
            setValidationErrors(prev => {
                const next = { ...prev };
                delete next.product_image;
                return next;
            });
            toast.success("Product images uploaded.");
        } catch (error) {
            console.error("Product image upload error:", error);
            toast.error(error.response?.data?.message || "Product image upload failed.");
        } finally {
            setPendingUploads(count => Math.max(0, count - 1));
        }
    };

    const handleProductVideoUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append("video", file);
        setPendingUploads(count => count + 1);
        try {
            const response = await api.post("/products/upload", uploadData);
            setFormData(prev => ({ ...prev, video: response.data.video }));
            toast.success("Product video uploaded.");
        } catch (error) {
            console.error("Product video upload error:", error);
            toast.error(error.response?.data?.message || "Product video upload failed.");
        } finally {
            setPendingUploads(count => Math.max(0, count - 1));
        }
    };

    const handleSizeChartUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Choose an image file for the size chart.");
            return;
        }

        const uploadData = new FormData();
        setPendingUploads(count => count + 1);
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 2000,
            });
            uploadData.append("size_chart", compressed);
            const response = await api.post("/products/upload", uploadData);
            if (!response.data?.size_chart) {
                throw new Error("The size chart image was not returned by the server.");
            }
            setFormData(prev => ({ ...prev, size_chart: response.data.size_chart }));
            toast.success("Size chart uploaded.");
        } catch (error) {
            console.error("Size chart upload error:", error);
            toast.error(error.response?.data?.message || error.message || "Size chart upload failed.");
        } finally {
            setPendingUploads(count => Math.max(0, count - 1));
        }
    };

    const removeProductImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleVariantImageUpload = async (vIndex, e) => {
        try {
            const files = Array.from(e.target.files || []);

            if (!files.length) return;
            e.target.value = "";

            if ((variants[vIndex].images?.length || 0) + files.length > 5) {
                toast.error("Add up to 5 images per color.");
                return;
            }

            setPendingUploads(count => count + 1);
            const formData = new FormData();
            const compressedFiles = await Promise.all(files.map(file => imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1600,
            })));
            compressedFiles.forEach(file => formData.append("images", file));

            const response = await api.post("/products/upload", formData);

            const uploadedImages = response.data?.images || [];
            if (!uploadedImages.length) {
                toast.error("No images were saved.");
                return;
            }

            setVariants(prev => prev.map((variant, index) => (
                index === vIndex
                    ? { ...variant, images: [...(variant.images || []), ...uploadedImages] }
                    : variant
            )));
            setValidationErrors(prev => {
                const next = { ...prev };
                delete next.product_image;
                return next;
            });
            toast.success(`${uploadedImages.length} color images uploaded.`);
        } catch (error) {
            console.error("Product image upload error:", error);
            toast.error(error.response?.data?.message || "Upload failed.");
        } finally {
            setPendingUploads(count => Math.max(0, count - 1));
        }
    };

    const removeVariantImage = (vIndex, imgIndex) => {
        setVariants(prev => prev.map((variant, index) => (
            index === vIndex
                ? { ...variant, images: (variant.images || []).filter((_, imageIndex) => imageIndex !== imgIndex) }
                : variant
        )));
    };

    const renderFieldError = (field) => validationErrors[field] ? (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{validationErrors[field]}</p>
    ) : null;

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (editingSpecificationIndex !== null) {
            toast.error("Save or cancel the specification you are editing before submitting.");
            return;
        }
        if (pendingUploads > 0) {
            toast.error("Wait for product media uploads to finish.");
            return;
        }

        const errors = {};
        if (!formData.name.trim()) errors.name = "Product name is required.";
        if (!formData.product_code.trim() || !formData.slug.trim()) {
            errors.sku = "The generated SKU is missing. Refresh the form and try again.";
        }
        if (!formData.cat_type) errors.cat_type = "Select a category type.";
        if (!formData.category) errors.category = "Select a category.";
        if (!formData.subcategory) errors.subcategory = subcategories.length
            ? "Select a subcategory."
            : "No subcategory is available. Add one to this category first.";
        if (!String(formData.rating).trim() || !Number.isFinite(Number(formData.rating)) ||
            Number(formData.rating) < 1 || Number(formData.rating) > 5) {
            errors.rating = "Select a rating.";
        }
        if (!formData.description.trim()) errors.description = "Full description is required.";

        const mrp = Number(formData.mrp);
        if (!String(formData.mrp).trim() || !Number.isFinite(mrp) || mrp <= 0) {
            errors.mrp = "Enter an MRP greater than zero.";
        }
        const offer = Number(formData.offer);
        if (!String(formData.offer).trim() || !Number.isFinite(offer) || offer < 0 || offer > 100) {
            errors.offer = "Enter an offer percentage from 0 to 100.";
        }

        const hasProductImage = isNaturalCategory
            ? formData.images.length > 0
            : formData.images.length > 0 || variants.some(variant => variant.images?.length > 0);
        if (!hasProductImage) errors.product_image = "Upload at least one product image.";

        const stockQuantity = Number(formData.total_stock);
        const invalidTotalStock = !String(formData.total_stock).trim() ||
            !Number.isInteger(stockQuantity) || stockQuantity < 0;
        const invalidVariantStock = !isNaturalCategory && (
            !variants.length || variants.some(variant => {
                if (!variant.colorName?.trim() || !/^#[0-9a-f]{6}$/i.test(variant.color || "")) return true;
                if (isClothingCategory) {
                    return !variant.selectedSizes?.length || variant.selectedSizes.some(size => {
                        const quantity = Number(variant.sizesStock?.[size]);
                        return !Number.isInteger(quantity) || quantity < 0;
                    });
                }
                const quantity = Number(variant.quantity);
                return !Number.isInteger(quantity) || quantity < 0;
            })
        );
        if (invalidTotalStock || invalidVariantStock) {
            errors.color_stock = isClothingCategory
                ? "Add a color, select at least one size, and enter a valid stock quantity for each size."
                : "Add a color and enter a valid non-negative stock quantity.";
        }

        if (Object.keys(errors).length) {
            setValidationErrors(errors);
            const firstInvalidField = Object.keys(errors)[0];
            requestAnimationFrame(() => {
                const invalidElement = document.querySelector(`[data-validation-field="${firstInvalidField}"]`);
                invalidElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                invalidElement?.focus({ preventScroll: true });
            });
            toast.error("Please complete all required fields before saving.");
            return;
        }
        setValidationErrors({});
        if (Number(formData.offer_price) > Number(formData.mrp)) {
            toast.error("Offer price cannot be greater than MRP.");
            return;
        }
        if (formData.manufacturing_date && formData.expiry_date &&
            formData.expiry_date < formData.manufacturing_date) {
            toast.error("Expiry date cannot be before manufacturing date.");
            return;
        }
        setLoading(true);
        try {
            const activeVariants = variants;
            const variantStockTotal = activeVariants.reduce(
                (total, variant) => total + (isClothingCategory
                    ? Object.values(variant.sizesStock || {}).reduce(
                        (stockTotal, quantity) => stockTotal + (parseInt(quantity, 10) || 0),
                        0,
                    )
                    : Number.parseInt(variant.quantity, 10) || 0),
                0,
            );
            const hasVariantStock = activeVariants.length > 0;
            const finalTotalStock = isStockManuallyEdited
                ? parseInt(formData.total_stock, 10) || 0
                : hasVariantStock
                    ? variantStockTotal
                    : parseInt(formData.total_stock, 10) || 0;
            const finalData = {
                ...formData,
                slug: createSlug(formData.slug),
                total_stock: finalTotalStock.toString(),
                variants: activeVariants,
            };
            if (isEdit) {
                await api.put(`/products/${id}`, finalData);
                toast.success("Product updated successfully.");
            } else {
                await api.post("/products", finalData);
                toast.success("Product created successfully.");
            }
            setTimeout(() => navigate("/admin/products/all"), 1500);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(error.response?.data?.message || "Operation failed.");
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1F0A3C]/20 border-t-[#1F0A3C] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-semibold">Loading...</p>
        </div>
    );
    return (
        <div className="product-editor-page space-y-6 rounded-[1.75rem] p-4 pb-24 md:p-6">

            <header className="product-editor-heading relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#86198f] text-white">
                <div className="relative flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                        >
                            <FiArrowLeft size={18} />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Inventory management</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{isEdit ? "Edit Product" : "Add New Product"}</h1>
                            <p className="mt-1 text-sm text-violet-100/80">Build a complete product listing, from details to stock.</p>
                        </div>
                    </div>
                    <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white">
                        <span className={`h-2 w-2 rounded-full ${formData.status === "Active" ? "bg-emerald-300" : "bg-gray-300"}`} />
                        {formData.status === "Active" ? "Active listing" : "Inactive listing"}
                    </span>
                </div>
            </header>

            <section aria-label="Product setup steps" className="grid gap-3 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm sm:grid-cols-3 sm:p-4">
                {[
                    { number: "01", title: "Product foundation", detail: "Name, category & visibility", icon: FiLayers },
                    { number: "02", title: "Media & variants", detail: "Images, color & availability", icon: FiImage },
                    { number: "03", title: "Pricing & stock", detail: "Set price and inventory", icon: FaRupeeSign },
                ].map(({ number, title, detail, icon: StepIcon }) => (
                    <div key={number} className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-800 to-fuchsia-700 text-white shadow-sm">
                            <StepIcon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-slate-800">{title}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-slate-500">{detail}</span>
                        </span>
                        <span className="text-[10px] font-black tracking-wider text-violet-400">{number}</span>
                    </div>
                ))}
            </section>

            <form noValidate onSubmit={handleSubmit} className="product-editor-form grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                {Object.keys(validationErrors).length > 0 && (
                    <div className="product-editor-alert lg:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5" role="alert" aria-live="polite">
                        <p className="text-sm font-bold text-red-800">A few details need your attention</p>
                        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-red-700">
                            {Object.values(validationErrors).map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
                        </ul>
                    </div>
                )}
                <div className={`space-y-5 lg:order-1 ${usesSideBySideProductLayout ? "lg:col-span-1" : "lg:col-span-2"}`}>
                    <div className={`grid grid-cols-1 gap-5 ${usesSideBySideProductLayout ? "lg:grid-cols-1" : "lg:grid-cols-2"}`}>
                    {/* Primary Categorization & Identity */}
                    <div className="product-editor-card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="product-editor-card-header flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3D01B1] to-[#1F0A3C] text-white shadow-sm"><FiLayers size={16} /></span>
                                <div data-validation-field="product_image" tabIndex={-1} className="rounded-xl outline-none">
                                    <h2 className="text-sm font-bold text-[#1F0A3C]">Product Foundation</h2>
                                    <p className="mt-0.5 text-[11px] text-gray-500">Identity, category and visibility</p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-100 bg-white px-3 py-2 shadow-sm">
                                <FiHash className="text-[#1F0A3C] w-3 h-3" />
                                <span className="text-xs font-bold tracking-wide text-[#1F0A3C]">{formData.product_code || 'Generating...'}</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Type *</label>
                                    <CustomDropdown
                                        name="cat_type"
                                        value={formData.cat_type}
                                        onChange={handleCategoryTypeChange}
                                        options={categoryTypes}
                                        placeholder="Select category type first"
                                        ariaLabel="Category type"
                                        validationField="cat_type"
                                        invalid={Boolean(validationErrors.cat_type)}
                                        required
                                    />
                                    {renderFieldError("cat_type")}
                                    {categoryTypes.length === 0 && <p className="text-xs text-amber-700">Create a category before adding products.</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Category *</label>
                                    <CustomDropdown
                                        name="category"
                                        value={formData.category}
                                        onChange={handleCategoryChange}
                                        options={categoriesForType.map(cat => ({ value: cat.name, label: cat.name }))}
                                        placeholder="Select category"
                                        ariaLabel="Category"
                                        validationField="category"
                                        invalid={Boolean(validationErrors.category)}
                                        required
                                        disabled={!formData.cat_type}
                                    />
                                    {renderFieldError("category")}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} data-validation-field="name" aria-invalid={Boolean(validationErrors.name)} placeholder="e.g. Wireless Noise-Cancelling Headphones" className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-semibold text-gray-800 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#1F0A3C]/10 ${validationErrors.name ? "border-red-400 bg-red-50/40" : "border-gray-200 bg-gray-50 focus:border-[#1F0A3C]/40"}`} required />
                                    {renderFieldError("name")}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Code / SKU *</label>
                                    <input type="text" name="product_code" value={formData.product_code} placeholder="Generating..." data-validation-field="sku" aria-invalid={Boolean(validationErrors.sku)} className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-semibold text-gray-500 ${validationErrors.sku ? "border-red-400 bg-red-50/40" : "border-gray-200 bg-gray-100"} cursor-not-allowed`} readOnly required />
                                    {renderFieldError("sku")}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategory *</label>
                                    <div data-validation-field="subcategory" tabIndex={-1} className="rounded-xl outline-none focus:ring-2 focus:ring-red-200">
                                    <CustomDropdown
                                        name="subcategory"
                                        value={formData.subcategory}
                                        onChange={handleFormChange}
                                        options={subcategories}
                                        placeholder="Select subcategory"
                                        ariaLabel="Subcategory"
                                        required
                                        disabled={!subcategories.length}
                                    />
                                    </div>
                                    {renderFieldError("subcategory")}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating *</label>
                                    <CustomDropdown
                                        name="rating"
                                        value={formData.rating}
                                        onChange={handleFormChange}
                                        options={[1, 2, 3, 4, 5].map(rating => ({ value: String(rating), label: `${rating} Star${rating > 1 ? "s" : ""}` }))}
                                        placeholder="Select rating"
                                        ariaLabel="Rating"
                                        validationField="rating"
                                        invalid={Boolean(validationErrors.rating)}
                                        required
                                    />
                                    {renderFieldError("rating")}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                                    <span className="shrink-0 text-sm font-semibold text-gray-700">Product Status</span>
                                    <CustomDropdown
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        options={["Active", "Inactive"]}
                                        placeholder="Select status"
                                        ariaLabel="Product status"
                                        className="min-w-0 max-w-[150px] py-2"
                                    />
                                </div>
                                {[
                                    ["featured", "Featured Product"],
                                    ["trending", "Trending Product"],
                                    ["new_arrival", "New Arrival"],
                                ].map(([field, label]) => (
                                    <label key={field} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700">
                                        <input type="checkbox" name={field} checked={formData[field]} onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.checked }))} className="rounded accent-[#3D01B1]" />
                                        {label}
                                    </label>
                                ))}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Description *</label>
                                <textarea name="description" value={formData.description} onChange={handleFormChange} data-validation-field="description" aria-invalid={Boolean(validationErrors.description)} required rows="5" placeholder="Describe product features, specifications, and what's included..." className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#1F0A3C]/10 resize-y ${validationErrors.description ? "border-red-400 bg-red-50/40" : "border-gray-200 bg-gray-50 focus:border-[#1F0A3C]/40"}`} />
                                {renderFieldError("description")}
                            </div>
                            {isClothingCategory && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Size Chart (optional)</label>
                                    {formData.size_chart ? (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <img
                                                src={resolveImageUrl(formData.size_chart)}
                                                alt="Clothing size chart"
                                                className="h-28 max-w-full rounded-lg border border-gray-200 object-contain"
                                            />
                                            <label className="admin-button-secondary cursor-pointer rounded-lg px-3 py-2 text-xs font-bold">
                                                Change Chart
                                                <input type="file" accept="image/*" onChange={handleSizeChartUpload} className="hidden" />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, size_chart: "" }))}
                                                className="admin-button-danger rounded-lg px-3 py-2 text-xs font-bold"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm font-semibold text-gray-500 hover:border-violet-400 hover:bg-violet-50">
                                            <FiUploadCloud size={20} className="mb-2 text-violet-500" />
                                            Upload clothing size chart
                                            <input type="file" accept="image/*" onChange={handleSizeChartUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Media */}
                    {!isClothingCategory && !isGadgetCategory && (
                    <div className="product-editor-card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="product-editor-card-header flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                            <span className="p-1.5 bg-[#1F0A3C] text-white rounded-lg"><FiImage size={15} /></span>
                            <h2 className="text-sm font-bold text-[#1F0A3C]">Product Images & Video</h2>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Images * (up to 10)</label>
                                        <p className="mt-1 text-[11px] text-slate-400">Add clear photos from multiple angles.</p>
                                    </div>
                                    {formData.images.length < 10 && (
                                        <label className="admin-button-secondary inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm transition hover:-translate-y-0.5">
                                            <FiPlus size={13} /> Add Images
                                            <input type="file" accept="image/*" multiple onChange={handleProductImageUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                {formData.images.length ? (
                                    <div className="product-editor-image-grid grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                                        {formData.images.map((image, index) => (
                                            <div key={`${image}-${index}`} className="product-editor-image-tile group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                                <img src={resolveImageUrl(image)} alt={`Product ${index + 1}`} className="h-full w-full object-cover" />
                                                <span className="absolute bottom-2 left-2 rounded-lg bg-slate-950/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">Image {index + 1}</span>
                                                <button type="button" onClick={() => removeProductImage(index)} aria-label={`Remove product image ${index + 1}`} className="admin-button-danger absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg p-1 opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100">
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <label className={`product-editor-image-drop flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${validationErrors.product_image ? "border-red-300 bg-red-50/40" : "border-slate-300 bg-gradient-to-b from-slate-50 to-white hover:border-violet-400 hover:from-violet-50/70 hover:to-white"}`}>
                                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100"><FiUploadCloud size={22} /></span>
                                        <span className="text-sm font-bold text-slate-800">Choose product images</span>
                                        <span className="mt-1 text-xs text-slate-500">PNG, JPG or WebP · Up to 10 images</span>
                                        <input type="file" accept="image/*" multiple onChange={handleProductImageUpload} className="sr-only" />
                                    </label>
                                )}
                                {renderFieldError("product_image")}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Video (optional)</label>
                                {formData.video ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <video src={resolveImageUrl(formData.video)} controls className="h-24 max-w-full rounded-lg bg-black" />
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, video: "" }))} className="admin-button-danger rounded-lg px-3 py-2 text-xs font-bold">Remove Video</button>
                                    </div>
                                ) : (
                                    <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleProductVideoUpload} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2 file:font-semibold file:text-violet-700 hover:file:bg-violet-100" />
                                )}
                            </div>
                        </div>
                        </div>
                        )}
                    </div>

                </div>

                <div className="space-y-5 lg:col-span-2 lg:order-3">
                    {/* Pricing & Stock */}
                    <div className="product-editor-card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="product-editor-card-header flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                            <span className="p-1.5 bg-[#1F0A3C] text-white rounded-lg"><FaRupeeSign size={15} /></span>
                            <h2 className="text-sm font-bold text-[#1F0A3C]">Pricing & Stock</h2>
                        </div>
                        <div className="p-5">
                            <div className={`grid grid-cols-2 gap-4 ${isNaturalCategory ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">MRP *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                                        <input type="number" name="mrp" min="0.01" step="0.01" value={formData.mrp} onChange={handleFormChange} data-validation-field="mrp" aria-invalid={Boolean(validationErrors.mrp)} className={`w-full rounded-lg border py-2.5 pl-7 pr-3 text-sm font-bold text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#1F0A3C]/10 ${validationErrors.mrp ? "border-red-400 bg-red-50/40" : "border-gray-200 bg-gray-50 focus:border-[#1F0A3C]/40"}`} required />
                                    </div>
                                    {renderFieldError("mrp")}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer (%) *</label>
                                    <div className="relative">
                                        <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 w-3.5 h-3.5" />
                                        <input type="number" name="offer" min="0" max="100" step="0.01" value={formData.offer} onChange={handleOfferPercentageChange} data-validation-field="offer" aria-invalid={Boolean(validationErrors.offer)} className={`w-full rounded-lg border py-2.5 pl-7 pr-3 text-sm font-bold outline-none focus:bg-white ${validationErrors.offer ? "border-red-400 bg-red-50/40 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700 focus:border-amber-400"}`} required />
                                    </div>
                                    {renderFieldError("offer")}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer Price · Auto</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">₹</span>
                                        <input type="number" name="offer_price" value={formData.offer_price} readOnly className="w-full pl-7 pr-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-700 cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                        Stock Quantity *
                                        {isStockManuallyEdited && !isClothingCategory && (
                                            <button onClick={resetStockCalculation} className="text-[9px] bg-[#1F0A3C]/10 text-[#1F0A3C] px-1.5 py-0.5 rounded hover:bg-[#1F0A3C] hover:text-white transition-colors uppercase tracking-widest">Auto</button>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <FiActivity className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isStockManuallyEdited ? 'text-amber-500' : 'text-[#1F0A3C]'}`} />
                                        <input type="number" name="total_stock" min="0" step="1" value={formData.total_stock} onChange={handleFormChange} data-validation-field={isNaturalCategory ? "color_stock" : undefined} aria-invalid={Boolean(isNaturalCategory && validationErrors.color_stock)} readOnly={isClothingCategory} required className={`w-full rounded-lg border py-2.5 pl-7 pr-3 text-sm font-bold outline-none transition-all ${validationErrors.color_stock && isNaturalCategory ? "border-red-400 bg-red-50/40 text-red-700" : isStockManuallyEdited ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-[#1F0A3C]/20 bg-[#1F0A3C]/5 text-[#1F0A3C]'} ${isClothingCategory ? "cursor-not-allowed" : ""}`} />
                                    </div>
                                    {isNaturalCategory && renderFieldError("color_stock")}
                                </div>
                                {isNaturalCategory && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</label>
                                        <CustomDropdown
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleFormChange}
                                            options={[
                                                "Piece", "Kilogram (kg)", "Gram (g)", "Litre (L)",
                                                "Millilitre (ml)", "Pack", "Bottle", "Box",
                                                ...(formData.unit && !["Piece", "Kilogram (kg)", "Gram (g)", "Litre (L)", "Millilitre (ml)", "Pack", "Bottle", "Box"].includes(formData.unit) ? [formData.unit] : []),
                                            ]}
                                            placeholder="Select unit"
                                            ariaLabel="Unit"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500">
                                <span>Stock Status:</span>
                                <span className={`rounded-full px-2.5 py-1 ${formData.stock_status === "In Stock" ? "bg-emerald-50 text-emerald-700" : formData.stock_status === "Low Stock" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                    {formData.stock_status}
                                </span>
                                {isClothingCategory && <span className="font-normal">Calculated from color and size quantities</span>}
                            </div>
                        </div>
                    </div>

                    {/* Product Specifications */}
                    <div className="product-editor-card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="product-editor-card-header flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-[#1F0A3C] text-white rounded-lg"><FiInfo size={15} /></span>
                                <h2 className="text-sm font-bold text-[#1F0A3C]">Specifications</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addSpecification}
                                disabled={editingSpecificationIndex !== null}
                                className="admin-button-secondary inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FiPlus size={14} /> Add More
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <span>Specification Title</span>
                                <span>Answer</span>
                                <span className="sr-only">Actions</span>
                            </div>
                            {formData.specifications.map((specification, index) => (
                                <div key={`${index}-${specification.key}`} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                                    {editingSpecificationIndex === index ? (
                                        <>
                                            <input
                                                type="text"
                                                value={specificationDraft.key}
                                                onChange={e => setSpecificationDraft(prev => ({ ...prev, key: e.target.value }))}
                                                placeholder="e.g. Brand"
                                                aria-label={`Specification ${index + 1} title`}
                                                maxLength={100}
                                                className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={specificationDraft.value}
                                                onChange={e => setSpecificationDraft(prev => ({ ...prev, value: e.target.value }))}
                                                placeholder="e.g. Samsung"
                                                aria-label={`Specification ${index + 1} answer`}
                                                maxLength={500}
                                                className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={saveSpecification} aria-label={`Save specification ${index + 1}`} className="admin-button-primary rounded-lg p-2.5">
                                                    <FiSave size={15} />
                                                </button>
                                                <button type="button" onClick={cancelSpecificationEdit} aria-label={`Cancel editing specification ${index + 1}`} className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 hover:bg-gray-100">
                                                    <FiX size={15} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="min-w-0 break-words text-sm font-semibold text-gray-800 md:px-3">{specification.key}</p>
                                            <p className="min-w-0 break-words text-sm text-gray-600 md:px-3">{specification.value}</p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => editSpecification(index)}
                                                    disabled={editingSpecificationIndex !== null}
                                                    aria-label={`Edit specification ${index + 1}`}
                                                    className="rounded-lg border border-gray-200 bg-white p-2.5 text-[#1F0A3C] hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <FiEdit2 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSpecification(index)}
                                                    disabled={editingSpecificationIndex !== null}
                                                    aria-label={`Delete specification ${index + 1}`}
                                                    className="admin-button-danger rounded-lg p-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <FiTrash2 size={15} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {editingSpecificationIndex === "new" && (
                                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
                                    <input
                                        type="text"
                                        value={specificationDraft.key}
                                        onChange={e => setSpecificationDraft(prev => ({ ...prev, key: e.target.value }))}
                                        placeholder="e.g. Brand"
                                        aria-label="New specification title"
                                        maxLength={100}
                                        className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={specificationDraft.value}
                                        onChange={e => setSpecificationDraft(prev => ({ ...prev, value: e.target.value }))}
                                        placeholder="e.g. Samsung"
                                        aria-label="New specification answer"
                                        maxLength={500}
                                        className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={saveSpecification} aria-label="Save new specification" className="admin-button-primary rounded-lg p-2.5">
                                            <FiSave size={15} />
                                        </button>
                                        <button type="button" onClick={cancelSpecificationEdit} aria-label="Cancel new specification" className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 hover:bg-gray-100">
                                            <FiX size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!formData.specifications.length && editingSpecificationIndex !== "new" && (
                                <p className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                                    No specifications added yet.
                                </p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Color and stock variants */}
                {!isNaturalCategory && (
                <div
                    data-validation-field="color_stock"
                    tabIndex={-1}
                    className={`space-y-4 rounded-2xl outline-none lg:order-2 ${usesSideBySideProductLayout ? "lg:col-span-1" : "lg:col-span-2"} ${validationErrors.color_stock ? "ring-2 ring-red-200 ring-offset-2" : ""}`}
                >
                    <div className="product-editor-card-header flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[#3D01B1]"><FiBox className="h-4 w-4" /></span>
                            <div>
                                <h3 className="text-sm font-bold text-[#1F0A3C]">{isClothingCategory ? "Color & Size Stock *" : "Color & Stock *"}</h3>
                                <p className="mt-0.5 text-[11px] text-gray-500">{variants.length} {variants.length === 1 ? "variant" : "variants"} · Add colors and manage availability</p>
                            </div>
                        </div>
                        <button type="button" onClick={addVariant} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1F0A3C] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#3D01B1] active:scale-95">
                            <FiPlus size={15} /> <span className="hidden sm:inline">Add color</span>
                        </button>
                    </div>

                    {variants.map((v, vIndex) => (
                        <div key={vIndex} className="product-editor-card group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                            <div className="product-editor-variant-header flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input
                                        type="color"
                                        value={v.color}
                                        onChange={(e) => handleVariantChange(vIndex, "color", e.target.value)}
                                        aria-label={`Choose color for variant ${vIndex + 1}`}
                                        className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border-2 border-white shadow ring-1 ring-gray-200"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <CustomDropdown
                                            value={v.colorName}
                                            onChange={(e) => {
                                                const selected = productColors.find(bc => bc.name === e.target.value);
                                                if (selected) {
                                                    handleVariantChange(vIndex, "color", selected.hex);
                                                    handleVariantChange(vIndex, "colorName", selected.name);
                                                } else {
                                                    handleVariantChange(vIndex, "colorName", e.target.value);
                                                }
                                            }}
                                            options={[
                                                { value: "", label: "Select Shade" },
                                                ...productColors.map(color => ({ value: color.name, label: color.name })),
                                                ...(v.colorName && !productColors.find(color => color.name === v.colorName) ? [{ value: v.colorName, label: v.colorName }] : []),
                                            ]}
                                            placeholder="Select Shade"
                                            ariaLabel={`Color name for variant ${vIndex + 1}`}
                                            required
                                            className="py-2 text-xs"
                                        />
                                        <p className="mt-1 ml-0.5 text-[10px] text-gray-500">Hex: <span className="font-semibold text-[#1F0A3C]">{v.color}</span></p>
                                    </div>
                                </div>
                                {variants.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(vIndex)}
                                        aria-label={`Remove ${v.colorName || `color ${vIndex + 1}`} variant`}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <FiTrash2 size={15} />
                                    </button>
                                )}
                            </div>

                                    <div className="space-y-4 p-4 sm:p-5">
                                        {/* Stock by Size */}
                                        <div className="product-editor-stock-panel space-y-3 rounded-xl border border-gray-100 bg-[#faf9fc] p-3.5 sm:p-4">
                                            {isClothingCategory ? (
                                                <>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Stock by size</p>
                                                        <p className="mt-1 text-[11px] text-gray-500">Choose sizes, then enter the available quantity.</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {sizeOptions.map(sz => (
                                                            <button key={sz} type="button" onClick={() => toggleSize(vIndex, sz)} className={`min-w-10 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${(v.selectedSizes || []).includes(sz) ? 'border-[#1F0A3C] bg-[#1F0A3C] text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-[#3D01B1]'}`}>{sz}</button>
                                                        ))}
                                                    </div>
                                                    {(v.selectedSizes || []).length > 0 && (
                                                        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                                                            {v.selectedSizes.map(sz => (
                                                                <label key={sz} className="flex items-center justify-between gap-2 rounded-lg border border-violet-100 bg-white px-3 py-2">
                                                                    <span className="text-xs font-bold text-[#1F0A3C]">{sz}</span>
                                                                    <input type="number" min="0" value={v.sizesStock?.[sz] ?? 0} onChange={(e) => handleStockChange(vIndex, sz, e.target.value)} aria-label={`${sz} size quantity`} className="w-16 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-right text-sm font-bold text-[#1F0A3C] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.65fr)] sm:items-end">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Stock quantity</p>
                                                        <p className="mt-1 text-[11px] text-gray-500">Units available in this color.</p>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={v.quantity ?? 0}
                                                            onChange={e => handleColorStockChange(vIndex, e.target.value)}
                                                            aria-label={`Stock quantity for ${v.colorName || `color ${vIndex + 1}`}`}
                                                            className="product-editor-quantity-input w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-base font-bold text-[#1F0A3C] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                        />
                                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">units</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Images */}
                                        <div data-validation-field="product_image" tabIndex={-1} className="space-y-3 rounded-xl outline-none">
                                            <div className="flex flex-wrap items-end justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Color images</p>
                                                    <p className="mt-1 text-[11px] text-gray-500">Upload up to 5 photos for this color.</p>
                                                </div>
                                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{(v.images || []).length}/5 added</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                {(v.images || []).slice(0, 5).map((img, iIndex) => (
                                                    <div key={`${img}-${iIndex}`} className="group/img relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                                        <img src={resolveImageUrl(img)} alt={`${v.colorName || "Color"} product view ${iIndex + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105" onError={(e) => { e.currentTarget.style.opacity = "0.35"; }} />
                                                        <button type="button" onClick={() => removeVariantImage(vIndex, iIndex)} aria-label={`Remove ${v.colorName || "color"} image ${iIndex + 1}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border border-white/70 bg-white/95 text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200">
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(v.images || []).length < 5 && (
                                                    <label className="product-editor-image-upload flex aspect-square w-full max-w-[208px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-4 text-center transition hover:border-violet-400 hover:bg-violet-50">
                                                        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"><FiUploadCloud size={20} /></span>
                                                        <span className="text-xs font-bold text-[#1F0A3C]">Add color photos</span>
                                                        <span className="mt-1 text-[10px] text-gray-500">JPG, PNG or WebP</span>
                                                        <input type="file" multiple className="sr-only" accept="image/*" onChange={(e) => handleVariantImageUpload(vIndex, e)} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                        </div>
                    ))}
                    {renderFieldError("product_image")}
                    {renderFieldError("color_stock")}
                </div>
                )}

                {/* Bottom Global Action Button */}
                <div className="product-editor-actions lg:col-span-2 lg:order-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-800">{isEdit ? "Ready to update this product?" : "Ready to publish this product?"}</p>
                            <p className="mt-0.5 text-xs text-slate-500">Your changes are saved when you submit this product.</p>
                        </div>
                        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                        <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || pendingUploads > 0}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#86198f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading || pendingUploads > 0 ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>{pendingUploads > 0 ? "Uploading media..." : "Saving..."}</span>
                                </div>
                            ) : (
                                <>
                                    <FiSave size={15} />
                                    <span>{isEdit ? 'Update Product' : 'Add Product'}</span>
                                </>
                            )}
                        </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddProducts;