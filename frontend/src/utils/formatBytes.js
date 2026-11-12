// "1.5 KB", "2.0 MB" - for file sizes shown to users. "-" when unknown.
export function formatBytes(bytes) {

    if (typeof bytes !== "number") {
        return "-";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = ["KB", "MB", "GB"];
    let value = bytes / 1024;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }

    return `${value.toFixed(1)} ${units[unit]}`;
}
