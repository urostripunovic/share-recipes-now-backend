import { FileTypeResult, fileTypeFromBuffer } from 'file-type';


/**
 * Redo this function when fetching a recipe the image is processed at the server instead of client
 * @param db 
 * @returns 
 */
export async function processImage(profile_image: ArrayBuffer): Promise<String> {
    if (!profile_image) return ""; //have a default image maybe

    const b64 = Buffer?.from(profile_image).toString("base64");
    const { mime } = await fileTypeFromBuffer(profile_image) as FileTypeResult;
    //the package doesn't have all mime types so if something isn't png, webp, jpeg or gif change it to webp
    //or create your own but i'd need to research what each binary means in a sequence
    let adjustedMime = mime;
    if (!mime) {
        adjustedMime = "image/webp";
    }

    return `data:${adjustedMime};base64,${b64}`
}