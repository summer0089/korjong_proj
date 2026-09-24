// Format date helper (Thai Buddhist Calendar)
export const formatThaiDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const thaiYear = date.getFullYear() + 543;
        return `${date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
        })} ${thaiYear} ${date.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
        })} น.`;
    } catch {
        return dateStr;
    }
};