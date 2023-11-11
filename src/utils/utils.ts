import { expiresIn } from "./jwtExpires";
import { uploadToBucket, removeFromBucket } from "./processImage";
import { validateString, validateForm } from "./validate";

function fileSize(image: File) {
    return (image.size/(1024*1024)).toFixed(1);
}

export {
    expiresIn,
    fileSize,
    validateString,
    validateForm,
    uploadToBucket,
    removeFromBucket
};
