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
        // Helper function to extract message key from __MSG_xxx__ format
        const extractMsgKey = (text) => {
            const match = text.match(/__MSG_(\w+)__/);
            return match ? match[1] : null;
        };

        // Helper function to replace message keys
        const replaceMsgKeys = (text) => {
            if (!text) return text;
            return text.replace(/__MSG_(\w+)__/g, (match, v1) => {
                return this.getMessage(v1) || match;
            });
        };

        // Localize title
        if (document.title.includes('__MSG_')) {
            const key = extractMsgKey(document.title);
            if (key) {
                document.documentElement.setAttribute('data-i18n-title', key);
                document.title = this.getMessage(key) || document.title;
            }
        } else if (document.documentElement.hasAttribute('data-i18n-title')) {
            const key = document.documentElement.getAttribute('data-i18n-title');
            document.title = this.getMessage(key) || document.title;
        }

        // Localize all elements
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            // Localize text content for elements that only contain text (no child elements)
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                const textNode = el.childNodes[0];

                // First time: extract and store message key
                if (textNode.nodeValue && textNode.nodeValue.includes('__MSG_')) {
                    const key = extractMsgKey(textNode.nodeValue);
                    if (key) {
                        el.setAttribute('data-i18n', key);
                        textNode.nodeValue = this.getMessage(key) || textNode.nodeValue;
                    }
                }
                // Subsequent times: use stored message key
                else if (el.hasAttribute('data-i18n')) {
                    const key = el.getAttribute('data-i18n');
                    textNode.nodeValue = this.getMessage(key) || textNode.nodeValue;
                }
            } else {
                // For elements with mixed content, only update direct text nodes
                el.childNodes.forEach((node, index) => {
                    if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
                        // First time: extract and store message key
                        if (node.nodeValue.includes('__MSG_')) {
                            const key = extractMsgKey(node.nodeValue);
                            if (key) {
                                el.setAttribute(`data-i18n-text-${index}`, key);
                                node.nodeValue = this.getMessage(key) || node.nodeValue;
                            }
                        }
                        // Subsequent times: use stored message key
                        else if (el.hasAttribute(`data-i18n-text-${index}`)) {
                            const key = el.getAttribute(`data-i18n-text-${index}`);
                            node.nodeValue = this.getMessage(key) || node.nodeValue;
                        }
                    }
                });
            }

            // Localize common attributes
            const attrsToLocalize = ['placeholder', 'title', 'alt', 'aria-label', 'value'];
            attrsToLocalize.forEach(attrName => {
                if (el.hasAttribute(attrName)) {
                    const attrValue = el.getAttribute(attrName);

                    // First time: extract and store message key
                    if (attrValue && attrValue.includes('__MSG_')) {
                        const key = extractMsgKey(attrValue);
                        if (key) {
                            el.setAttribute(`data-i18n-${attrName}`, key);
                            el.setAttribute(attrName, this.getMessage(key) || attrValue);
                        }
                    }
                    // Subsequent times: use stored message key
                    else if (el.hasAttribute(`data-i18n-${attrName}`)) {
                        const key = el.getAttribute(`data-i18n-${attrName}`);
                        el.setAttribute(attrName, this.getMessage(key) || attrValue);
                    }
                }
            });

            // Special handling for option elements
            if (el.tagName === 'OPTION') {
                // First time: extract and store message key
                if (el.textContent && el.textContent.includes('__MSG_')) {
                    const key = extractMsgKey(el.textContent);
                    if (key) {
                        el.setAttribute('data-i18n', key);
                        el.textContent = this.getMessage(key) || el.textContent;
                    }
                }
                // Subsequent times: use stored message key
                else if (el.hasAttribute('data-i18n')) {
                    const key = el.getAttribute('data-i18n');
                    el.textContent = this.getMessage(key) || el.textContent;
                }
            }
        });

        // Dispatch event for other scripts to know language changed (e.g., to re-render JS generated text)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { locale: this.currentLocale } }));
    }
};
