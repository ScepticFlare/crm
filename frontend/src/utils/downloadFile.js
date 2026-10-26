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
