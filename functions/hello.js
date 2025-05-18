export async function onRequest(context) {
    return new Response("<div>Hello from Cloudflare Workers!</div>", {
        headers: { "Content-Type": "text/html" },
    });
}