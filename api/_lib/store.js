import { createSheetsStore } from "./sheets.js";
import { createLocalStore } from "./local.js";

let instance = null;
let override = null;

/** Chỉ dùng trong test. */
export function __setStoreForTests(s) { override = s; instance = null; }

/**
 * Có đủ biến môi trường -> Google Sheets.
 * Không có và đang chạy ở máy (không phải Vercel) -> file JSON.
 * Không có và đang trên Vercel -> báo lỗi cấu hình, không im lặng ghi vào chỗ khác.
 */
export async function getStore(env = process.env) {
  if (override) return override;
  if (instance) return instance;
  const { SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = env;
  if (SHEET_ID && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
    instance = createSheetsStore({ sheetId: SHEET_ID, email: GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey: GOOGLE_PRIVATE_KEY });
  } else if (!env.VERCEL) {
    instance = createLocalStore();
  } else {
    const err = new Error("storage_not_configured");
    err.code = "not_configured";
    throw err;
  }
  return instance;
}
