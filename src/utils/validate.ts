import { HTTPException } from "hono/http-exception";

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

export function validateForm() {
    /**
     * Validates sanitized password
     * @param input password string
     * @throws HTTP exception if password is to weak
     */
    function validatePassword(input: string): void {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(input))
            throw new HTTPException(406, { message: "Password is to weak" })
    }
    /**
     * Validates sanitized email
     * @param input email string
     * @throws HTTP exception if email has wrong format
     */
    function validateEmail(input: string): void {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(input))
            throw new HTTPException(406, { message: "Wrong email format" })
    }
    /**
     * Validates sanitized username
     * @param input username string
     * @throws HTTP exception if username has wrong format
     */
    function validateUsername(input: string): void {
        const usernameRegex = /^(?=[a-zA-Z0-9._]{3,16}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
        if (!usernameRegex.test(input))
            throw new HTTPException(406, { message: "Wrong username format" })
    }
    /**
     * Validates extension of file 
     * @param image file
     * @throws HTTP exception for wrong file type
     */
    function validateFileType(image: File): void {
        const extension = image?.name.split(".").pop();
        const allowedImageExtension = ["png", "gif", "jpeg", "pjp", "jpg", "pjpeg", "jfif", "webp"];
        if(!allowedImageExtension.includes(extension!))
            throw new HTTPException(406, { message: "Wrong file type" })
    }

    /**
     * Validates size of file
     * @param image file
     * @throws HTTP exception for wrong file size
     */
    function validateFileSize(image: File): void {
        const unacceptableSize = 2 * 1024 * 1024; // 2 mbs in bytes
        const size = (image.size/(1024*1024)).toFixed(1);
        if(image.size > unacceptableSize)
            throw new HTTPException(406, { message: `File size is ${size}MB, keep it to 2MB` })
    }

    return { validatePassword, validateEmail, validateUsername, validateFileType, validateFileSize }
}
