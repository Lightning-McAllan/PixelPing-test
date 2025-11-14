require("dotenv").config();

module.exports = {
    getBaseUrl() {
        let base = process.env.DEPLOYED_BASE_URL || "";
        return base.replace(/\/+$/, "");
    },

    buildPixelUrl(type, params = {}) {
        const base = this.getBaseUrl();
        const query = new URLSearchParams(params).toString();

        return `${base}/pixel/${type}${query ? "?" + query : ""}`;
    }
};
