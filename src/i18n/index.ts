/**
 * i18n Configuration
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import English translation files
import commonEn from './locales/en/common.json';
import tutorialsEn from './locales/en/tutorials.json';
import levelsEn from './locales/en/levels.json';
import errorsEn from './locales/en/errors.json';

// Import German translation files
import commonDe from './locales/de/common.json';
import tutorialsDe from './locales/de/tutorials.json';
import levelsDe from './locales/de/levels.json';
import errorsDe from './locales/de/errors.json';

const resources = {
    en: {
        common: commonEn,
        tutorials: tutorialsEn,
        levels: levelsEn,
        errors: errorsEn,
    },
    de: {
        common: commonDe,
        tutorials: tutorialsDe,
        levels: levelsDe,
        errors: errorsDe,
    },
} as const;

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'de',
        defaultNS: 'common',
        fallbackLng: 'en',
        supportedLngs: ['en', 'de'],

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n;
