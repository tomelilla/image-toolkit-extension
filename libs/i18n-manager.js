const I18nManager = {
    currentLocale: 'en',
    messages: {},
    supportedLocales: {
        'en': 'English',
        'zh_TW': '繁體中文',
        'zh_CN': '简体中文',
        'ja': '日本語'
    },

    // Map browser language codes (e.g., zh-TW, en-US) to our folder names
    normalizeLocale(langCode) {
        if (!langCode) return 'en';

        const code = langCode.toLowerCase().replace('-', '_');

        if (code.startsWith('zh')) {
            // Traditional Chinese regions/scripts
            if (code.includes('tw') || code.includes('hk') || code.includes('mo') || code.includes('hant')) {
                return 'zh_TW';
            }
            // Default to Simplified for other zh (cn, sg, hans)
            return 'zh_CN';
        }

        if (code.startsWith('ja')) return 'ja';

        // Default to en for everything else
        return 'en';
    },

    async init() {
        // 1. Check storage for preference
        return new Promise((resolve) => {
            chrome.storage.local.get(['preferredLanguage'], async (result) => {
                let targetLang;
                if (result.preferredLanguage) {
                    targetLang = result.preferredLanguage;
                } else {
                    // 2. Fallback to Browser Language
                    targetLang = this.normalizeLocale(chrome.i18n.getUILanguage());
                }

                // Load messages
                await this.loadMessages(targetLang);

                // Apply to page
                this.localizePage();
                resolve();
            });
        });
    },

    async loadMessages(locale) {
        if (!this.supportedLocales[locale]) locale = 'en'; // Safety fallback
        this.currentLocale = locale;
        try {
            const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
            const response = await fetch(url);
            this.messages = await response.json();
        } catch (e) {
            console.error(`Failed to load locale: ${locale}`, e);
            // Fallback to en if load fails
            if (locale !== 'en') await this.loadMessages('en');
        }
    },

    async setLanguage(locale) {
        await this.loadMessages(locale);
        chrome.storage.local.set({ preferredLanguage: locale });
        this.localizePage();
        return locale;
    },

    getMessage(key) {
        return this.messages[key]?.message || "";
    },

    localizePage() {
        // Localize title
        if (document.title.includes('__MSG_')) {
            document.title = document.title.replace(/__MSG_(\w+)__/g, (match, v1) => {
                return this.getMessage(v1) || match;
            });
        }

        // Localize text nodes
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while(node = walker.nextNode()) {
             // Basic replacement logic
             if (node.nodeValue.includes('__MSG_')) {
                 node.nodeValue = node.nodeValue.replace(/__MSG_(\w+)__/g, (match, v1) => {
                    return this.getMessage(v1) || match;
                });
             }
        }

        // Localize attributes
        const allElements = document.getElementsByTagName('*');
        for(let i=0; i < allElements.length; i++) {
            const el = allElements[i];
            const attributes = el.attributes;
            for(let j=0; j < attributes.length; j++) {
                const attr = attributes[j];
                if(attr.value && attr.value.includes('__MSG_')) {
                     attr.value = attr.value.replace(/__MSG_(\w+)__/g, (match, v1) => {
                        return this.getMessage(v1) || match;
                    });
                }
            }
        }

        // Dispatch event for other scripts to know language changed (e.g., to re-render JS generated text)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { locale: this.currentLocale } }));
    }
};
