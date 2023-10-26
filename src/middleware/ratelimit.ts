export async function rateLimit(next: any) {
    console.log("hej funkar detta")
    await next();
}