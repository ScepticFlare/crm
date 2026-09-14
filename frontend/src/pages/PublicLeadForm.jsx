import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    getPublicBatteries,
    getPublicIndustries,
    getPublicProducts,
    submitPublicLead
} from "../services/publicLeadService";
import "./PublicLeadForm.css";

// Must match config.PublicLeadIndustrySeeder.OTHER_INDUSTRY_NAME on the
// backend exactly - the "Other / Not Listed" option is a real, seeded
// Industry row fetched from GET /api/public/industries like any other, not
// a hardcoded pseudo-option, so this is just how the form recognizes it.
const OTHER_INDUSTRY_NAME = "Other / Not Listed";

const EMPTY_FORM = {
    companyName: "",
    contactPerson: "",
    designation: "",
    phone: "",
    alternatePhone: "",
    email: "",
    city: "",
    state: "",
    pincode: "",
    industryId: "",
    // Only submitted (and only required) when the selected industry is the
    // seeded "Other / Not Listed" Industry - see isOtherIndustry below and
    // PublicLeadService.resolveOtherIndustryDetail on the backend.
    otherIndustryDetail: "",
    description: "",
    // Honeypot - real visitors never see or fill this (see PublicLeadForm.css
    // .hp-field). Left non-empty by a bot, the backend silently drops the
    // submission instead of rejecting it - see PublicLeadService.
    website: ""
};

// This one page (/request) is the single entry point for the website
// "Request/Enquire" button, every brochure QR code, and a directly-shared
// link - which of those it is comes entirely from the URL's query params,
// never from how the page was reached:
//   /request                                          -> plain direct visit
//   /request?source=website                           -> website button
//   /request?source=brochure&campaign=<code>           -> brochure QR
//   /request?source=brochure&campaign=<code>&product=<name-or-id> -> QR with
//       a product preselected (still validated against the real Product
//       master before it's ever trusted - see resolvePreselectedProductId).
export default function PublicLeadForm() {

    const [searchParams] = useSearchParams();

    const rawSource = (searchParams.get("source") || "").toLowerCase();
    const source = rawSource === "brochure" ? "brochure" : "website";
    const campaign = searchParams.get("campaign") || "";
    const productParam = searchParams.get("product") || "";

    const [industries, setIndustries] = useState([]);
    const [products, setProducts] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [selectedBatteryIds, setSelectedBatteryIds] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {

        let cancelled = false;

        async function loadOptions() {

            try {

                const [industryData, productData, batteryData] = await Promise.all([
                    getPublicIndustries(),
                    getPublicProducts(),
                    getPublicBatteries()
                ]);

                if (cancelled) return;

                setIndustries(industryData);
                setProducts(productData);
                setBatteries(batteryData);

                // Preselect a product from ?product= only if it actually
                // matches something in the real, active Product master -
                // an arbitrary/unknown value from a URL is never trusted.
                const preselected = resolvePreselectedProductId(productData, productParam);

                if (preselected) {
                    setSelectedProductIds([preselected]);
                }

            } catch (err) {

                console.error(err);

                if (!cancelled) {
                    setErrorMessage("Unable to load the form right now. Please refresh the page.");
                }

            } finally {

                if (!cancelled) {
                    setLoadingOptions(false);
                }
            }
        }

        loadOptions();

        return () => {
            cancelled = true;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isOtherIndustry = useMemo(() => {

        const selected = industries.find(
            (industry) => String(industry.id) === String(form.industryId)
        );

        return Boolean(selected) && selected.name === OTHER_INDUSTRY_NAME;

    }, [industries, form.industryId]);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value,
            // Selecting a different (non-"Other") industry clears any
            // previously-typed detail so a stale value can never be left
            // over, even though it's hidden and never submitted anyway.
            ...(name === "industryId" && !industries.some(
                (industry) => String(industry.id) === String(value) && industry.name === OTHER_INDUSTRY_NAME
            ) ? { otherIndustryDetail: "" } : {})
        }));
    };

    const toggleProduct = (productId) => {

        setSelectedProductIds((current) =>
            current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId]
        );
    };

    const toggleBattery = (batteryId) => {

        setSelectedBatteryIds((current) =>
            current.includes(batteryId)
                ? current.filter((id) => id !== batteryId)
                : [...current, batteryId]
        );
    };

    const isValid = useMemo(() => {

        return (
            form.companyName.trim() &&
            form.contactPerson.trim() &&
            /^\d{10}$/.test(form.phone) &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
            form.city.trim() &&
            form.state.trim() &&
            form.industryId &&
            (!isOtherIndustry || form.otherIndustryDetail.trim()) &&
            (selectedProductIds.length > 0 || selectedBatteryIds.length > 0) &&
            form.description.trim()
        );

    }, [form, selectedProductIds, selectedBatteryIds, isOtherIndustry]);

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (submitting || submitted) {
            // Prevents a double-click / repeated Enter from firing a second
            // request while the first is still in flight or already
            // succeeded.
            return;
        }

        if (!isValid) {
            setErrorMessage("Please fill in all required fields correctly.");
            return;
        }

        setErrorMessage("");
        setSubmitting(true);

        try {

            await submitPublicLead({
                ...form,
                industryId: Number(form.industryId),
                otherIndustryDetail: isOtherIndustry ? form.otherIndustryDetail.trim() : undefined,
                products: selectedProductIds.map((productId) => ({ productId })),
                batteries: selectedBatteryIds.map((batteryId) => ({ batteryId })),
                source,
                campaign: campaign || undefined
            });

            setSubmitted(true);

        } catch (err) {

            setErrorMessage(
                err.response?.data?.message ||
                "Something went wrong while submitting your enquiry. Please try again."
            );

        } finally {

            setSubmitting(false);
        }
    };

    if (submitted) {

        return (
            <div className="plf-page">
                <div className="plf-card plf-success">
                    <div className="plf-success-icon">&#10003;</div>
                    <h1>Thank You!</h1>
                    <p>Your enquiry has been received. Our team will get back to you shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="plf-page">
            <div className="plf-card">

                <div className="plf-header">
                    <h1>Request / Enquire</h1>
                    <p>Tell us what you need and our team will get back to you.</p>
                </div>

                {errorMessage && (
                    <div className="plf-error">{errorMessage}</div>
                )}

                {loadingOptions ? (
                    <div className="plf-loading">Loading form...</div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>

                        <h2 className="plf-section-title">Your Details</h2>

                        <div className="plf-grid">

                            <label className="plf-field">
                                <span>Company / Organization *</span>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={form.companyName}
                                    onChange={handleChange}
                                    maxLength={150}
                                    required
                                />
                            </label>

                            <label className="plf-field">
                                <span>Full Name *</span>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={form.contactPerson}
                                    onChange={handleChange}
                                    maxLength={100}
                                    required
                                />
                            </label>

                            <label className="plf-field">
                                <span>Phone *</span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    title="Phone number must be exactly 10 digits"
                                    required
                                />
                            </label>

                            <label className="plf-field">
                                <span>Email *</span>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    maxLength={150}
                                    required
                                />
                            </label>

                            <label className="plf-field">
                                <span>City *</span>
                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    maxLength={100}
                                    required
                                />
                            </label>

                            <label className="plf-field">
                                <span>State *</span>
                                <input
                                    type="text"
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    maxLength={100}
                                    required
                                />
                            </label>

                            <label className="plf-field">
                                <span>Industry / Business Type *</span>
                                <select
                                    name="industryId"
                                    value={form.industryId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Industry</option>
                                    {industries.map((industry) => (
                                        <option key={industry.id} value={industry.id}>
                                            {industry.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {isOtherIndustry && (
                                <label className="plf-field">
                                    <span>Please specify your industry / business type *</span>
                                    <input
                                        type="text"
                                        name="otherIndustryDetail"
                                        value={form.otherIndustryDetail}
                                        onChange={handleChange}
                                        maxLength={150}
                                        required
                                    />
                                </label>
                            )}

                            <label className="plf-field">
                                <span>Designation</span>
                                <input
                                    type="text"
                                    name="designation"
                                    value={form.designation}
                                    onChange={handleChange}
                                    maxLength={100}
                                />
                            </label>

                            <label className="plf-field">
                                <span>Pincode</span>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={form.pincode}
                                    onChange={handleChange}
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    title="Pincode must be exactly 6 digits"
                                />
                            </label>

                        </div>

                        <h2 className="plf-section-title">Your Requirement</h2>

                        <div className="plf-field plf-field-full">
                            <span>Product / Product Interest{selectedBatteryIds.length === 0 ? " *" : ""}</span>
                            {products.length > 0 ? (
                                <div className="plf-product-list">
                                    {products.map((product) => (
                                        <label key={product.id} className="plf-product-option">
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product.id)}
                                                onChange={() => toggleProduct(product.id)}
                                            />
                                            {product.name}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="plf-empty-options">No products are currently available.</p>
                            )}
                        </div>

                        {/* Battery interest - only shown when the CRM
                            actually has active Battery master data (see
                            getPublicBatteries/GET /api/public/batteries);
                            an empty selector would otherwise look broken.
                            Product and Battery are independently optional -
                            isValid only requires at least one selection
                            across both. */}
                        {batteries.length > 0 && (
                            <div className="plf-field plf-field-full">
                                <span>Battery / Battery Interest{selectedProductIds.length === 0 ? " *" : ""}</span>
                                <div className="plf-product-list">
                                    {batteries.map((battery) => (
                                        <label key={battery.id} className="plf-product-option">
                                            <input
                                                type="checkbox"
                                                checked={selectedBatteryIds.includes(battery.id)}
                                                onChange={() => toggleBattery(battery.id)}
                                            />
                                            {battery.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <label className="plf-field plf-field-full">
                            <span>Tell us about your requirement *</span>
                            <textarea
                                name="description"
                                rows={4}
                                value={form.description}
                                onChange={handleChange}
                                maxLength={2000}
                                required
                            />
                        </label>

                        <label className="plf-field plf-field-full">
                            <span>Alternate Phone</span>
                            <input
                                type="tel"
                                name="alternatePhone"
                                value={form.alternatePhone}
                                onChange={handleChange}
                                maxLength={10}
                                pattern="[0-9]{10}"
                            />
                        </label>

                        {/* Honeypot field - hidden from real visitors via CSS
                            (see .hp-field), never via display:none so simple
                            bots that skip display:none fields still fill it. */}
                        <label className="hp-field" aria-hidden="true">
                            <span>Website</span>
                            <input
                                type="text"
                                name="website"
                                value={form.website}
                                onChange={handleChange}
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </label>

                        <button
                            type="submit"
                            className="plf-submit"
                            disabled={submitting}
                        >
                            {submitting ? "Submitting..." : "Submit Enquiry"}
                        </button>

                    </form>
                )}

            </div>
        </div>
    );
}

// Matches a ?product= URL value against the real, currently-active Product
// list by numeric id first, then case-insensitive name - never trusts the
// raw param as a valid product id/name on its own. Returns null (no
// preselection) if nothing matches, rather than guessing.
function resolvePreselectedProductId(productList, rawValue) {

    if (!rawValue) {
        return null;
    }

    const numericId = Number(rawValue);

    if (Number.isInteger(numericId)) {

        const byId = productList.find((p) => p.id === numericId);

        if (byId) {
            return byId.id;
        }
    }

    const normalized = rawValue.trim().toLowerCase();

    const byName = productList.find(
        (p) => p.name.trim().toLowerCase() === normalized
    );

    return byName ? byName.id : null;
}
