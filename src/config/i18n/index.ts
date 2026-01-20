import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import vi from "./locales/vi";
import en from "./locales/en";

const resources = {
    vi: {
        translation: vi,
    },
    en: {
        translation: en,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: "vi", // Default language
        fallbackLng: "vi",
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
        detection: {
            order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag", "path", "subdomain"],
            caches: ["localStorage", "cookie"],
        },
    });

export default i18n;
