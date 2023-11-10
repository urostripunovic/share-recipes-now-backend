import { FileTypeResult, fileTypeFromBuffer } from "file-type";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto"

dotenv.config();
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
    region: process.env.REGION!,
});

/**
 * Upload images to s3 bucket
 * @param image 
 * @param defaultPic if there is no second parameter then the default image is a picture of a seal
 * @returns the url location of the image file 
 */
export async function uploadToBucket(image: Blob, defaultPic: string = process.env.DEFAULT_PROFILE_PIC!): Promise<String> {
    if (!image) return defaultPic;
    try {
        const location = image.name+"/"+crypto.randomUUID();
        await s3.send(
            new PutObjectCommand({
                ACL: "public-read-write",
                Body: Buffer.from(await image.arrayBuffer()),
                Bucket: process.env.BUCKET!,
                ContentType: image.type,
                Key: location,
            })
        );
        //let's two different images with the same name be uploaded
        //whitespace needs to change to + for aws .replace(/\s+/g, "+") /crypto.randomUUID()
        return process.env.LOCATION!+""+location; 
    } catch (error) {
        return defaultPic;
    }
}

export async function removeFromBucket(location: string): Promise<void> {
    try {
        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.BUCKET!,
            Key: location,
        }))
        return;
    } catch (error) {
        return error;
    }
}

/**
 * @deprecated
 * @param db
 * @returns
 */
async function processImage(profile_image: ArrayBuffer): Promise<String> {
    if (!profile_image) return ""; //have a default image maybe

    const b64 = Buffer?.from(profile_image).toString("base64");
    const { mime } = (await fileTypeFromBuffer(
        profile_image
    )) as FileTypeResult;
    //the package doesn't have all mime types so if something isn't png, webp, jpeg or gif change it to webp
    //or create your own but i'd need to research what each binary means in a sequence
    let adjustedMime = mime;
    if (!mime) {
        adjustedMime = "image/webp";
    }

    return `data:${adjustedMime};base64,${b64}`;
}

/**
 * @deprecated
 * @param image_file
 * @returns
 */
async function convertImageToBuffer(image_file: Blob): Promise<ArrayBuffer> {
    //kolla om annat än array buffer
    let image: ArrayBuffer;
    if (image_file) {
        const arrayBuffer = await image_file.arrayBuffer();
        image = Buffer.from(arrayBuffer);
    } else {
        return image_file;
    }

    return image;
}
