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

/**
 * A class/function that validates different part of the form
 * @returns functions that validate each form input
 */
export function validateForm() {
    /**
     * Validates sanitized password
     * @param input password string
     * @returns boolean of regex
     */
    function validatePassword(input: string): boolean {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(input);
    }
    /**
     * Validates sanitized email
     * @param input email string
     * @returns boolean of regex
     */
    function validateEmail(input: string): boolean {
        const emailRegex = /^\S+@\S+\.\S+$/;
        return emailRegex.test(input);
    }
    /**
     * Validates sanitized username
     * @param input username string
     * @returns boolean of regex
     */
    function validateUsername(input: string): boolean {
        const usernameRegex = /^(?=[a-zA-Z0-9._]{3,16}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
        return usernameRegex.test(input);
    }
    /**
     * Validates extension of file 
     * @param image file
     * @returns boolean if the file type is correct
     */
    function validateFileType(image: File): boolean {
        const extension = image?.name.split(".").pop();
        const allowedImageExtension = ["png", "gif", "jpeg", "pjp", "jpg", "pjpeg", "jfif", "webp"];
        return allowedImageExtension.includes(extension!);
    }

    /**
     * Validates size of file
     * @param image file
     * @returns boolean if the file size it so big
     */
    function validateFileSize(image: File): boolean {
        const unacceptableSize = 6 * 1024 * 1024; // 6 mbs in bytes
        return image.size < unacceptableSize;
    }

    return { 
        validatePassword, 
        validateEmail, 
        validateUsername, 
        validateFileType, 
        validateFileSize 
    }
}
