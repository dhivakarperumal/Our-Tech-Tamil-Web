import React, { useState, useEffect } from "react";
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
    FiX
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
                    const initialTypeCategory = categoryList.find(cat =>
                        CATEGORY_TYPES.includes(cat.categoryType || cat.category_type)
                    );
                    const initialType = initialTypeCategory?.categoryType || initialTypeCategory?.category_type || "";
                    setCategories(categoryList);
                    setFormData(prev => ({
                        ...prev,
                        cat_type: initialTypeCategory ? initialType : "",
                        category: initialTypeCategory?.name || "",
                        subcategory: initialTypeCategory?.subcategory?.[0] || "",
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
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === "name" ? { slug: createSlug(value) } : {}),
        }));
    };

    const handleOfferPercentageChange = (e) => {
        const percentage = Math.min(100, Math.max(0, Number(e.target.value) || 0));
        setFormData(prev => ({ ...prev, offer: String(percentage) }));
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
        const firstCategory = categories.find(cat =>
            (cat.categoryType || cat.category_type || "General") === catType
        );
        setFormData(prev => ({
            ...prev,
            cat_type: catType,
            category: firstCategory?.name || "",
            subcategory: firstCategory?.subcategory?.[0] || "",
            total_stock: "0",
            size_chart: "",
        }));
        setVariants([]);
        setIsStockManuallyEdited(false);
    };

    const handleCategoryChange = (e) => {
        const category = categoriesForType.find(cat => cat.name === e.target.value);
        setFormData(prev => ({
            ...prev,
            category: e.target.value,
            subcategory: Array.isArray(category?.subcategory) ? category.subcategory[0] || "" : "",
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
        const initialVariant = {
            color: "#3D01B1",
            colorName: "Purple",
            images: [],
            ...(!isClothingCategory ? { quantity: 0 } : {}),
            selectedSizes: sizes.length === 1 ? [sizes[0]] : [],
            sizesStock: sizes.length === 1 ? { [sizes[0]]: 0 } : {}
        };
        setVariants([...variants, initialVariant]);
        setIsStockManuallyEdited(false);
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
        setIsStockManuallyEdited(false);
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
    };

    const handleStockChange = (vIndex, size, value) => {
        const updated = [...variants];
        if (!updated[vIndex].sizesStock) updated[vIndex].sizesStock = {};
        updated[vIndex].sizesStock[size] = Math.max(0, parseInt(value, 10) || 0);
        setVariants(updated);
        setIsStockManuallyEdited(false);
    };

    const handleColorStockChange = (vIndex, value) => {
        const updated = [...variants];
        updated[vIndex] = { ...updated[vIndex], quantity: Math.max(0, Number.parseInt(value, 10) || 0) };
        setVariants(updated);
        setIsStockManuallyEdited(false);
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

            const updated = [...variants];
            updated[vIndex].images = [...(updated[vIndex].images || []), ...uploadedImages];
            setVariants(updated);
            toast.success(`${uploadedImages.length} color images uploaded.`);
        } catch (error) {
            console.error("Product image upload error:", error);
            toast.error(error.response?.data?.message || "Upload failed.");
        } finally {
            setPendingUploads(count => Math.max(0, count - 1));
        }
    };

    const removeVariantImage = (vIndex, imgIndex) => {
        const updated = [...variants];
        updated[vIndex].images = updated[vIndex].images.filter((_, i) => i !== imgIndex);
        setVariants(updated);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (editingSpecificationIndex !== null) {
            toast.error("Save or cancel the specification you are editing before submitting.");
            return;
        }
        if (!formData.name.trim() || !formData.product_code.trim() || !formData.slug.trim() ||
            !formData.cat_type || !formData.category || !formData.mrp) {
            toast.error("Complete the required product, category, SKU, and price fields.");
            return;
        }
        if (Number(formData.offer_price) > Number(formData.mrp)) {
            toast.error("Offer price cannot be greater than MRP.");
            return;
        }
        if (formData.manufacturing_date && formData.expiry_date &&
            formData.expiry_date < formData.manufacturing_date) {
            toast.error("Expiry date cannot be before manufacturing date.");
            return;
        }
        if (pendingUploads > 0) {
            toast.error("Wait for product media uploads to finish.");
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
        <div className="space-y-6 pb-20">

            {/* Page Header */}
            <div className="flex items-center gap-3 pb-2">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#1F0A3C] hover:border-[#1F0A3C]/30 transition-all shadow-sm">
                    <FiArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[#1F0A3C]">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
                    <p className="text-xs text-gray-400">Fill in product details below</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`space-y-5 lg:order-1 ${usesSideBySideProductLayout ? "lg:col-span-1" : "lg:col-span-2"}`}>
                    <div className={`grid grid-cols-1 gap-5 ${usesSideBySideProductLayout ? "lg:grid-cols-1" : "lg:grid-cols-2"}`}>
                    {/* Primary Categorization & Identity */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#1F0A3C]/5">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-[#1F0A3C] text-white rounded-lg"><FiLayers size={15} /></span>
                                <h2 className="text-sm font-bold text-[#1F0A3C]">Product Foundation</h2>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1F0A3C]/10 rounded-lg border border-[#1F0A3C]/15">
                                <FiHash className="text-[#1F0A3C] w-3 h-3" />
                                <span className="text-xs font-bold text-[#1F0A3C]">{formData.product_code || 'Generating...'}</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Type *</label>
                                    <select
                                        name="cat_type"
                                        value={formData.cat_type}
                                        onChange={handleCategoryTypeChange}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#1F0A3C]/40 focus:ring-2 focus:ring-[#1F0A3C]/10 transition-all text-sm font-semibold text-gray-800 cursor-pointer"
                                    >
                                        <option value="">Select category type first</option>
                                        {categoryTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    {categoryTypes.length === 0 && <p className="text-xs text-amber-700">Create a category before adding products.</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleCategoryChange}
                                        required
                                        disabled={!formData.cat_type}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#1F0A3C]/40 focus:ring-2 focus:ring-[#1F0A3C]/10 transition-all text-sm font-semibold text-gray-800 cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Select category</option>
                                        {categoriesForType.map(cat => <option key={cat.id || cat.catId} value={cat.name}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Wireless Noise-Cancelling Headphones" className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#1F0A3C]/40 focus:ring-2 focus:ring-[#1F0A3C]/10 transition-all text-sm font-semibold text-gray-800" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Code / SKU *</label>
                                    <input type="text" name="product_code" value={formData.product_code} placeholder="Generating..." className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 cursor-not-allowed" readOnly required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategory</label>
                                    <select name="subcategory" value={formData.subcategory} onChange={handleFormChange} disabled={!subcategories.length} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 disabled:opacity-50">
                                        <option value="">Select subcategory</option>
                                        {subcategories.map((sub, index) => <option key={index} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</label>
                                    <select name="rating" value={formData.rating} onChange={handleFormChange} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800">
                                        {[1, 2, 3, 4, 5].map(rating => <option key={rating} value={rating}>{rating} Star{rating > 1 ? "s" : ""}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700">
                                    <span>Product Status</span>
                                    <select name="status" value={formData.status} onChange={handleFormChange} className="min-w-0 rounded-md bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-800">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </label>
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
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Description</label>
                                <textarea name="description" value={formData.description} onChange={handleFormChange} rows="5" placeholder="Describe product features, specifications, and what's included..." className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#1F0A3C]/40 focus:ring-2 focus:ring-[#1F0A3C]/10 transition-all text-sm text-gray-700 resize-y" />
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
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-[#1F0A3C]/5">
                            <span className="p-1.5 bg-[#1F0A3C] text-white rounded-lg"><FiImage size={15} /></span>
                            <h2 className="text-sm font-bold text-[#1F0A3C]">Product Images & Video</h2>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Images (up to 10)</label>
                                    {formData.images.length < 10 && (
                                        <label className="admin-button-secondary cursor-pointer rounded-lg px-3 py-2 text-xs font-bold">
                                            Add Images
                                            <input type="file" accept="image/*" multiple onChange={handleProductImageUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                {formData.images.length ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {formData.images.map((image, index) => (
                                            <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200">
                                                <img src={resolveImageUrl(image)} alt={`Product ${index + 1}`} className="h-full w-full object-cover" />
                                                <button type="button" onClick={() => removeProductImage(index)} aria-label={`Remove product image ${index + 1}`} className="admin-button-danger absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <FiTrash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm font-semibold text-gray-500 hover:border-violet-400 hover:bg-violet-50">
                                        <FiUploadCloud size={20} className="mb-2 text-violet-500" />
                                        Choose product images
                                        <input type="file" accept="image/*" multiple onChange={handleProductImageUpload} className="hidden" />
                                    </label>
                                )}
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
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-[#1F0A3C]/5">
                            <span className="p-1.5 bg-[#1F0A3C] text-white rounded-lg"><FaRupeeSign size={15} /></span>
                            <h2 className="text-sm font-bold text-[#1F0A3C]">Pricing & Stock</h2>
                        </div>
                        <div className="p-5">
                            <div className={`grid grid-cols-2 gap-4 ${isNaturalCategory ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">MRP *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                                        <input type="number" name="mrp" min="0.01" step="0.01" value={formData.mrp} onChange={handleFormChange} className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#1F0A3C]/40 focus:ring-2 focus:ring-[#1F0A3C]/10 transition-all text-sm font-bold text-gray-900" required />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer (%)</label>
                                    <div className="relative">
                                        <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 w-3.5 h-3.5" />
                                        <input type="number" min="0" max="100" step="0.01" value={formData.offer} onChange={handleOfferPercentageChange} className="w-full pl-7 pr-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg outline-none focus:bg-white focus:border-amber-400 text-sm font-bold text-amber-700" />
                                    </div>
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
                                        Stock Quantity
                                        {isStockManuallyEdited && !isClothingCategory && (
                                            <button onClick={resetStockCalculation} className="text-[9px] bg-[#1F0A3C]/10 text-[#1F0A3C] px-1.5 py-0.5 rounded hover:bg-[#1F0A3C] hover:text-white transition-colors uppercase tracking-widest">Auto</button>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <FiActivity className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isStockManuallyEdited ? 'text-amber-500' : 'text-[#1F0A3C]'}`} />
                                        <input type="number" name="total_stock" min="0" value={formData.total_stock} onChange={handleFormChange} readOnly={isClothingCategory} className={`w-full pl-7 pr-3 py-2.5 border rounded-lg outline-none transition-all text-sm font-bold ${isStockManuallyEdited ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-[#1F0A3C]/5 border-[#1F0A3C]/20 text-[#1F0A3C]'} ${isClothingCategory ? "cursor-not-allowed" : ""}`} />
                                    </div>
                                </div>
                                {isNaturalCategory && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</label>
                                        <select name="unit" value={formData.unit} onChange={handleFormChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800">
                                            {["Piece", "Kilogram (kg)", "Gram (g)", "Litre (L)", "Millilitre (ml)", "Pack", "Bottle", "Box"].map(unit => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ))}
                                            {formData.unit && !["Piece", "Kilogram (kg)", "Gram (g)", "Litre (L)", "Millilitre (ml)", "Pack", "Bottle", "Box"].includes(formData.unit) && (
                                                <option value={formData.unit}>{formData.unit}</option>
                                            )}
                                        </select>
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
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#1F0A3C]/5">
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
                <div className={`space-y-4 lg:order-2 ${usesSideBySideProductLayout ? "lg:col-span-1" : "lg:col-span-2"}`}>
                    <div className="flex items-center justify-between sticky  z-20 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center  gap-2">
                            <FiBox className="text-[#1F0A3C] w-4 h-4" />
                            <h3 className="text-sm font-bold text-[#1F0A3C] uppercase tracking-wider">{isClothingCategory ? "Color & Size Stock" : "Color & Stock"}</h3>
                        </div>
                        <button type="button" onClick={addVariant} className="bg-[#1F0A3C] text-white p-1.5 rounded-lg active:scale-90 transition-all shadow hover:bg-[#2d0f57]"><FiPlus size={15} /></button>
                    </div>

                    {variants.map((v, vIndex) => (
                        <div key={vIndex} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
                            <div className="flex items-center justify-between px-4 py-3 bg-[#1F0A3C]/5 border-b border-gray-100">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input
                                        type="color"
                                        value={v.color}
                                        onChange={(e) => handleVariantChange(vIndex, "color", e.target.value)}
                                        className="w-8 h-8 rounded-lg border-2 border-white shadow cursor-pointer flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <select
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
                                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#1F0A3C]/40 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="">Select Shade</option>
                                            {productColors.map(color => <option key={color.hex} value={color.name}>{color.name}</option>)}
                                            {v.colorName && !productColors.find(color => color.name === v.colorName) && <option value={v.colorName}>{v.colorName}</option>}
                                        </select>
                                        <p className="text-[9px] text-gray-400 mt-0.5 ml-0.5">Hex: <span className="font-bold text-[#1F0A3C]">{v.color}</span></p>
                                    </div>
                                </div>
                                {variants.length > 1 && <button type="button" onClick={() => removeVariant(vIndex)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 flex-shrink-0"><FiTrash2 size={14} /></button>}
                            </div>

                            <div className="px-4 pb-4 pt-3 space-y-3">
                                {/* Stock by Size */}
                                <div className="space-y-2">
                                    {isClothingCategory ? (
                                        <>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select sizes and enter quantity per size</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {sizeOptions.map(sz => (
                                                    <button key={sz} type="button" onClick={() => toggleSize(vIndex, sz)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${(v.selectedSizes || []).includes(sz) ? 'bg-[#1F0A3C] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{sz}</button>
                                                ))}
                                            </div>
                                            {(v.selectedSizes || []).length > 0 && (
                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    {v.selectedSizes.map(sz => (
                                                        <div key={sz} className="bg-[#1F0A3C]/5 border border-[#1F0A3C]/15 p-2 rounded-lg flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[9px] font-bold text-[#1F0A3C]/60 uppercase mb-0.5">{sz}</p>
                                                                <input type="number" min="0" value={v.sizesStock?.[sz] ?? 0} onChange={(e) => handleStockChange(vIndex, sz, e.target.value)} className="w-full bg-transparent border-none outline-none p-0 text-sm font-bold text-[#1F0A3C] focus:ring-0" />
                                                            </div>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#1F0A3C]/30"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Quantity</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={v.quantity ?? 0}
                                                onChange={e => handleColorStockChange(vIndex, e.target.value)}
                                                aria-label={`Stock quantity for ${v.colorName || `color ${vIndex + 1}`}`}
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Images */}
                                <div className="grid grid-cols-3 gap-2">
                                    {(v.images || []).slice(0, 5).map((img, iIndex) => (
                                        <div key={iIndex} className="relative h-36 sm:h-40 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group/img">
                                            <img src={resolveImageUrl(img)} alt="Product preview" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.opacity = "0.35"; }} />
                                            <button type="button" onClick={() => removeVariantImage(vIndex, iIndex)} className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><FiTrash2 size={13} /></button>
                                        </div>
                                    ))}
                                    {(v.images || []).length < 5 && (
                                        <label className="flex h-36 sm:h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:bg-[#1F0A3C]/5 hover:border-[#1F0A3C]/40 group/label transition-all">
                                            <FiUploadCloud size={18} className="text-gray-300 group-hover/label:text-[#1F0A3C] transition-colors" />
                                            <span className="mt-1 text-[10px] font-semibold text-gray-400">Color images</span>
                                            <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleVariantImageUpload(vIndex, e)} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                )}

                {/* Bottom Global Action Button */}
                <div className="lg:col-span-2 lg:order-4 pt-5 pb-10 border-t border-gray-200 mt-2">
                    <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || pendingUploads > 0}
                            className="flex items-center gap-2 bg-[#1F0A3C] hover:bg-[#2d0f57] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 px-6 rounded-xl text-sm font-semibold shadow-lg transition-all active:scale-95"
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
            </form>
        </div>
    );
};

export default AddProducts;