import { storage } from "@/src/utils/storage";
import { setLang, type Lang } from "@/src/i18n/translations";

const K_WORKER_ID = "rojgaar.worker_id";
const K_ACCESS_TOKEN = "rojgaar.worker_token";
const K_LANG = "rojgaar.lang";
const K_ONBOARDED = "rojgaar.onboarded";

export const session = {
  async getWorkerId(): Promise<string | null> {
    return (await storage.getItem<string>(K_WORKER_ID, "")) || null;
  },
  async setWorkerId(id: string) {
    await storage.setItem(K_WORKER_ID, id);
  },
  async getAccessToken(): Promise<string | null> {
    const token = await storage.secureGet<string>(K_ACCESS_TOKEN, "");
    return token || null;
  },
  async setAccessToken(token: string) {
    await storage.secureSet(K_ACCESS_TOKEN, token);
  },
  async getLang(): Promise<Lang> {
    const v = (await storage.getItem<string>(K_LANG, "en")) || "en";
    return (v as Lang) || "en";
  },
  async setLang(lang: Lang) {
    await storage.setItem(K_LANG, lang);
    setLang(lang);
  },
  async isOnboarded(): Promise<boolean> {
    return Boolean(await storage.getItem<boolean>(K_ONBOARDED, false));
  },
  async setOnboarded(v: boolean) {
    await storage.setItem(K_ONBOARDED, v);
  },
  async clear() {
    await storage.removeItem(K_WORKER_ID);
    await storage.secureRemove(K_ACCESS_TOKEN);
    await storage.removeItem(K_LANG);
    await storage.removeItem(K_ONBOARDED);
  },
};
