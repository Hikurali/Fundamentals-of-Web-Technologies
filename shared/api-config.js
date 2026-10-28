// API развёрнут на собственном сервере. HTTPS нужен также для GitHub Pages.
const ownApiBaseUrl = "https://82.23.173.175";

function getOwnApiKey() {
    const prefix = "obed_api_key=";
    const savedCookie = document.cookie.split("; ").find(function (item) {
        return item.startsWith(prefix);
    });

    if (savedCookie !== undefined) {
        const value = savedCookie.slice(prefix.length);
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
            return value;
        }
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, function (byte) {
        return byte.toString(16).padStart(2, "0");
    }).join("");
    const key = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");

    document.cookie = prefix + key + "; Path=/; Max-Age=31536000; SameSite=Lax"
        + (location.protocol === "https:" ? "; Secure" : "");
    return key;
}
