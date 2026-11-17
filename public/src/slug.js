// Slug là mã định danh: giữ nguyên hoa/thường để khớp đúng dòng trong Sheet.
export const SLUG_RE = /^[a-zA-Z0-9-]{3,64}$/;
export const isValidSlug = (slug) => typeof slug === "string" && SLUG_RE.test(slug);
