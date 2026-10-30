// Triggers a browser download for a blob response (used by every module's
// Excel export button).
export function downloadBlob(blob, filename) {

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

}

// After an export: a note when the file holds a different number of rows
// than the user had selected / saw listed (records changed since the list
// loaded, or some are outside their export permission). Null when they
// match or the server did not report a count.
export function exportCountNotice(blob, expected, what) {

    const actual = blob?.rowCount;

    if (typeof actual !== "number" || typeof expected !== "number" || actual === expected) {
        return null;
    }

    return `The export contains ${actual} ${what}, but ${expected} were selected. ` +
        "Records may have changed since the list was loaded, or some are outside your export permission.";

}

// Message for a failed export. The export request uses responseType "blob",
// so an error body arrives as a Blob and must be read before it is useful.
export async function exportErrorMessage(error, what) {

    if (error?.response?.status === 403) {
        return `You do not have permission to export ${what}.`;
    }

    const data = error?.response?.data;

    try {

        const text = data instanceof Blob ? await data.text() : null;
        const message = text ? JSON.parse(text).message : null;

        if (message) {
            return message;
        }

    } catch {
        // not JSON - fall through to the generic message
    }

    return `Unable to export ${what}.`;
}
