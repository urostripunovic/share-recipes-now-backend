export function validateString(unsafe: string): string {
    const safe = unsafe
        .trim()
        .replace(/\\/g, "")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    return safe;
}

export function validateFileType(image: File): boolean {
    const extension = image?.name.split(".").pop();
    const allowedImageExtension = [
        "png", "gif", "jpeg", "pjp", "jpg", "pjpeg", "jfif", "webp"];
    return allowedImageExtension.includes(extension!);
}

export function validatePassword(input: string): boolean {
    const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(input);
}
