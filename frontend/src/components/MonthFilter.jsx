const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function buildMonthOptions(monthsBack) {

    const options = [];
    const now = new Date();

    let year = now.getFullYear();
    let month = now.getMonth() + 1; // 1-12

    for (let i = 0; i < monthsBack; i++) {

        const value = `${year}-${String(month).padStart(2, "0")}`;
        const label = `${MONTH_NAMES[month - 1]} ${year}`;

        options.push({ value, label });

        month -= 1;

        if (month === 0) {
            month = 12;
            year -= 1;
        }

    }

    return options;

}

export default function MonthFilter({
    value,
    onChange,
    monthsBack = 24,
    className = "form-select"
}) {

    const options = buildMonthOptions(monthsBack);

    return (

        <select
            className={className}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >

            <option value="">All Months</option>

            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}

        </select>

    );

}
