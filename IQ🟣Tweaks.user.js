// ==UserScript==
// @name         IQ🟣Tweaks
// @version      0.17.1 // Keep in sync with VERSION_NUMBER below
// @author       mini
// @homepage     https://github.com/miniGiovanni/IQ--Tweaks
// @supportURL   https://github.com/miniGiovanni/IQ--Tweaks
// @downloadURL  https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/IQ%F0%9F%9F%A3Tweaks.user.js
// @updateURL    https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/IQ%F0%9F%9F%A3Tweaks.user.js
// @copyright    WTFPL license, 2026.
// @namespace    http://tampermonkey.net/
// @description  Minor tweaks to informatique.nl, such as adding a manual apply filters button, making stock status icons consistent and more.
// @match        https://*.informatique.nl/*
// @match        http://*.informatique.nl/*
// @match        https://informatique.nl/*
// @match        http://informatique.nl/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @icon         https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/favicon.ico
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- Early logo swap (runs at document-start to prevent flicker) ---
    // Read the saved setting directly from storage before the DOM exists, then watch
    // for the logo element to appear and swap its src immediately — before first paint.
    (function earlyLogoSwap() {
        const SETTINGS_KEY = 'IQTweak_settings';
        const SPECIAL_LOGO_URL = 'https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/informatique-logo-pride.svg';

        let enabled = false;
        try {
            // GM_getValue returns a plain object (Tampermonkey stores/restores it directly).
            // Do NOT JSON.parse — the value is already an object, not a JSON string.
            // saveSettings() stores bare booleans, so the shape is { enableSpecialLogo: true/false, ... }.
            const saved = GM_getValue(SETTINGS_KEY);
            if (saved && typeof saved === 'object') {
                enabled = !!saved.enableSpecialLogo;
            }
        } catch (e) { /* no saved setting yet — leave disabled */ }

        if (!enabled) return;

        // Watch for the logo element and swap it the moment it's inserted into the DOM
        const observer = new MutationObserver(() => {
            const logo = document.querySelector('.informatique-logo');
            if (logo) {
                logo.src = SPECIAL_LOGO_URL;
                observer.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    })();

    // --- Configuration and Global State ---
    const SCRIPT_PREFIX = 'IQTweak_';
    const SETTINGS_KEY = SCRIPT_PREFIX + 'settings';
    const VERSION_NUMBER = "0.17.1"; // Keep in sync with @version above

    // These features can be turned on/off by the user in the control panel, and the settings will be saved locally.
    // Most features are true (turned on) by default, but some features are optional and thus false (turned off) by default.
    const defaultSettings = {
        enableSpecialLogo: { value: false, title: "Speciaal logo", description: "Geeft het Informatique logo een speciale look!" },
        enableFilterApplyButton: { value: true, title: "Filter toepassen knop", description: "Voorkomt automatisch verversen van de pagina en voegt een handmatige 'Filters toepassen' knop toe." },
        enableFilterApplyButtonAnimation: { value: true, title: "Animatie voor filterknop", description: "De 'Filters toepassen' knop krijgt een animatie als er een filter is gewijzigd." },
        enableArticleNumberToMorePlaces: { value: true, title: "Artikelnr. op hoofdpagina", description: "Voegt het artikelnummer toe naast de prijs op de hoofdpagina." },
        enableStockInformationIconFix: { value: true, title: "Voorraadstatus icoon fix", description: "Maakt de iconen voor voorraadstatus (leverancier/onbekend) overal op de site consistent." },
 enableContentFeatures: { value: false, title: "Extra content functies", description: "Voegt aantal content functies toe; content groep bij elke categorie, filter ID bij elke filter, en snelle kopieer functie." },
 enableEanTweakersSearch: { value: false, title: "EAN Tweakers zoeken", description: "Voegt een klikbaar Tweakers-icoontje toe naast de EAN-code op een productpagina, waarmee je direct kunt zoeken op Tweakers." },
 enableFunFeatures: { value: false, title: "Grappige functies", description: "Gewoon wat leuke easter eggs." },
 enableExperimentalFeatures: { value: false, title: "Experimentele functies", description: "Schakelt experimentele of onvoltooide functies in." },
    };

    // This will hold the loaded settings. It's populated by loadSettings().
    let currentSettings = {};

    // Linking a feature to a certain function, which apply (or remove) the feature.
    const featureApplicationMap = {
        enableSpecialLogo: specialLogo,
        enableFilterApplyButton: filterFix,
        enableFilterApplyButtonAnimation: applyFilterApplyButtonAnimation,
        enableArticleNumberToMorePlaces: articleNumberAddition,
        enableStockInformationIconFix: stockInformationIconFix,
        enableContentFeatures: contentFeatures,
        enableEanTweakersSearch: eanTweakersSearch,
        enableFunFeatures: funFeatures,
        enableExperimentalFeatures: experimentalFeatures,
    };

    // Map to store references to dynamically created event listeners for cleanup.
    const formInputListeners = new Map();

    // --- Script Entry Point ---
    // Run the initializer function once the DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    /**
     * Main entry point for the script. Runs after the rest of the page has loaded.
     */
    function initialize() {
        loadSettings();
        insertCSS();
        addCredits();
        createControlPanel();
        applyAllFeatures();

        // Add a listener, which changes from other tabs are acted upon.
        GM_addValueChangeListener(SETTINGS_KEY, (name, oldValue, newValue, remote) => {
            // Only react to changes from other tabs.
            if (remote) {
                loadSettings();
                applyAllFeatures();
                updateControlPanelState();
            }
        });
    }

    // --- Core Logic: Settings & Applying Features ---

    /**
     * Loads settings from user's local storage.
     * If no value is stored locally (i.e. for newly introduced features), the default value is used.
     */
    function loadSettings() {
        const savedSettings = GM_getValue(SETTINGS_KEY, {});

        currentSettings = Object.fromEntries(
            Object.keys(defaultSettings).map(key => {
                const entry = { ...defaultSettings[key] };
                if (Object.prototype.hasOwnProperty.call(savedSettings, key)) {
                    // savedSettings stores bare booleans (current format from saveSettings()).
                    // Handle the legacy format too, where the value was a {value: bool} object.
                    const saved = savedSettings[key];
                    entry.value = typeof saved === 'boolean' ? saved : saved.value;
                }
                return [key, entry];
            })
        );
    }

    /**
     * Saves the current settings to GM storage.
     * Only the 'value' (true/false) of each setting is saved to keep the storage clean.
     */
    function saveSettings() {
        const settingsToSave = Object.fromEntries(
            Object.keys(currentSettings).map(key => [key, currentSettings[key].value])
        );
        GM_setValue(SETTINGS_KEY, settingsToSave);
    }

    /**
     * Iterates through the feature map and calls the corresponding function for each feature.
     * Each feature function checks the true/false state of the feature and turns on/off based on that.
     */
    function applyAllFeatures() {
        Object.keys(featureApplicationMap)
        .filter(key => Object.prototype.hasOwnProperty.call(currentSettings, key))
        .forEach(key => featureApplicationMap[key]());
    }

    // --- Feature Implementations ---

    /**
     * Toggles the main site logo between the original and a special version.
     */
    function specialLogo() {
        // Location of the original and special logo, so it's possible to toggle between them.
        const ORIGINAL_LOGO_URL = 'https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/informatique-logo-white-less-fixed.svg';
        const LGBT_LOGO_URL = 'https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/informatique-logo-pride.svg';
        const logoElement = document.querySelector('.informatique-logo');

        if (!logoElement) return;

        logoElement.src = currentSettings.enableSpecialLogo.value ? LGBT_LOGO_URL : ORIGINAL_LOGO_URL;
    }

    // --- BEGIN filter fixes ---
    /**
     * A dispatcher for the filter-related features.
     */
    function filterFix() {
        toggleFilterAutoSubmit(!currentSettings.enableFilterApplyButton.value);
        toggleApplyFiltersButton(currentSettings.enableFilterApplyButton.value);
    }

    /**
     * Toggles the automatic form submission on filter checkboxes.
     * @param {boolean} enable - If true, adds the onclick attribute. If false, removes it.
     */
    function toggleFilterAutoSubmit(enable) {
        document.querySelectorAll('#Filter .form-check-input').forEach(checkbox => {
            if (enable) {
                checkbox.setAttribute('onclick', 'this.form.submit();');
            } else if (checkbox.getAttribute('onclick') === 'this.form.submit();') {
                checkbox.removeAttribute('onclick');
            }
        });
    }

    /**
     * Adds or removes the manual "Filters toepassen" button.
     * @param {boolean} show - If true, adds the button. If false, removes it.
     */
    function toggleApplyFiltersButton(show) {
        const BUTTON_ID = 'iq-tweaks-apply-button';
        const parentDiv = document.querySelector('#LeftFilterCollapse0001 div.card-body.pe-3');

        // Remove existing button first to handle toggling cleanly.
        const existingButtonWrapper = document.getElementById(`${BUTTON_ID}-wrapper`);
        if (existingButtonWrapper) {
            existingButtonWrapper.remove();
        }

        // If the feature is disabled or the parent container doesn't exist, stop here.
        if (!show || !parentDiv) {
            return;
        }

        // Create and append the new button and its wrapper.
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'form-check';
        buttonWrapper.id = `${BUTTON_ID}-wrapper`;

        const applyButton = document.createElement('button');
        applyButton.textContent = 'Filters toepassen';
        applyButton.addEventListener('click', function() { this.form.submit(); });
        applyButton.style.display = 'block';
        applyButton.style.marginTop = '10px';
        applyButton.className = 'btn btn-light';
        applyButton.id = BUTTON_ID;

        buttonWrapper.appendChild(applyButton);
        parentDiv.appendChild(buttonWrapper);
    }

    /**
     * Applies a glowing animation to the "Filters toepassen" button when a filter is changed.
     */
    function applyFilterApplyButtonAnimation() {
        const FORM_SELECTOR = '#Filter';
        const REFRESH_BUTTON_SELECTOR = '#iq-tweaks-apply-button';
        const FORM_CHANGED_BUTTON_STYLE = 'needs-refresh';

        const filterForm = document.querySelector(FORM_SELECTOR);
        // The button might not exist if the other feature is off, so we check for it.
        const refreshButton = document.querySelector(REFRESH_BUTTON_SELECTOR);

        if (!filterForm) return;

        const formKey = filterForm.id || FORM_SELECTOR;
        const isEnabled = currentSettings.enableFilterApplyButtonAnimation.value;

        // Cleanup previous listener if it exists.
        if (formInputListeners.has(formKey)) {
            filterForm.removeEventListener('input', formInputListeners.get(formKey));
            formInputListeners.delete(formKey);
        }
        if(refreshButton) {
            refreshButton.classList.remove(FORM_CHANGED_BUTTON_STYLE);
        }

        if (isEnabled && refreshButton) {
            let initialFormState = new URLSearchParams(new FormData(filterForm)).toString();

            const checkFormState = () => {
                const currentFormState = new URLSearchParams(new FormData(filterForm)).toString();
                refreshButton.classList.toggle(FORM_CHANGED_BUTTON_STYLE, currentFormState !== initialFormState);
            };

            formInputListeners.set(formKey, checkFormState);
            filterForm.addEventListener('input', checkFormState);
            checkFormState();
        }
    }

    // --- END filter fixes ---

    /**
     * Adds the product's article number next to the price on list pages.
     */
    function articleNumberAddition() {
        const isEnabled = currentSettings.enableArticleNumberToMorePlaces.value;
        const ARTICLE_NUMBER_SPAN_CLASS = 'iq-tweaks-artikelnummer';

        // First, remove any spans that were previously added by this script.
        document.querySelectorAll(`span.${ARTICLE_NUMBER_SPAN_CLASS}`).forEach(span => span.remove());

        if (!isEnabled) return; // Exit if the feature is disabled.

        // Find all product containers on the page.
        const productDivs = document.querySelectorAll('div.mt-2');
        productDivs.forEach(div => {
            const priceStrong = div.querySelector('strong.price');
            const basketLink = div.querySelector('a.float-end.btn.btn-clr-basket');

            if (priceStrong && basketLink) {
                const match = basketLink.href.match(/(\d{6})(?!.*\d)/);
                if (match && match[0]) {
                    const artikelnr = match[0];
                    const span = document.createElement('span');
                    span.className = ARTICLE_NUMBER_SPAN_CLASS;
                    span.textContent = `(${artikelnr})`;
                    priceStrong.appendChild(span);
                }
            }
        });
    }

    /**
     * Fixes stock status icons sitewide to be visually distinct:
     *   - "Online op voorraad" / "Op voorraad in ons magazijn": green check (unchanged)
     *   - "Op voorraad bij leverancier" (stock-status-color-2): yellow check
     *   - "Onbekende levertijd" / "levertijd onbekend": gray X
     *
     * Strategy: find the <i> icon element in each stock block, save its original
     * classes, then swap them. One approach for all locations on the site.
     */
    function stockInformationIconFix() {
        const isEnabled = currentSettings.enableStockInformationIconFix.value;
        const MODIFIED_CLASS = 'iq-tweaks-stock-icon-modified';

        // --- Revert: restore original classes on any icon we previously touched ---
        document.querySelectorAll(`i.${MODIFIED_CLASS}`).forEach(icon => {
            icon.className = icon.dataset.iqTweaksOriginalClasses;
            delete icon.dataset.iqTweaksOriginalClasses;
        });

        if (!isEnabled) return;

        // --- Core helper: swap icon classes, saving originals for revert ---
        const fixIcon = (icon, newClasses) => {
            icon.dataset.iqTweaksOriginalClasses = icon.className;
            icon.className = newClasses + ' ' + MODIFIED_CLASS;
        };

        // --- Classify a text block into a stock state ---
        // Returns 'leverancier', 'onbekend', or null (= leave alone / already correct)
        const classifyText = (text) => {
            if (text.includes('werkdagen') || text.includes('weken') ||
                text.includes('leverancier')) return 'leverancier';
            if (text.includes('onbekende levertijd') ||
                text.includes('levertijd onbekend')) return 'onbekend';
            return null;
        };

        // --- Icon class sets ---
        const ICON_LEVERANCIER = 'fa fa-check fa-lg ps-1 text-warning';
        const ICON_ONBEKEND    = 'fa fa-times fa-lg ps-1 text-secondary';

        // --- Find every stock <i> on the page ---
        // The site uses fa-check icons inside stock blocks. We find the icon,
        // read the surrounding text to classify, then swap if needed.
        document.querySelectorAll('i.fa-check, i.fa-times').forEach(icon => {
            // Walk up to find a meaningful text container (max 3 levels)
            let container = icon.parentElement;
            for (let depth = 0; depth < 3 && container; depth++) {
                if (container.textContent.length > 5) break;
                container = container.parentElement;
            }
            if (!container) return;

            const text = container.textContent.toLowerCase();

            // Skip icons that are not stock-related
            if (!text.match(/voorraad|levertijd|werkdagen|weken|leverbaar|magazijn/)) return;

            const state = classifyText(text);
            if (state === 'leverancier') fixIcon(icon, ICON_LEVERANCIER);
            else if (state === 'onbekend') fixIcon(icon, ICON_ONBEKEND);
            // null = in stock / already green, leave it alone
        });
    }

    /**
     * Dispatcher for all content-related features, toggled by the enableContentFeatures setting.
     */
    function contentFeatures() {
        const isEnabled = currentSettings.enableContentFeatures.value;
        contentGroupAddition(isEnabled);
        addAITestFeature(isEnabled);
        toggleAttributeNameDisplay(isEnabled);
    }

    /**
     * Adds the content group to the top of a product page (i.e. "Laptops" becomes "Laptops (095)").
     * @param {boolean} isEnabled
     */
    function contentGroupAddition(isEnabled) {
        const SUFFIX_SPAN_CLASS = 'iq-tweaks-article-suffix';

        // Remove any spans previously added by this function first.
        document.querySelectorAll(`span.${SUFFIX_SPAN_CLASS}`).forEach(span => span.remove());

        if (!isEnabled) return;

        document.querySelectorAll('li.breadcrumb-item.d-md-block a').forEach(link => {
            // Regex to find XXX at the end of the URL, with an optional trailing slash.
            const match = link.href.match(/(\d{3})\/?$/);
            if (match && match[1]) {
                const suffix = match[1];
                const span = document.createElement('span');
                span.className = SUFFIX_SPAN_CLASS;
                span.textContent = ` (${suffix})`;
                link.appendChild(span);
            }
        });
    }

    /**
     * Adds a clickable Tweakers favicon link next to the EAN code on a product page.
     */
    function eanTweakersSearch() {
        const isEnabled = currentSettings.enableEanTweakersSearch.value;
        const LINK_CLASS = 'iq-tweaks-ean-tweakers-link';

        // Remove any previously added links first.
        document.querySelectorAll(`.${LINK_CLASS}`).forEach(el => el.remove());

        if (!isEnabled) return;

        // Find the <dd> labelled "EAN Code" and get the <dt> sibling that holds the value.
        const eanDd = Array.from(document.querySelectorAll('dd.col-lg-4.col-5.text-end.border-bottom'))
        .find(dd => dd.textContent.trim() === 'EAN Code');
        if (!eanDd) return;

        const eanDt = eanDd.nextElementSibling;
        if (!eanDt || eanDt.tagName.toLowerCase() !== 'dt') return;

        const eanSpan = eanDt.querySelector('span.no-tel');
        if (!eanSpan) return;

        const ean = eanSpan.textContent.trim();
        if (!ean) return;

        const link = document.createElement('a');
        link.href = `https://tweakers.net/zoeken/?keyword=${encodeURIComponent(ean)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = `Zoek "${ean}" op Tweakers`;
        link.className = LINK_CLASS;

        const icon = document.createElement('img');
        icon.src = 'https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/tweakers_favicon.ico';
        icon.alt = 'Tweakers';

        link.appendChild(icon);
        eanSpan.after(link);
    }

    /**
     * Injects all necessary CSS into the page using GM_addStyle.
     * This CSS is used for the Control Panel, the toggle buttons within it and the filter button's animation.
     */
    function insertCSS() {
        const sliderSize = 15;
        const panelWidth = 300;
        const panelBackgroundColor = '#f8f9fa';
        const panelBorderColor = '#dee2e6';
        const primaryColor = '#006bb6';
        const primaryColorDark = '#005691';

        GM_addStyle(`
        /* --- Control Panel Wrapper & Toggle Button --- */
        #${SCRIPT_PREFIX}panel-wrapper {
        position: relative; margin-left: auto; display: flex;
        align-items: flex-end; flex-direction: column;
        }
        #${SCRIPT_PREFIX}control-panel-toggle {
        width: 30px; height: 30px; background-color: ${primaryColor};
        color: white; border-radius: 5px; display: flex; justify-content: center;
        align-items: center; cursor: pointer; font-size: 1.2em; z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: transform 0.2s ease-in-out;
        font-family: sans-serif; margin-top: 10px;
        }
        #${SCRIPT_PREFIX}control-panel-toggle.open { transform: rotate(180deg); }

        /* --- Control Panel Box --- */
        #${SCRIPT_PREFIX}control-panel {
        position: absolute; bottom: calc(100% + 10px); right: 0;
        background-color: ${panelBackgroundColor}; border: 1px solid ${panelBorderColor};
        border-radius: 8px; padding: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999; max-height: 80vh; overflow-y: auto;
        width: ${panelWidth}px;
        visibility: hidden; opacity: 0; pointer-events: none;
        transform: translateY(10px);
        transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out, visibility 0s linear 0.2s;
        }
        #${SCRIPT_PREFIX}control-panel.show {
        visibility: visible; opacity: 1; pointer-events: auto;
        transform: translateY(0);
        transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out, visibility 0s linear 0s;
        }
        #${SCRIPT_PREFIX}control-panel h3 {
        margin-top: 0; margin-bottom: 15px; color: #343a40;
        font-size: 1.2em; border-bottom: 1px solid ${panelBorderColor}; padding-bottom: 10px;
        }

        /* --- Feature Items & Toggles within Panel --- */
        .${SCRIPT_PREFIX}feature-item {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dotted #eee;
        }
        .${SCRIPT_PREFIX}feature-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .${SCRIPT_PREFIX}feature-label-and-qmark {
            display: flex; align-items: center; flex-grow: 1; margin-right: 10px;
        }
        .${SCRIPT_PREFIX}feature-label-and-qmark label {
            margin-bottom: 0; cursor: pointer; color: #495057; font-size: 0.95em;
        }
        .${SCRIPT_PREFIX}q-mark-container {
            display: inline-flex; align-items: center; justify-content: center;
            width: 1.1em; height: 1.1em; border: 1px solid ${primaryColor};
            border-radius: 50%; font-size: 0.8em; color: ${primaryColor};
            cursor: help; margin-right: 12px; flex-shrink: 0;
            transition: all 0.2s ease;
        }
        .${SCRIPT_PREFIX}q-mark-container:hover { background-color: #e0f2f7; border-color: ${primaryColorDark}; }

        /* --- Global Tooltip for Help Icons --- */
        #${SCRIPT_PREFIX}global-tooltip {
        width: 220px; background-color: rgba(0, 0, 0, 0.85); color: #fff;
        text-align: center; border-radius: 6px; padding: 8px 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5); font-size: 0.8em; line-height: 1.4;
        position: fixed; z-index: 2147483647; visibility: hidden; opacity: 0;
        transition: opacity 0.2s ease-in-out; pointer-events: none;
        }
        #${SCRIPT_PREFIX}global-tooltip::after {
        content: ""; position: absolute; top: 100%; left: 50%;
        margin-left: -5px; border-width: 5px; border-style: solid;
        border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
        }
        #${SCRIPT_PREFIX}global-tooltip.tooltip-bottom-arrow::after {
        top: -10px; border-color: transparent transparent rgba(0, 0, 0, 0.85) transparent;
        }

        /* --- Slider Switch CSS --- */
        .${SCRIPT_PREFIX}switch {
            position: relative; display: inline-block;
            width: ${sliderSize * 2}px; height: ${sliderSize}px; flex-shrink: 0;
        }
        .${SCRIPT_PREFIX}switch input { opacity: 0; width: 0; height: 0; }
        .${SCRIPT_PREFIX}slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #ccc; transition: .4s; border-radius: ${sliderSize}px;
        }
        .${SCRIPT_PREFIX}slider:before {
            position: absolute; content: ""; height: ${sliderSize * 0.8}px; width: ${sliderSize * 0.8}px;
            left: ${sliderSize / 10}px; bottom: ${sliderSize * 0.1}px;
            background-color: white; transition: .4s; border-radius: 50%;
        }
        .${SCRIPT_PREFIX}switch input:checked + .${SCRIPT_PREFIX}slider { background-color: #2196F3; }
        .${SCRIPT_PREFIX}switch input:checked + .${SCRIPT_PREFIX}slider:before { transform: translateX(${sliderSize}px); }

        /* --- Filter Button Animation --- */
        .needs-refresh {
            background-color: ${primaryColor} !important; color: #ffffff !important;
            border-color: ${primaryColorDark} !important;
            box-shadow: 0 0 10px rgba(0, 107, 182, 0.7);
            animation: pulse-animation 5.0s infinite;
        }
        @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(0, 107, 182, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(0, 107, 182, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 107, 182, 0); }
        }
        /* --- Bug Report Section --- */
        #${SCRIPT_PREFIX}bug-report-text {
        font-size: 0.85em; margin-top: 15px; margin-bottom: 10px;
        }
        #${SCRIPT_PREFIX}copy-bug-info-button {
        display: block; width: 100%; padding: 8px 12px; margin-bottom: 10px;
        }
        /* --- Article Number Addition --- */
        .iq-tweaks-artikelnummer {
            font-size: 0.7em; margin-left: 4px;
        }
        /* --- EAN Tweakers Search --- */
        .iq-tweaks-ean-tweakers-link {
            display: inline-flex; align-items: center;
            margin-left: 6px; vertical-align: middle;
            opacity: 0.8; transition: opacity 0.2s ease;
        }
        .iq-tweaks-ean-tweakers-link:hover { opacity: 1; }
        .iq-tweaks-ean-tweakers-link img {
            width: 14px; height: 14px; display: block;
        }
        /* --- Easter Eggs --- */
        .iq-tweaks-confetti-emoji {
            position: fixed; font-size: 1.6em; pointer-events: none;
            animation: iq-tweaks-confetti-fall 1.2s ease-in forwards;
            z-index: 2147483647;
        }
        @keyframes iq-tweaks-confetti-fall {
            0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
            100% { opacity: 0; transform: translateY(120px) rotate(360deg); }
        }
        #iq-tweaks-konami-msg {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.88); color: #fff; padding: 20px 30px;
        border-radius: 10px; font-size: 1.1em; text-align: center;
        z-index: 2147483647; pointer-events: none;
        animation: iq-tweaks-konami-pop 3s ease forwards;
        }
        @keyframes iq-tweaks-konami-pop {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            12%  { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
            20%  { transform: translate(-50%, -50%) scale(1); }
            75%  { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        `);
    }

    /**
     * Creates the control panel UI and injects it into the page footer.
     */
    function createControlPanel() {
        const targetFooterSection = document.querySelector('section.footer-bottom');
        if (!targetFooterSection) {
            console.warn('IQ🟣Tweaks: Target footer section not found. Control panel will not be added.');
            return;
        }

        const panelWrapper = document.createElement('div');
        panelWrapper.id = SCRIPT_PREFIX + 'panel-wrapper';

        const toggleBtn = document.createElement('div');
        toggleBtn.id = SCRIPT_PREFIX + 'control-panel-toggle';
        toggleBtn.innerHTML = '&#9650;'; // Up arrow
        toggleBtn.title = 'IQ🟣Tweaks Instellingen';

        const panel = document.createElement('div');
        panel.id = SCRIPT_PREFIX + 'control-panel';
        panel.innerHTML = `<h3>IQ🟣Tweaks Instellingen</h3>`;

        panelWrapper.append(toggleBtn, panel);
        targetFooterSection.appendChild(panelWrapper);

        // Create a single, global tooltip element.
        const globalTooltip = document.createElement('div');
        globalTooltip.id = SCRIPT_PREFIX + 'global-tooltip';
        document.body.appendChild(globalTooltip);

        // Populate the panel with toggles for each feature.
        for (const featureKey in defaultSettings) {
            const feature = currentSettings[featureKey];
            const itemDiv = document.createElement('div');
            itemDiv.className = `${SCRIPT_PREFIX}feature-item`;

            // Left side: Help icon and label
            const labelContainer = document.createElement('div');
            labelContainer.className = `${SCRIPT_PREFIX}feature-label-and-qmark`;

            const qMark = document.createElement('span');
            qMark.className = `${SCRIPT_PREFIX}q-mark-container`;
            qMark.textContent = '?';
            qMark.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, feature.description));
            qMark.addEventListener('mouseout', hideTooltip);

            const featureLabel = document.createElement('label');
            featureLabel.htmlFor = SCRIPT_PREFIX + featureKey;
            featureLabel.textContent = feature.title;

            labelContainer.append(qMark, featureLabel);

            // Right side: Toggle switch
            const switchLabel = document.createElement('label');
            switchLabel.className = `${SCRIPT_PREFIX}switch`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = SCRIPT_PREFIX + featureKey;
            checkbox.checked = feature.value;
            checkbox.addEventListener('change', (e) => {
                currentSettings[featureKey].value = e.target.checked;
                saveSettings();
                applyAllFeatures();
            });

            const sliderSpan = document.createElement('span');
            sliderSpan.className = `${SCRIPT_PREFIX}slider round`;

            switchLabel.append(checkbox, sliderSpan);
            itemDiv.append(labelContainer, switchLabel);
            panel.appendChild(itemDiv);
        }

        const bugReportText = document.createElement('p');
        bugReportText.id = SCRIPT_PREFIX + 'bug-report-text';
        bugReportText.textContent = `IQ🟣Tweaks ${VERSION_NUMBER} - Heb je een bug gevonden? Druk op deze knop om belangrijke info te kopiëren en stuur een email.`;

        const copyBugInfoButton = document.createElement('button');
        copyBugInfoButton.textContent = 'Kopieer info';
        copyBugInfoButton.className = 'btn btn-primary';
        copyBugInfoButton.id = SCRIPT_PREFIX + 'copy-bug-info-button';

        panel.appendChild(document.createElement('hr')); // Optional separator for visual distinction
        panel.appendChild(bugReportText);
        panel.appendChild(copyBugInfoButton);

        // Add event listener for the bug info copy button
        copyBugInfoButton.addEventListener('click', () => {
            const websiteLink = window.location.href;
            const userAgent = navigator.userAgent;

            // Data-driven browser detection: each entry is [guard, regex, label].
            // The first matching entry wins.
            const browserRules = [
                [ua => ua.includes("Chrome") && !ua.includes("Chromium"), /(Chrome)\/([\d.]+)/,     (m) => `${m[1]} ${m[2]}`],
                                           [ua => ua.includes("Firefox"),                             /(Firefox)\/([\d.]+)/,    (m) => `${m[1]} ${m[2]}`],
                                           [ua => ua.includes("Safari") && !ua.includes("Chrome"),   /Version\/([\d.]+).*Safari/, (m) => `Safari ${m[1]}`],
                                           [ua => ua.includes("Edg"),                                 /Edg\/([\d.]+)/,           (m) => `Edge ${m[1]}`],
                                           [ua => ua.includes("Opera") || ua.includes("OPR"),        /(Opera|OPR)\/([\d.]+)/,   (m) => `Opera ${m[2]}`],
                                           [ua => ua.includes("MSIE"),                                /MSIE ([\d.]+)/,            (m) => `Internet Explorer ${m[1]}`],
                                           [ua => ua.includes("Trident"),                             /rv:([\d.]+).*Trident/,     (m) => `Internet Explorer 11 (Trident/${m[1]})`],
            ];

            let browserInfo = "Onbekende browser";
            for (const [guard, regex, format] of browserRules) {
                if (guard(userAgent)) {
                    const match = userAgent.match(regex);
                    if (match) { browserInfo = format(match); }
                    break;
                }
            }


            const bugInfoToCopy = `
            - Website link: ${websiteLink}
            - IQ🟣Tweaks versie: ${VERSION_NUMBER}
            - Gebruikte webbrowser: ${browserInfo}
            `.trim();

            // Copy to clipboard using the modern Clipboard API.
            navigator.clipboard.writeText(bugInfoToCopy).then(() => {
                showTemporaryMessage('Bug info gekopieerd!');
            }).catch(err => {
                console.error('Failed to copy bug info: ', err);
                showTemporaryMessage('Kopiëren mislukt.');
            });
        });

        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('show');
            toggleBtn.classList.toggle('open');
        });
    }

    /**
     * Updates the checkboxes in the control panel to reflect the current settings, so they are changed even when adjusted in another tab.
     */
    function updateControlPanelState() {
        const panel = document.getElementById(SCRIPT_PREFIX + 'control-panel');
        if (!panel) return;

        for (const featureKey in currentSettings) {
            const checkbox = document.getElementById(SCRIPT_PREFIX + featureKey);
            if (checkbox) {
                checkbox.checked = currentSettings[featureKey].value;
            }
        }
    }

    // --- Clipboard / Notification Helper ---

    /**
     * Briefly shows a small notification message on screen, then fades it out.
     * @param {string} message - The text to display.
     */
    function showTemporaryMessage(message) {
        const TOAST_ID = SCRIPT_PREFIX + 'toast';

        // Reuse an existing toast element if one is already in the DOM.
        let toast = document.getElementById(TOAST_ID);
        if (!toast) {
            toast = document.createElement('div');
            toast.id = TOAST_ID;
            toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
            background-color: rgba(0,0,0,0.8); color: #fff;
            padding: 10px 16px; border-radius: 6px; font-size: 0.9em;
            opacity: 0; transition: opacity 0.3s ease-in-out;
            pointer-events: none; font-family: sans-serif;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';

        clearTimeout(toast._hideTimeout);
        toast._hideTimeout = setTimeout(() => {
            toast.style.opacity = '0';
        }, 2500);
    }

    // --- Tooltip Helper Functions ---
    let tooltipTimeout;
    function showTooltip(targetElement, text) {
        const globalTooltip = document.getElementById(SCRIPT_PREFIX + 'global-tooltip');
        if (!globalTooltip) return;

        clearTimeout(tooltipTimeout);
        globalTooltip.textContent = text;
        globalTooltip.style.visibility = 'visible';
        globalTooltip.style.opacity = '1';

        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = globalTooltip.getBoundingClientRect();
        const margin = 10;

        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Adjust position to stay within viewport
        if (left < margin) left = margin;
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = window.innerWidth - tooltipRect.width - margin;
        }
        if (top < margin) {
            top = targetRect.bottom + margin;
            globalTooltip.classList.add('tooltip-bottom-arrow');
        } else {
            globalTooltip.classList.remove('tooltip-bottom-arrow');
        }

        globalTooltip.style.top = `${top}px`;
        globalTooltip.style.left = `${left}px`;
    }

    function hideTooltip() {
        const globalTooltip = document.getElementById(SCRIPT_PREFIX + 'global-tooltip');
        if (!globalTooltip) return;

        tooltipTimeout = setTimeout(() => {
            globalTooltip.style.opacity = '0';
            // Use transitionend to set visibility to hidden after fade out
            globalTooltip.addEventListener('transitionend', () => {
                globalTooltip.style.visibility = 'hidden';
            }, { once: true });
        }, 200);
    }

    /**
     * Adds script credits to the page footer.
     */
    function addCredits() {
        const footerDiv = document.querySelector('.footer-bottom');
        if (!footerDiv) return;

        if (footerDiv.querySelector('.iq-tweaks-credits')) return; // already added

        const p = document.createElement('p');
        p.textContent = `IQ🟣Tweaks ${VERSION_NUMBER} created by mini of Hop On LLC - Original idea by 🎸`;
        p.className = 'text-muted mb-0 iq-tweaks-credits';
        footerDiv.appendChild(p);
    }

    /**
     * Placeholder for future experimental features.
     * Previously toggled addAITestFeature and toggleAttributeNameDisplay,
     * which have since been moved to contentFeatures().
     */
    function experimentalFeatures() {
        // No experimental features currently active.
    }

    // --- Easter Egg helpers ---

    /** Spawns emoji particles bursting outward from a point on screen. */
    function spawnConfetti(x, y, emojis, count = 10) {
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'iq-tweaks-confetti-emoji';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.style.left = `${x + (Math.random() - 0.5) * 120}px`;
            el.style.top  = `${y + (Math.random() - 0.5) * 40}px`;
            document.body.appendChild(el);
            el.addEventListener('animationend', () => el.remove());
        }
    }

    /**
     * Toggles all fun/easter-egg features.
     */
    function funFeatures() {
        const isEnabled = currentSettings.enableFunFeatures.value;

        // Use a single attribute on <body> to namespace all fun-feature listeners,
        // so we can cleanly remove them when the feature is toggled off.
        const ACTIVE_ATTR = 'data-iq-tweaks-fun-active';

        if (!isEnabled) {
            document.body.removeAttribute(ACTIVE_ATTR);
            // Disconnect basket observer if one was stored from a previous activation.
            document.body._iqTweaksBasketObserver?.disconnect();
            delete document.body._iqTweaksBasketObserver;
            return;
        }

        // Guard against double-registering if applyAllFeatures is called again.
        if (document.body.hasAttribute(ACTIVE_ATTR)) return;
        document.body.setAttribute(ACTIVE_ATTR, '1');

        // --- 1. Nerd confetti on "Specificaties" tab click ---
        document.querySelectorAll('a[data-bs-target="#tab_specs"]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (!currentSettings.enableFunFeatures.value) return;
                spawnConfetti(e.clientX, e.clientY, ['🤓', '📋', '🔧', '💻', '📐'], 12);
            });
        });

        // --- 2. Konami code easter egg ---
        const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        let konamiProgress = 0;
        document.addEventListener('keydown', (e) => {
            if (!currentSettings.enableFunFeatures.value) return;
            // Don't intercept keypresses while the user is typing in a field.
            if (e.target.matches('input, textarea, select, [contenteditable]')) return;
            if (e.key === KONAMI[konamiProgress]) {
                konamiProgress++;
                if (konamiProgress === KONAMI.length) {
                    konamiProgress = 0;
                    const msg = document.createElement('div');
                    msg.id = 'iq-tweaks-konami-msg';
                    msg.innerHTML = '🎮 Cheats ingeschakeld!<br><small style="opacity:0.7">...maar er zijn geen cheats.</small>';
                    document.body.appendChild(msg);
                    msg.addEventListener('animationend', () => msg.remove());
                }
            } else {
                konamiProgress = e.key === KONAMI[0] ? 1 : 0;
            }
        });

        // --- 3. Basket count 69 = nice ---
        // Instead of a toast, replaces the basket count number with "nice" when it hits 69.
        const basketCountEl = document.querySelector('.basket_count');
        if (basketCountEl) {
            const checkBasket69 = (count) => {
                if (count === '69') {
                    basketCountEl.dataset.iqTweaksOriginal69 = count;
                    basketCountEl.textContent = 'nice';
                } else if (basketCountEl.dataset.iqTweaksOriginal69 && count !== 'nice') {
                    // Count changed away from 69, restore normal behavior
                    delete basketCountEl.dataset.iqTweaksOriginal69;
                }
            };
            checkBasket69(basketCountEl.textContent.trim());
            const basketObserver = new MutationObserver(() => {
                if (!currentSettings.enableFunFeatures.value) return;
                checkBasket69(basketCountEl.textContent.trim());
            });
            basketObserver.observe(basketCountEl, { childList: true, characterData: true, subtree: true });
            document.body._iqTweaksBasketObserver = basketObserver;
        }
    }

    /**
     * Adds or removes the product information extraction and display feature to the page.
     * This function can be called externally by other Tampermonkey scripts.
     *
     * @param {boolean} enable - If `true`, the feature will attempt to add the content.
     * If `false`, the feature will attempt to remove any existing content added by this feature.
     */
    function addAITestFeature(enable) {
        // --- Common check for existing feature elements ---
        const existingAITestDd = Array.from(document.querySelectorAll('dd.col-lg-4.col-5.text-end.border-bottom'))
        .find(dd => dd.querySelector('#iq-tweaks-ai-test-copy-button'));
        const existingAITestDt = existingAITestDd ? existingAITestDd.nextElementSibling : null;

        if (!enable) {
            if (existingAITestDd && existingAITestDt && existingAITestDt.tagName.toLowerCase() === 'dt') {
                existingAITestDd.remove();
                existingAITestDt.remove();
            }
            return;
        }

        if (existingAITestDd) return;

        let AITestInfoParts = []; // Use an array to manage parts for easier joining
        let lastDtElement = null; // To keep track of the last <dt> element found for insertion

        // --- Helper function to find and extract text ---
        // Iterates through all potential elements and extracts the text from the following <dt>.
        const extractInfo = (label) => {
            const ddElement = Array.from(document.querySelectorAll('dd.col-lg-4.col-5.text-end.border-bottom'))
            .find(dd => dd.textContent.trim() === label);

            if (ddElement) {
                const dtElement = ddElement.nextElementSibling;
                // Ensure the next sibling is indeed a <dt> tag.
                if (dtElement && dtElement.tagName.toLowerCase() === 'dt') {
                    return dtElement;
                }
            }
            return null;
        };

        // --- Extracting Artikelnummer (6 digits only, ignoring any trailing location code) ---
        const artikelnummerDT = extractInfo('Artikelnummer');
        if (artikelnummerDT) {
            const match = artikelnummerDT.textContent.match(/\d{6}/);
            if (match) AITestInfoParts.push(match[0]);
            lastDtElement = artikelnummerDT;
        }

        let vendorName = null;
        // --- Extracting Vendor Name from img alt text ---
        const vendorLogoImg = document.querySelector('img.vendor-logo.float-end');
        if (vendorLogoImg && vendorLogoImg.alt) {
            // Regex to extract text after "over " and before the final "."
            const match = vendorLogoImg.alt.match(/over\s([^.]+)\./);
            if (match && match[1]) {
                vendorName = match[1].trim();
            }
        }

        // --- Extracting Fabrikantcode ---
        const fabrikantcodeDT = extractInfo('Fabrikantcode');

        // Combine vendorName and fabrikantcode with a space, if both exist
        if (vendorName && fabrikantcodeDT) {
            AITestInfoParts.push(`${vendorName} ${fabrikantcodeDT.textContent.trim()}`);
            lastDtElement = fabrikantcodeDT; // fabrikantcodeDT is the last original element found here
        } else if (vendorName) { // Only vendor name found
            AITestInfoParts.push(vendorName);
            // No DT element associated with vendorName directly for insertion tracking,
            // so lastDtElement remains whatever it was before (e.g., artikelnummerDT)
        } else if (fabrikantcodeDT) { // Only fabrikantcode found
            AITestInfoParts.push(fabrikantcodeDT.textContent.trim());
            lastDtElement = fabrikantcodeDT;
        }


        // --- Extracting EAN Code ---
        const eanCodeDT = extractInfo('EAN Code');
        if (eanCodeDT) {
            AITestInfoParts.push(eanCodeDT.textContent.trim());
            lastDtElement = eanCodeDT; // EAN Code DT will be the definitive lastDtElement for insertion
        }

        // Join all collected parts with ", "
        const AITestInfo = AITestInfoParts.join(', ');

        // --- Insert new elements if information was found and a lastDtElement exists ---
        // Ensure AITestInfo is not empty to avoid adding an empty field.
        if (AITestInfo.trim() !== '' && lastDtElement) {
            // The <dd> becomes the copy button itself, sitting naturally in the right-aligned label column.
            const newDd = document.createElement('dd');
            newDd.className = 'col-lg-4 col-5 text-end border-bottom';

            const copyButton = document.createElement('button');
            copyButton.className = 'btn btn-light btn-sm';
            copyButton.id = 'iq-tweaks-ai-test-copy-button';
            copyButton.textContent = 'Copy info';
            newDd.appendChild(copyButton);

            // The <dt> holds only the info text span, with no button to push it onto a second line.
            const newDt = document.createElement('dt');
            newDt.className = 'col-lg-8 col-7 border-bottom';

            const spanElement = document.createElement('span');
            spanElement.className = 'no-tel';
            spanElement.textContent = AITestInfo;
            newDt.appendChild(spanElement);

            lastDtElement.after(newDd);
            newDd.after(newDt);

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(spanElement.textContent).then(() => {
                    showTemporaryMessage('Gekopieerd naar klembord!');
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    showTemporaryMessage('Kopiëren mislukt.');
                });
            });
        }
        // else: no usable product info found on this page — feature silently skipped.
    }

    /**
     * Adds the attribute name to each attribute in the filter panel
     * @param {boolean} enable - If true, the attribute names are added to the target tags.
     * If false, any previously added attribute names are removed.
     */
    function toggleAttributeNameDisplay(enable) {
        const filterArticles = document.querySelectorAll('article.filter-group');
        if (filterArticles.length === 0) return;

        filterArticles.forEach(article => {
            const checkbox = article.querySelector('input.form-check-input[type="checkbox"]');
            const targetElement = article.querySelector('h6') || article.querySelector('p.h6');
            if (!checkbox || !targetElement) return;

            const existingSpan = targetElement.querySelector('.iq-tweaks-attribute-name');

            if (!enable) {
                existingSpan?.remove();
                return;
            }

            if (existingSpan) return;

            const span = document.createElement('span');
            span.classList.add('iq-tweaks-attribute-name');
            span.textContent = ` (${checkbox.name.replace(/^at/i, '')})`;

            const firstITag = targetElement.querySelector('i');
            firstITag ? targetElement.insertBefore(span, firstITag) : targetElement.appendChild(span);
        });
    }
})();
