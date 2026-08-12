import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/StatCard";

import {
    previewFullReport,
    exportFullReport,
} from "../services/fullReportService";

import { getAllEmployees } from "../services/employeeService";
import { getAllLeadSourcesAdmin } from "../services/leadSourceService";
import { getAllIndustriesAdmin } from "../services/industryService";
import { getAllSalesStagesAdmin } from "../services/salesStageService";
import { getAllProductsAdmin } from "../services/productService";
import { getAllBatteriesAdmin } from "../services/batteryService";

const RECORD_TYPE_OPTIONS = [
    { key: "LEAD", label: "Leads" },
    { key: "OPPORTUNITY", label: "Opportunities" },
    { key: "CUSTOMER", label: "Customers" },
];

const SECTION_OPTIONS = [
    { key: "LEAD_INFO", label: "Lead Information" },
    { key: "OPPORTUNITY_INFO", label: "Opportunity Information" },
    { key: "CUSTOMER_INFO", label: "Customer Information" },
    { key: "PRODUCT_INFO", label: "Product Information" },
    { key: "BATTERY_INFO", label: "Battery Information" },
    { key: "EMPLOYEE_INFO", label: "Employee Information" },
];

const LEAD_COLUMNS = [
    { key: "leadId", label: "ID" },
    { key: "companyName", label: "Company" },
    { key: "contactPerson", label: "Contact" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "city", label: "City" },
    { key: "industry", label: "Industry" },
    { key: "leadSource", label: "Lead Source" },
    { key: "leadStatus", label: "Status" },
    { key: "leadValidity", label: "Validity" },
    { key: "assignedEmployeeName", label: "Employee" },
    { key: "products", label: "Products" },
    { key: "batteries", label: "Batteries" },
    { key: "createdAt", label: "Created At" },
];

const OPPORTUNITY_COLUMNS = [
    { key: "opportunityId", label: "ID" },
    { key: "title", label: "Title" },
    { key: "salesStage", label: "Sales Stage" },
    { key: "companyName", label: "Company" },
    { key: "contactPerson", label: "Contact" },
    { key: "productValue", label: "Value" },
    { key: "expectedClosingDate", label: "Expected Closing" },
    { key: "leadValidity", label: "Validity" },
    { key: "industry", label: "Industry" },
    { key: "leadSource", label: "Lead Source" },
    { key: "assignedEmployeeName", label: "Employee" },
    { key: "products", label: "Products" },
    { key: "batteries", label: "Batteries" },
    { key: "createdAt", label: "Created At" },
];

const CUSTOMER_COLUMNS = [
    { key: "customerId", label: "ID" },
    { key: "customerCode", label: "Code" },
    { key: "companyName", label: "Company" },
    { key: "contactPerson", label: "Contact" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "city", label: "City" },
    { key: "gstNumber", label: "GST" },
    { key: "assignedEmployeeName", label: "Employee" },
    { key: "opportunityTitle", label: "Opportunity" },
    { key: "salesStage", label: "Sales Stage" },
    { key: "productValue", label: "Value" },
    { key: "industry", label: "Industry" },
    { key: "leadSource", label: "Lead Source" },
    { key: "products", label: "Products" },
    { key: "batteries", label: "Batteries" },
    { key: "createdAt", label: "Created At" },
];

function PreviewTable({ columns, rows }) {

    if (!rows || rows.length === 0) {
        return (
            <p className="text-muted mb-0">
                No records match the selected filters.
            </p>
        );
    }

    return (
        <div className="table-responsive">

            <table className="table table-bordered table-hover table-sm align-middle">

                <thead className="table-light">

                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>

                </thead>

                <tbody>

                    {rows.map((row, index) => (

                        <tr key={index}>

                            {columns.map((col) => (
                                <td key={col.key}>
                                    {row[col.key] === null || row[col.key] === undefined
                                        ? ""
                                        : String(row[col.key])}
                                </td>
                            ))}

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}

export default function FullReport() {

    const today = new Date().toISOString().split("T")[0];

    const firstDay = new Date(
        new Date().getFullYear(),
        0,
        1
    ).toISOString().split("T")[0];

    const [from, setFrom] = useState(firstDay);
    const [to, setTo] = useState(today);

    const [recordTypes, setRecordTypes] = useState({
        LEAD: true,
        OPPORTUNITY: true,
        CUSTOMER: true,
    });

    const [sections, setSections] = useState({
        LEAD_INFO: true,
        OPPORTUNITY_INFO: true,
        CUSTOMER_INFO: true,
        PRODUCT_INFO: true,
        BATTERY_INFO: true,
        EMPLOYEE_INFO: true,
    });

    const [employeeId, setEmployeeId] = useState("");
    const [leadSourceId, setLeadSourceId] = useState("");
    const [industryId, setIndustryId] = useState("");
    const [salesStageId, setSalesStageId] = useState("");
    const [productId, setProductId] = useState("");
    const [batteryId, setBatteryId] = useState("");
    const [leadValidity, setLeadValidity] = useState("");

    const [employees, setEmployees] = useState([]);
    const [leadSources, setLeadSources] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [salesStages, setSalesStages] = useState([]);
    const [products, setProducts] = useState([]);
    const [batteries, setBatteries] = useState([]);

    const [report, setReport] = useState(null);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadFilterOptions();
    }, []);

    async function loadFilterOptions() {

        try {

            setLoadingOptions(true);

            const [
                employeeData,
                leadSourceData,
                industryData,
                salesStageData,
                productData,
                batteryData,
            ] = await Promise.all([
                getAllEmployees(),
                getAllLeadSourcesAdmin(),
                getAllIndustriesAdmin(),
                getAllSalesStagesAdmin(),
                getAllProductsAdmin(),
                getAllBatteriesAdmin(),
            ]);

            setEmployees(employeeData);
            setLeadSources(leadSourceData);
            setIndustries(industryData);
            setSalesStages(salesStageData);
            setProducts(productData);
            setBatteries(batteryData);

        } catch (err) {

            console.log(err);
            alert("Failed to load filter options.");

        } finally {

            setLoadingOptions(false);

        }

    }

    function toggleRecordType(key) {
        setRecordTypes((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function toggleSection(key) {
        setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function toggleAllSections(checked) {
        setSections({
            LEAD_INFO: checked,
            OPPORTUNITY_INFO: checked,
            CUSTOMER_INFO: checked,
            PRODUCT_INFO: checked,
            BATTERY_INFO: checked,
            EMPLOYEE_INFO: checked,
        });
    }

    function buildFilters() {

        const selectedRecordTypes = Object.keys(recordTypes)
            .filter((key) => recordTypes[key]);

        const selectedSections = Object.keys(sections)
            .filter((key) => sections[key]);

        return {
            from,
            to,
            recordTypes: selectedRecordTypes,
            includeSections: selectedSections,
            employeeId: employeeId === "" ? null : Number(employeeId),
            leadSourceId: leadSourceId === "" ? null : Number(leadSourceId),
            industryId: industryId === "" ? null : Number(industryId),
            salesStageId: salesStageId === "" ? null : Number(salesStageId),
            productId: productId === "" ? null : Number(productId),
            batteryId: batteryId === "" ? null : Number(batteryId),
            leadValidity: leadValidity === "" ? null : leadValidity,
        };
    }

    function validateFilters() {

        if (!from || !to) {
            alert("Please select both From Date and To Date.");
            return false;
        }

        if (!Object.values(recordTypes).some(Boolean)) {
            alert("Please select at least one record type.");
            return false;
        }

        return true;
    }

    async function generatePreview() {

        if (!validateFilters()) {
            return;
        }

        try {

            setGenerating(true);

            const data = await previewFullReport(buildFilters());

            setReport(data);

        } catch (err) {

            console.log(err);
            alert("Failed to generate the full report.");

        } finally {

            setGenerating(false);

        }

    }

    async function handleExport() {

        if (!validateFilters()) {
            return;
        }

        try {

            setExporting(true);

            await exportFullReport(buildFilters());

        } catch (err) {

            console.log(err);
            alert("Export failed.");

        } finally {

            setExporting(false);

        }

    }

    return (
        <>

            <PageHeader
                title="Full Report"
                subtitle="Build a custom, detailed CRM report across Leads, Opportunities and Customers."
            />

            <SectionCard title="Filters">

                <div className="row g-3">

                    <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Employee</label>
                        <select
                            className="form-select"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                        >
                            <option value="">All</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Lead Source</label>
                        <select
                            className="form-select"
                            value={leadSourceId}
                            onChange={(e) => setLeadSourceId(e.target.value)}
                        >
                            <option value="">All</option>
                            {leadSources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Industry</label>
                        <select
                            className="form-select"
                            value={industryId}
                            onChange={(e) => setIndustryId(e.target.value)}
                        >
                            <option value="">All</option>
                            {industries.map((industry) => (
                                <option key={industry.id} value={industry.id}>
                                    {industry.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Sales Stage</label>
                        <select
                            className="form-select"
                            value={salesStageId}
                            onChange={(e) => setSalesStageId(e.target.value)}
                        >
                            <option value="">All</option>
                            {salesStages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Product</label>
                        <select
                            className="form-select"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        >
                            <option value="">All</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Battery</label>
                        <select
                            className="form-select"
                            value={batteryId}
                            onChange={(e) => setBatteryId(e.target.value)}
                        >
                            <option value="">All</option>
                            {batteries.map((battery) => (
                                <option key={battery.id} value={battery.id}>
                                    {battery.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Lead Validity</label>
                        <select
                            className="form-select"
                            value={leadValidity}
                            onChange={(e) => setLeadValidity(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="VALID">Valid</option>
                            <option value="INVALID">Invalid</option>
                        </select>
                    </div>

                </div>

            </SectionCard>

            <SectionCard title="Record Types">

                <div className="d-flex flex-wrap gap-4">

                    {RECORD_TYPE_OPTIONS.map((opt) => (

                        <div className="form-check" key={opt.key}>

                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`record-${opt.key}`}
                                checked={recordTypes[opt.key]}
                                onChange={() => toggleRecordType(opt.key)}
                            />

                            <label
                                className="form-check-label"
                                htmlFor={`record-${opt.key}`}
                            >
                                {opt.label}
                            </label>

                        </div>

                    ))}

                </div>

            </SectionCard>

            <SectionCard
                title="Columns to Include"
                actions={
                    <div className="form-check">

                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="section-all"
                            checked={Object.values(sections).every(Boolean)}
                            onChange={(e) => toggleAllSections(e.target.checked)}
                        />

                        <label className="form-check-label" htmlFor="section-all">
                            All
                        </label>

                    </div>
                }
            >

                <div className="d-flex flex-wrap gap-4">

                    {SECTION_OPTIONS.map((opt) => (

                        <div className="form-check" key={opt.key}>

                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`section-${opt.key}`}
                                checked={sections[opt.key]}
                                onChange={() => toggleSection(opt.key)}
                            />

                            <label
                                className="form-check-label"
                                htmlFor={`section-${opt.key}`}
                            >
                                {opt.label}
                            </label>

                        </div>

                    ))}

                </div>

            </SectionCard>

            <div className="d-flex gap-2 mb-4">

                <button
                    className="btn btn-primary"
                    onClick={generatePreview}
                    disabled={generating || loadingOptions}
                >
                    {generating ? "Generating..." : "Generate Preview"}
                </button>

                <button
                    className="btn btn-success"
                    onClick={handleExport}
                    disabled={exporting || loadingOptions}
                >
                    {exporting ? "Exporting..." : "Export Excel"}
                </button>

            </div>

            {report && (

                <>

                    <SectionCard title="Summary">

                        <div className="row g-3 mb-4">

                            <div className="col-md-3">
                                <StatCard title="Leads" value={report.summary.totalLeads} icon="bi-person-lines-fill" color="#0d6efd" />
                            </div>

                            <div className="col-md-3">
                                <StatCard title="Opportunities" value={report.summary.totalOpportunities} icon="bi-briefcase-fill" color="#6f42c1" />
                            </div>

                            <div className="col-md-3">
                                <StatCard title="Customers" value={report.summary.totalCustomers} icon="bi-people-fill" color="#198754" />
                            </div>

                            <div className="col-md-3">
                                <StatCard title="Won" value={report.summary.won} icon="bi-trophy-fill" color="#ffc107" />
                            </div>

                        </div>

                        <div className="row g-3 mb-4">

                            <div className="col-md-3">
                                <StatCard title="Valid Leads" value={report.summary.validLeads} icon="bi-check-circle-fill" color="#0dcaf0" />
                            </div>

                            <div className="col-md-3">
                                <StatCard title="Invalid Leads" value={report.summary.invalidLeads} icon="bi-x-circle-fill" color="#dc3545" />
                            </div>

                            <div className="col-md-3">
                                <StatCard title="Lost" value={report.summary.lost} icon="bi-emoji-frown-fill" color="#dc3545" />
                            </div>

                            <div className="col-md-3">
                                <StatCard title="In Progress / Postponed" value={`${report.summary.inProgress} / ${report.summary.postponed}`} icon="bi-hourglass-split" color="#fd7e14" />
                            </div>

                        </div>

                        <div className="row g-3 mb-4">

                            <div className="col-md-3">
                                <StatCard title="Dropped" value={report.summary.dropped} icon="bi-x-circle-fill" color="#6c757d" />
                            </div>

                            <div className="col-md-3">
                                <StatCard title="Unresponsive" value={report.summary.unresponsive} icon="bi-chat-square-x" color="#ffc107" />
                            </div>

                        </div>

                        <div className="row g-3">

                            <div className="col-md-6">

                                <h6 className="fw-semibold">Product Totals</h6>

                                {report.summary.productTotals.length === 0 ? (
                                    <p className="text-muted">No product data.</p>
                                ) : (
                                    <table className="table table-sm table-bordered">
                                        <thead className="table-light">
                                            <tr><th>Product</th><th>Total Quantity</th></tr>
                                        </thead>
                                        <tbody>
                                            {report.summary.productTotals.map((item) => (
                                                <tr key={item.name}>
                                                    <td>{item.name}</td>
                                                    <td>{item.totalQuantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                            </div>

                            <div className="col-md-6">

                                <h6 className="fw-semibold">Battery Totals</h6>

                                {report.summary.batteryTotals.length === 0 ? (
                                    <p className="text-muted">No battery data.</p>
                                ) : (
                                    <table className="table table-sm table-bordered">
                                        <thead className="table-light">
                                            <tr><th>Battery</th><th>Total Quantity</th></tr>
                                        </thead>
                                        <tbody>
                                            {report.summary.batteryTotals.map((item) => (
                                                <tr key={item.name}>
                                                    <td>{item.name}</td>
                                                    <td>{item.totalQuantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                            </div>

                        </div>

                    </SectionCard>

                    {recordTypes.LEAD && (
                        <SectionCard title={`Leads (${report.leads.length})`}>
                            <PreviewTable columns={LEAD_COLUMNS} rows={report.leads} />
                        </SectionCard>
                    )}

                    {recordTypes.OPPORTUNITY && (
                        <SectionCard title={`Opportunities (${report.opportunities.length})`}>
                            <PreviewTable columns={OPPORTUNITY_COLUMNS} rows={report.opportunities} />
                        </SectionCard>
                    )}

                    {recordTypes.CUSTOMER && (
                        <SectionCard title={`Customers (${report.customers.length})`}>
                            <PreviewTable columns={CUSTOMER_COLUMNS} rows={report.customers} />
                        </SectionCard>
                    )}

                </>

            )}

        </>
    );

}
