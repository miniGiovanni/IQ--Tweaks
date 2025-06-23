// ==UserScript==
// @name         IQ🟣Tweaks
// @version      0.13.4
// @author       mini
// @homepage     https://github.com/miniGiovanni/IQ--Tweaks
// @supportURL   https://github.com/miniGiovanni/IQ--Tweaks
// @downloadURL  https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/IQ%F0%9F%9F%A3Tweaks.user.js
// @updateURL    https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/IQ%F0%9F%9F%A3Tweaks.user.js
// @copyright    WTFPL license, 2025.
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
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration and Global State ---
    const SCRIPT_PREFIX = 'IQTweak_';
    const SETTINGS_KEY = SCRIPT_PREFIX + 'settings';
    const VERSION_NUMBER = "0.13.4"; // This version number comes from your provided script

    // These features can be turned on/off by the user in the control panel, and the settings will be saved locally.
    // Most features are true (turned on) by default, but some features are optional and thus false (turned off) by default.
    const defaultSettings = {
        enableSpecialLogo: { value: false, title: "Speciaal logo", description: "Geeft het Informatique logo een speciale look!" },
        //enableSuperSpecialLogo: { value: false, title: "Super speciaal logo", description: "Nog een specialer logo, gemaakt op aanvraag." },
        enableFilterApplyButton: { value: true, title: "Filter toepassen knop", description: "Voorkomt automatisch verversen van de pagina en voegt een handmatige 'Filters toepassen' knop toe." },
        enableFilterApplyButtonAnimation: { value: true, title: "Animatie voor filterknop", description: "De 'Filters toepassen' knop krijgt een animatie als er een filter is gewijzigd." },
        enableArticleNumberToMorePlaces: { value: true, title: "Artikelnr. op hoofdpagina", description: "Voegt het artikelnummer toe naast de prijs op de hoofdpagina." },
        enableStockInformationIconFix: { value: true, title: "Voorraadstatus icoon fix", description: "Maakt de iconen voor voorraadstatus (leverancier/onbekend) overal op de site consistent." },
        enableContentGroupAddition: { value: false, title: "Contentgroep bij categorie", description: "Voegt de contentgroep-code toe aan de breadcrumb op productpagina's." },
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
        enableContentGroupAddition: contentGroupAddition,
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
        createControlPanel(); // This is where the new content will be added
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
        const loaded = {};

        for (const key in defaultSettings) {
            loaded[key] = { ...defaultSettings[key] }; // Start with default structure.

            // Overwrite with saved value if it exists.
            if (Object.prototype.hasOwnProperty.call(savedSettings, key)) {
                // This handles the old format where the value was just a boolean.
                loaded[key].value = typeof savedSettings[key] === 'boolean' ? savedSettings[key] : savedSettings[key].value;
            }
        }
        currentSettings = loaded;
    }

    /**
     * Saves the current settings to GM storage.
     * Only the 'value' (true/false) of each setting is saved to keep the storage clean.
     */
    function saveSettings() {
        const settingsToSave = {};
        for (const key in currentSettings) {
            settingsToSave[key] = currentSettings[key].value;
        }
        GM_setValue(SETTINGS_KEY, settingsToSave);
    }

    /**
     * Iterates through the feature map and calls the corresponding function for each feature.
     * Each feature function checks the true/false state of the feature and tuns on/off based on that.
     */
    function applyAllFeatures() {
        for (const featureKey in featureApplicationMap) {
            if (Object.prototype.hasOwnProperty.call(currentSettings, featureKey)) {
                // Call the feature function.
                featureApplicationMap[featureKey]();
            }
        }
    }

    // --- Feature Implementations ---

    /**
     * Toggles the main site logo between the original and a special version.
     */
    function specialLogo() {
        // Location of the original and special logo, so it's possible to toggle between them.
        const ORIGINAL_LOGO_URL = 'https://www.informatique.nl/new2023/assets/img/informatique-logo-white-30y.svg?v=1';
        const LGBT_LOGO_URL = 'https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/informatique-logo-white-30y-june.svg';
        const logoElement = document.querySelector('.informatique-logo');

        if (!logoElement) return;

        logoElement.src = currentSettings.enableSpecialLogo.value ? LGBT_LOGO_URL : ORIGINAL_LOGO_URL;
    }

    /// -- BEGIN of filter fixes ---
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
        const checkboxes = document.querySelectorAll('#Filter .form-check-input');
        checkboxes.forEach(checkbox => {
            if (enable) {
                checkbox.setAttribute('onclick', 'this.form.submit();');
            } else {
                // Only remove the attribute if it exists and matches.
                if (checkbox.getAttribute('onclick') === 'this.form.submit();') {
                    checkbox.removeAttribute('onclick');
                }
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
        applyButton.onclick = function() { this.form.submit(); };
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
                if (currentFormState !== initialFormState) {
                    refreshButton.classList.add(FORM_CHANGED_BUTTON_STYLE);
                } else {
                    refreshButton.classList.remove(FORM_CHANGED_BUTTON_STYLE);
                }
            };

            formInputListeners.set(formKey, checkFormState);
            filterForm.addEventListener('input', checkFormState);
            checkFormState();
        }
    }

    /// -- END of filter fixes ---

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
                    span.style.fontSize = '0.7em';
                    span.style.marginLeft = '4px';
                    span.textContent = `(${artikelnr})`;
                    priceStrong.appendChild(span);
                }
            }
        });
    }

    /**
     * Fixes the stock information icons, by adding them/recoloring them.
     */
    function stockInformationIconFix() {
        const isEnabled = currentSettings.enableStockInformationIconFix.value;
        const MODIFIED_CLASS = 'iq-tweaks-stock-icon-modified';

        // --- Helper function to revert changes ---
        const revertChanges = (el) => {
            if (el.dataset.originalColor) {
                el.style.color = el.dataset.originalColor;
            }
            if (el.dataset.originalClasses) {
                el.className = el.dataset.originalClasses;
            }
            if (el.dataset.addedByScript) {
                el.remove();
            }
            if (el.dataset.iqTweaksOriginalText) {
                el.textContent = el.dataset.iqTweaksOriginalText;
            }
            el.classList.remove(MODIFIED_CLASS);
            for (const key in el.dataset) {
                if (key.startsWith('iqTweaks') || key.startsWith('original') || key === 'addedByScript') {
                    delete el.dataset[key];
                }
            }
        };
        // --- Revert all changes first ---
        document.querySelectorAll(`.${MODIFIED_CLASS}`).forEach(revertChanges);

        if (!isEnabled) return;

        // --- Helper function for applying icon fixes to small elements ---
        const applySmallElementFix = (small, iconClass, textColor) => {
            small.dataset.iqTweaksOriginalText = small.innerHTML;
            small.classList.add(MODIFIED_CLASS);

            const text = small.textContent;
            const regex = /^(\d+\s*\|\s*)(.*)$/;
            const match = text.match(regex);

            const iconHtml = `<i class="${iconClass} ps-1 ${textColor} me-1 ${MODIFIED_CLASS}" data-added-by-script="true"></i>`;
            small.innerHTML = match ? match[1] + iconHtml + match[2] : iconHtml + text;
        };

        // --- Apply fixes ---

        // 1. Search/Basket Page (.text-muted small elements)
        document.querySelectorAll('small.text-muted').forEach(small => {
            const text = small.textContent;

            if (text.includes("werkdagen") || text.includes("weken")) {
                applySmallElementFix(small, 'fa fa-check fa-lg', 'text-warning');
            } else if (text.includes("Onbekende levertijd")) {
                applySmallElementFix(small, 'fa fa-times fa-lg', 'text-times');
            } else if (text.includes("Direct uit voorraad leverbaar")) {
                applySmallElementFix(small, 'fa fa-check fa-lg', 'text-success');
            }
        });

        // 2. Product Page (.col-lg-8.col-7.border-bottom)
        document.querySelectorAll('.col-lg-8.col-7.border-bottom').forEach(element => {
            const text = element.textContent.toLowerCase();
            const successSpan = element.querySelector('span.text-success');
            if (!successSpan) return;

            const applyProductPageFix = (iconClass, color, title) => {
                successSpan.dataset.originalClasses = successSpan.className;
                successSpan.className = `text-muted ${MODIFIED_CLASS}`;

                const iconSpan = document.createElement('span');
                iconSpan.className = MODIFIED_CLASS;
                iconSpan.dataset.addedByScript = 'true';
                iconSpan.style.color = color;
                iconSpan.setAttribute('title', title);
                iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
                successSpan.parentNode.insertBefore(iconSpan, successSpan);
            };

            if (text.includes("werkdagen") || text.includes("weken")) {
                console.log("test here");
                applyProductPageFix('fa fa-check fa-lg', 'rgb(255, 193, 7)', 'Op voorraad bij leverancier');
            } else if (text.includes("levertijd onbekend")) {
                applyProductPageFix('fa fa-times fa-lg ps-1 text-times me-1', 'inherit', 'Levertijd onbekend');
            }
        });

        // 3. Elsewhere (.card-product-list-stock)
        document.querySelectorAll('div.card-product-list-stock').forEach(div => {
            const label = div.querySelector('span[aria-label="Op voorraad bij leverancier"]');
            if (label) {
                const elementToColor = div.querySelector('[style*="color:#009400"]');
                if (elementToColor) {
                    elementToColor.classList.add(MODIFIED_CLASS);
                    elementToColor.dataset.originalColor = '#009400';
                    elementToColor.style.color = '#ffc107';
                }
            }
        });
    }

    /**
     * Adds the content group to the top of a product page (i.e. "Laptops" become "Laptops (095)").
     */
    function contentGroupAddition() {
        const isEnabled = currentSettings.enableContentGroupAddition.value;
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
                width: ${panelWidth}px; display: none;
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                opacity: 0; transform: translateY(10px);
            }
            #${SCRIPT_PREFIX}control-panel.show { display: block; opacity: 1; transform: translateY(0); }
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
            .switch {
                position: relative; display: inline-block;
                width: ${sliderSize * 2}px; height: ${sliderSize}px; flex-shrink: 0;
            }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider {
                position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc; transition: .4s; border-radius: ${sliderSize}px;
            }
            .slider:before {
                position: absolute; content: ""; height: ${sliderSize * 0.8}px; width: ${sliderSize * 0.8}px;
                left: ${sliderSize / 10}px; bottom: ${sliderSize * 0.1}px;
                background-color: white; transition: .4s; border-radius: 50%;
            }
            input:checked + .slider { background-color: #2196F3; }
            input:checked + .slider:before { transform: translateX(${sliderSize}px); }

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
        panel.innerHTML = `<h3>IQ🟣Tweaks Instellingen</h3>`; // Using &#x1F7E3; for the purple circle emoji

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
            switchLabel.className = 'switch';

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
            sliderSpan.className = 'slider round';

            switchLabel.append(checkbox, sliderSpan);
            itemDiv.append(labelContainer, switchLabel);
            panel.appendChild(itemDiv);
        }

        // --- Add the smaller text and copy bug info button ---
        const bugReportText = document.createElement('p');
        bugReportText.style.fontSize = '0.85em';
        bugReportText.style.marginTop = '15px';
        bugReportText.style.marginBottom = '10px';
        bugReportText.innerHTML = `IQ🟣Tweaks ${VERSION_NUMBER} - Heb je een bug gevonden? Druk op deze knop om belangrijk info te kopiëren en stuur een email.`;

        const copyBugInfoButton = document.createElement('button');
        copyBugInfoButton.textContent = 'Kopieer info';
        copyBugInfoButton.style.display = 'block';
        copyBugInfoButton.style.width = '100%';
        copyBugInfoButton.style.padding = '8px 12px';
        copyBugInfoButton.style.marginBottom = '10px'; // Add some space below the button
        copyBugInfoButton.className = 'btn btn-primary'; // Using a primary button style for prominence
        copyBugInfoButton.id = SCRIPT_PREFIX + 'copy-bug-info-button';

        panel.appendChild(document.createElement('hr')); // Optional separator for visual distinction
        panel.appendChild(bugReportText);
        panel.appendChild(copyBugInfoButton);

        // Add event listener for the bug info copy button
        copyBugInfoButton.addEventListener('click', () => {
            const websiteLink = window.location.href;
            const scriptVersion = VERSION_NUMBER;
            const userAgent = navigator.userAgent;

            let browserInfo = "Onbekende browser";
            // Basic browser detection logic
            // This prioritizes common browsers and tries to extract version numbers.
            if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) {
                const match = userAgent.match(/(Chrome)\/(\d+\.\d+\.\d+\.\d+)/);
                if (match) browserInfo = `${match[1]} ${match[2]}`;
            } else if (userAgent.includes("Firefox")) {
                const match = userAgent.match(/(Firefox)\/(\d+\.\d+)/);
                if (match) browserInfo = `${match[1]} ${match[2]}`;
            } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
                 const match = userAgent.match(/Version\/(\d+\.\d+\.\d+).*Safari/);
                 if (match) browserInfo = `Safari ${match[1]}`;
            } else if (userAgent.includes("Edg")) { // New Edge (Chromium-based)
                const match = userAgent.match(/(Edge?)\/(\d+\.\d+)/);
                if (match) browserInfo = `Edge ${match[2]}`;
            } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
                const match = userAgent.match(/(Opera|OPR)\/(\d+\.\d+)/);
                if (match) browserInfo = `Opera ${match[2]}`;
            } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) { // Older IE and IE11
                if (userAgent.includes("MSIE")) {
                    const match = userAgent.match(/MSIE (\d+\.\d+)/);
                    if (match) browserInfo = `Internet Explorer ${match[1]}`;
                } else { // IE 11
                    const match = userAgent.match(/rv:(\d+\.\d+).*Trident/);
                    if (match) browserInfo = `Internet Explorer 11 (Trident/${match[1]})`;
                }
            }


            const bugInfoToCopy = `
- Website link: ${websiteLink}
- IQ🟣Tweaks versie: ${scriptVersion}
- Gebruikte webbrowser: ${browserInfo}
            `.trim(); // .trim() to remove leading/trailing whitespace

            // Copy to clipboard logic using a temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = bugInfoToCopy;
            textarea.style.position = 'fixed'; // Prevents scrolling to bottom of page in some browsers
            textarea.style.left = '-9999px'; // Move out of view
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                console.log('Bug info copied:', bugInfoToCopy);
                showTemporaryMessage('Bug info copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy bug info: ', err);
                showTemporaryMessage('Failed to copy bug info.');
            } finally {
                document.body.removeChild(textarea);
            }
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
        if (!panel || !panel.classList.contains('show')) return;

        for (const featureKey in currentSettings) {
            const checkbox = document.getElementById(SCRIPT_PREFIX + featureKey);
            if (checkbox) {
                checkbox.checked = currentSettings[featureKey].value;
            }
        }
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
        if (footerDiv) {
            const p = document.createElement('p');
            p.textContent = `IQ🟣Tweaks ${VERSION_NUMBER} created by mini of Hop On LLC - Original idea by 🎸`;
            p.className = 'text-muted mb-0';
            footerDiv.appendChild(p);
        }
    }

    /**
     * Experimental features (not ready for full use) will be added here.
     */
    function experimentalFeatures() {
        const isEnabled = currentSettings.enableExperimentalFeatures.value;
        if (isEnabled) {
            console.log("IQ🟣Tweaks: Experimental features enabled.");
            addAITestFeature(isEnabled);
            toggleAttributeNameDisplay(isEnabled);
        } else {
            console.log("IQ🟣Tweaks: Experimental features disabled.");
            addAITestFeature(isEnabled);
            toggleAttributeNameDisplay(isEnabled);
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
            .find(dd => dd.textContent.trim() === 'Content AI test');
        const existingAITestDt = existingAITestDd ? existingAITestDd.nextElementSibling : null;

        if (!enable) {
            console.log("AI Test Info feature disabled by external call. Attempting to remove existing elements.");
            // If the feature is present, remove it
            if (existingAITestDd && existingAITestDt && existingAITestDt.tagName.toLowerCase() === 'dt') {
                existingAITestDd.remove();
                existingAITestDt.remove();
                console.log("AI Test Info feature removed successfully.");
            } else {
                console.log("AI Test Info feature not found on page, no removal needed.");
            }
            return; // Exit after handling removal
        }

        // --- If 'enable' is true, proceed with adding the feature (if not already present) ---
        if (existingAITestDd) {
            console.log("AI Test Info feature already present. Skipping addition.");
            return; // Exit if the feature is already on the page
        }

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

        // --- Extracting Artikelnummer ---
        const artikelnummerDT = extractInfo('Artikelnummer');
        if (artikelnummerDT) {
            AITestInfoParts.push(artikelnummerDT.textContent.trim());
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
            // Create the <dd> element: <dd class="col-lg-4 col-5 text-end border-bottom">Content AI test</dd>
            const newDd = document.createElement('dd');
            newDd.className = 'col-lg-4 col-5 text-end border-bottom';
            newDd.textContent = 'Content AI test';

            // Create the <dt> element: <dt class="col-lg-8 col-7 border-bottom"><span class="no-tel">TEXTHERE</span></dt>
            const newDt = document.createElement('dt');
            newDt.className = 'col-lg-8 col-7 border-bottom';

            // Create the "Copy" button
            const copyButton = document.createElement('button');
            copyButton.style.cssText = "display: block;";
            copyButton.className = 'btn btn-light'; // Use provided class
            copyButton.id = 'iq-tweaks-apply-button'; // Use provided ID
            copyButton.textContent = 'Copy';

            // Create the <span> element to hold the AITestInfo text
            const spanElement = document.createElement('span');
            spanElement.className = 'no-tel';
            spanElement.textContent = AITestInfo;

            // Append button and text to the new <dt>
            newDt.appendChild(copyButton);
            newDt.appendChild(spanElement);

            // Insert the new <dd> and <dt> elements right after the last found <dt>.
            // The .after() method inserts nodes or strings after the current node.
            lastDtElement.after(newDd);
            newDd.after(newDt); // Insert newDt after the newDd

            // --- Add event listener for the copy button ---
            copyButton.addEventListener('click', () => {
                const textToCopy = spanElement.textContent; // Get the content from the span

                // Create a temporary textarea to copy the text to clipboard
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed'; // Prevents scrolling to bottom of page in some browsers
                textarea.style.left = '-9999px'; // Move out of view
                document.body.appendChild(textarea);
                textarea.select();

                try {
                    document.execCommand('copy');
                    console.log('Text copied:', textToCopy);
                    showTemporaryMessage('Copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showTemporaryMessage('Failed to copy text.');
                } finally {
                    document.body.removeChild(textarea);
                }
            });
        } else {
            console.log("Could not find all required product info elements or AITestInfo is empty. Feature not added.");
        }
    }

    /**
     * Adds the attribute name to each attribute in the filter panel
     * @param {boolean} enable - If true, the attribute names are added to the target tags.
     * If false, any previously added attribute names are removed.
     */
    function toggleAttributeNameDisplay(enable) {
        // Select all <article> elements that have the class "filter-group"
        const filterArticles = document.querySelectorAll('article.filter-group');

        // If no articles with the specified class are found, log a message and exit the function early.
        if (filterArticles.length === 0) {
            console.log('No <article class="filter-group"> elements found. Script will not proceed.');
            return;
        }

        // Iterate over each found article element.
        filterArticles.forEach(article => {
            // Find the first checkbox input within the current article.
            const checkbox = article.querySelector('input.form-check-input[type="checkbox"]');

            // Find the target element for appending: prioritize <h6>, then <p class="h6">.
            const targetElement = article.querySelector('h6') || article.querySelector('p.h6');

            // If either the checkbox or the target element is not found, skip to the next article.
            if (!checkbox || !targetElement) {
                return; // Acts like 'continue' for Array.prototype.forEach
            }

            // Get the attribute name and remove the leading "at" (case-insensitive) if present.
            const attributeName = checkbox.name.replace(/^at/i, '');

            // Check for an existing span that was previously added by this script.
            const existingSpan = targetElement.querySelector('.tampermonkey-added-attribute-name');

            if (enable) {
                // If enabling the display:
                // Only add if the span does not already exist within the target element.
                if (!existingSpan) {
                    const span = document.createElement('span');
                    span.classList.add('tampermonkey-added-attribute-name');
                    span.textContent = ` (${attributeName})`;

                    // Find the first <i> tag within the target element.
                    const firstITag = targetElement.querySelector('i');

                    // If an <i> tag is found, insert the new span before it; otherwise, append to the end.
                    if (firstITag) {
                        targetElement.insertBefore(span, firstITag);
                    } else {
                        targetElement.appendChild(span);
                    }
                }
            } else {
                // If disabling the display:
                // Only remove if the span currently exists within the target element.
                if (existingSpan) {
                    existingSpan.remove();
                }
            }
        });
    }
})();
