// ==UserScript==
// @name         IQ🟣Tweaks
// @version      0.10.3
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

(async function() {
    'use strict';

    const versionNumber = "0.10.3";
    addCredits(versionNumber);

    // Define the original and new logo, plus the logo element it should change.
    const ORIGINAL_LOGO_URL = 'https://www.informatique.nl/new2023/assets/img/informatique-logo-white-30y.svg?v=1';
    const LGBT_LOGO_URL = 'https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/informatique-logo-white-30y-june.svg';
    const LOGO_ELEMENT = document.querySelector('.informatique-logo');

    // Constants for animation
    const FORM_SELECTOR = '#Filter'; // ID of the filter form
    const REFRESH_BUTTON_SELECTOR = '#applyButton'; // ID of the custom apply button
    const FORM_CHANGED_BUTTON_STYLE = 'needs-refresh'; // Class name for the animation
    // Map to store references to the dynamically created event listeners
    // This is crucial for removing them later.
    const formInputListeners = new Map();

    // --- Configuration and Default Settings ---
    const SCRIPT_PREFIX = 'IQTweak_'; // Unique prefix for GM_values to avoid conflicts
    const SETTINGS_KEY = SCRIPT_PREFIX + 'settings';

    // Modified defaultSettings: Each feature is now an object with value, title, and description.
    const defaultSettings = {
        enableSpecialLogo: { value: false, title: "Speciaal logo", description: "Geeft het Informatique logo een speciale look!" },
        enableSuperSpecialLogo: { value: false, title: "Super speciaal logo", description: "Een nog meer speciale look voor het logo, gemaakt na aanvraag!" },
        enableFilterApplyButton: { value: true, title: "Filter toepassen", description: "Zorgt ervoor dat de filters niet automatisch de pagina verversen en voegt een nieuwe knop toe om handmatig te verversen." },
        enableFilterApplyButtonAnimation: { value: true, title: "Filters toepassen knop animatie", description: "Wanneer je een filter hebt geselecteerd speelt de filter toepassen knop een animatie af, om beter op te vallen." },
        enableArticleNumberToMorePlaces: { value: true, title: "Artikelnr. op hoofd-/zoekpagina", description: "Voegt het artikelnr. van een product toe naast de prijs, op de hoofd- en zoekpagina's." },
        enableStockInformationIconFix: { value: true, title: "Voorraadstatus icoon fix", description: "Zorgt dat de iconen voor voorraad (leverancier/onbekend) consistent zijn." },
        enableContentGroupAddition: { value: false, title: "Content groep bij categorie", description: "Voegt de contentgroep voor een productcategorie toe wanneer je op een productpagina bent." },
        enableExperimentalFeatures: { value: false, title: "Experimentele functies", description: "Weet nog niet echt wat... Misschien beta features ofzo." },
    };

    let currentSettings = {}; // This will hold the loaded or current settings
    const featureApplicationMap = {
        enableSpecialLogo: specialLogo,
        /*enableSuperSpecialLogo: superSpecialLogo,*/
        enableFilterApplyButton : filterFix,
        enableFilterApplyButtonAnimation : applyFilterApplyButtonAnimation,
        enableArticleNumberToMorePlaces : articleNumberAddition,
        enableStockInformationIconFix : stockInformationIconFix,
        enableContentGroupAddition : contentGroupAddition,
        enableExperimentalFeatures: experimentalFeatures,
    };

    // Ensure the script runs after the DOM is fully loaded to prevent issues
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize(); // DOM is already ready
    }

    // --- Initialization ---
    function initialize() {
        loadSettings();
        insertCSS();
        createControlPanel();
        applyAllFeatures(); // Apply features initially on page load

        // Live syncing across tabs
        GM_addValueChangeListener(SETTINGS_KEY, (name, old_value, new_value, remote) => {
            if (remote) { // Only react to changes from other tabs/scripts
                loadSettings(); // Reload settings
                applyAllFeatures(); // Re-apply all features
                const panel = document.getElementById(SCRIPT_PREFIX + 'control-panel');
                if (panel && panel.classList.contains('show')) {
                    // Update states of existing checkboxes
                    for (const featureKey in currentSettings) {
                        const checkbox = document.getElementById(SCRIPT_PREFIX + featureKey);
                        if (checkbox) {
                            checkbox.checked = currentSettings[featureKey].value;
                        }
                    }
                }
            }
        });
    }

    // --- Core Logic: Load, Apply, Save Settings ---
    function loadSettings() {
        const savedSettings = GM_getValue(SETTINGS_KEY, {});
        let loaded = {};

        for (const key in defaultSettings) {
            loaded[key] = { ...defaultSettings[key] }; // Start with default structure (value, title, description)

            if (savedSettings.hasOwnProperty(key)) {
                if (typeof savedSettings[key] === 'boolean') {
                    loaded[key].value = savedSettings[key]; // Old boolean format
                }
            }
        }
        currentSettings = loaded;
    }

    function saveSettings() {
        const settingsToSave = {};
        for (const key in currentSettings) {
            settingsToSave[key] = currentSettings[key].value; // Only save the 'value'
        }
        GM_setValue(SETTINGS_KEY, settingsToSave);
    }

    // Changes the top logo to a special variant.
    function specialLogo(){
        if (LOGO_ELEMENT) {
            // If enabled is true, use LGBT_LOGO_URL, otherwise use ORIGINAL_LOGO_URL
            LOGO_ELEMENT.src = currentSettings.enableSpecialLogo.value ? LGBT_LOGO_URL : ORIGINAL_LOGO_URL;
        }

    }

    function applyAllFeatures() {
        // Iterate through the map and call each associated apply function.
        // Each apply function is responsible for checking its own setting's state
        // and performing activation/deactivation/cleanup.
        for (const featureKey in featureApplicationMap) {
            // It's good practice to ensure the feature key actually exists in currentSettings
            // before trying to apply it, though it should if your defaultSettings are consistent.
            if (currentSettings.hasOwnProperty(featureKey)) {
                featureApplicationMap[featureKey](); // Call the function mapped to this feature key
            }
        }
        // Any global functions that don't directly tie to a single toggle,
        // like perhaps your debug console logs if they run regardless of settings,
        // could still be called here.
        // applyDebugConsoleLogs();
    }

    // --- Control Panel UI ---
    function createControlPanel() {
        const targetFooterSection = document.querySelector('section.footer-bottom.d-flex.justify-content-lg-between.border-top');

        if (!targetFooterSection) {
            console.warn('Nyaaa! Target footer section not found for control panel placement. Panel will not be added.');
            return;
        }

        // Create a wrapper for the toggle and panel
        const panelWrapper = document.createElement('div');
        panelWrapper.id = SCRIPT_PREFIX + 'panel-wrapper';

        // Create the toggle button (arrow)
        const toggleBtn = document.createElement('div');
        toggleBtn.id = SCRIPT_PREFIX + 'control-panel-toggle';
        toggleBtn.innerHTML = '&#9650;'; // Up arrow
        panelWrapper.appendChild(toggleBtn);

        // Create the main control panel container
        const panel = document.createElement('div');
        panel.id = SCRIPT_PREFIX + 'control-panel';
        panel.innerHTML = `<h3>IQ🟣Tweaks control panel</h3>`; // Panel Title
        panelWrapper.appendChild(panel);

        // Append the entire wrapper to the target footer section
        targetFooterSection.appendChild(panelWrapper);

        // Create a single, global tooltip element and append it to the body
        const globalTooltip = document.createElement('div');
        globalTooltip.id = SCRIPT_PREFIX + 'global-tooltip';
        document.body.appendChild(globalTooltip);

        // Populate the panel with toggles for each feature
        const populatePanelContent = (targetPanel) => {
            for (const featureKey in defaultSettings) {
                const featureItemDiv = document.createElement('div');
                featureItemDiv.classList.add(`${SCRIPT_PREFIX}feature-item`);

                // Container for the feature title and question mark
                const labelAndQmarkContainer = document.createElement('div');
                labelAndQmarkContainer.classList.add(`${SCRIPT_PREFIX}feature-label-and-qmark`);

                const featureTitleLabel = document.createElement('label');
                featureTitleLabel.htmlFor = SCRIPT_PREFIX + featureKey;
                featureTitleLabel.textContent = currentSettings[featureKey].title;

                const qMarkContainer = document.createElement('span');
                qMarkContainer.classList.add(`${SCRIPT_PREFIX}q-mark-container`);
                qMarkContainer.textContent = '?';

                // --- CHANGED ORDER HERE ---
                labelAndQmarkContainer.appendChild(qMarkContainer);
                labelAndQmarkContainer.appendChild(featureTitleLabel);
                // --- END CHANGED ORDER ---

                // Create the slider switch for the checkbox
                const switchLabel = document.createElement('label');
                switchLabel.className = 'switch';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = SCRIPT_PREFIX + featureKey;
                checkbox.checked = currentSettings[featureKey].value;

                const sliderSpan = document.createElement('span');
                sliderSpan.className = 'slider round';

                switchLabel.appendChild(checkbox);
                switchLabel.appendChild(sliderSpan);

                featureItemDiv.appendChild(labelAndQmarkContainer);
                featureItemDiv.appendChild(switchLabel);
                targetPanel.appendChild(featureItemDiv);

                // Event listener for checkbox change
                checkbox.addEventListener('change', (event) => {
                    currentSettings[featureKey].value = event.target.checked;
                    saveSettings();
                    applyAllFeatures();
                });

                // Event listeners for global tooltip
                qMarkContainer.addEventListener('mouseover', (event) => {
                    globalTooltip.textContent = currentSettings[featureKey].description;
                    const qMarkRect = event.currentTarget.getBoundingClientRect();
                    let tooltipTop = qMarkRect.top - globalTooltip.offsetHeight - 10;
                    let tooltipLeft = qMarkRect.left + (qMarkRect.width / 2) - (globalTooltip.offsetWidth / 2);

                    const margin = 5;
                    if (tooltipLeft < margin) {
                        tooltipLeft = margin;
                    }
                    if (tooltipLeft + globalTooltip.offsetWidth > window.innerWidth - margin) {
                        tooltipLeft = window.innerWidth - globalTooltip.offsetWidth - margin;
                    }

                    if (tooltipTop < margin) {
                        tooltipTop = qMarkRect.bottom + 10;
                        globalTooltip.classList.add('tooltip-bottom-arrow');
                    } else {
                        globalTooltip.classList.remove('tooltip-bottom-arrow');
                    }

                    globalTooltip.style.top = `${tooltipTop}px`;
                    globalTooltip.style.left = `${tooltipLeft}px`;
                    globalTooltip.style.visibility = 'visible';
                    globalTooltip.style.opacity = '1';
                });

                qMarkContainer.addEventListener('mouseout', () => {
                    globalTooltip.style.opacity = '0';
                    setTimeout(() => {
                        globalTooltip.style.visibility = 'hidden';
                    }, 200);
                });
            }
        };

        // Initial population
        populatePanelContent(panel);

        // Event listener for the toggle button to show/hide the panel
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('show');
            toggleBtn.classList.toggle('open');
        });
    }

    /// Credits and version number a the bottom of the page.
    function addCredits(versionNumber){
        const footerDiv = document.querySelector('.footer-bottom.d-flex.justify-content-lg-between.border-top');
        if(footerDiv){
            const p = document.createElement('p');
            p.textContent = 'IQ🟣Tweaks ' + versionNumber + ' created by Hop On LLC - Original idea by 🎸';
            p.className = 'text-muted mb-0';
            footerDiv.appendChild(p);
        }
    }

    // Adds an "Apply Filters" button to the website and removes the page refresh from all filters.
    function filterFix(){
        removeRefreshFromFilters(currentSettings.enableFilterApplyButton.value);
        addRefreshFilterButton(currentSettings.enableFilterApplyButton.value);
    }

    // Removes or adds back the refresh function to filters.
    // True: removes refresh (so the webpage doesn't reload prematurely).
    // False: adds back the refresh (default website functionality).
    function removeRefreshFromFilters(remove){
        const checkboxes = document.querySelectorAll('.form-check-input');
        checkboxes.forEach((checkbox) => {
            if (remove) {
                const onclickAttr = checkbox.getAttribute('onclick');
                if (onclickAttr && onclickAttr.trim() === 'this.form.submit();') {
                    checkbox.removeAttribute('onclick');
                }
            } else {
                checkbox.setAttribute('onclick', 'this.form.submit();');
            }
        });
    }
    // Adds a seperate "Filter apply" button to the filter page, or removes it.
    // True: adds the "Filter apply" button.
    // False: removes the "Filter apply" button.
    function addRefreshFilterButton(addButton) {
        // The unique ID we've given to the button
        const buttonId = "applyButton";

        if (addButton) {
            // --- Logic to ADD the button ---

            // Find the container div with ID 'LeftFilterCollapse0001'
            const parentDiv = document.getElementById('LeftFilterCollapse0001');
            if (parentDiv !== null) {
                const filterDiv = parentDiv.querySelector('div.card-body.pe-3');

                if (filterDiv) {
                    // Check if the button already exists to prevent duplicates
                    if (document.getElementById(buttonId)) {
                        return;
                    }

                    // Create a new div with class "form-check"
                    const buttonDiv = document.createElement('div');
                    buttonDiv.className = 'form-check';
                    buttonDiv.id = buttonId + '-wrapper'; // Give the wrapper a unique ID too, if you need to target it

                    // Create the "Filters toepassen" button
                    const applyButton = document.createElement('button');
                    applyButton.textContent = 'Filters toepassen';
                    applyButton.setAttribute('onclick', 'this.form.submit();'); // This will trigger the form submission
                    applyButton.style.display = 'block';
                    applyButton.style.marginTop = '10px';
                    applyButton.className = 'btn btn-light';
                    applyButton.id = buttonId; // Assign the unique ID to the button

                    // Append the button at the bottom of the div
                    buttonDiv.appendChild(applyButton);

                    // Append the div to the container
                    filterDiv.appendChild(buttonDiv);
                }
            }
        } else {
            // --- Logic to REMOVE the button ---

            // Find the button using its unique ID
            const existingButton = document.getElementById(buttonId);

            if (existingButton) {
                // Remove the button's parent div (the 'form-check' wrapper)
                // to ensure full cleanup of the element added by this script.
                // If the wrapper itself has an ID, we can target it specifically.
                const buttonWrapper = document.getElementById(buttonId + '-wrapper');
                if (buttonWrapper) {
                    buttonWrapper.remove();
                } else {
                    // Fallback: If for some reason wrapper ID isn't found, remove button directly
                    existingButton.remove();
                }
            }
        }
    }

    // To make the "Filters toepassen" button more obvious, it will glow when a filter is chosen.
    function applyFilterApplyButtonAnimation(enable) {
        const filterForm = document.querySelector(FORM_SELECTOR);
        const refreshButton = document.querySelector(REFRESH_BUTTON_SELECTOR);

        if (!filterForm || !refreshButton) {
            console.error("Filter form or refresh button not found. Cannot apply/remove animation.");
            return;
        }

        // Use the form's ID as a unique key for the listener, or a fallback selector
        const formKey = filterForm.id || FORM_SELECTOR;

        if (currentSettings.enableFilterApplyButtonAnimation.value) { // If the setting is enabled (true)
            // Only add listener if it's not already added for this form
            if (!formInputListeners.has(formKey)) {
                // Capture the initial state of the form when the animation is enabled
                let initialFormState = getFormState(filterForm);

                // Define the event listener function. It's a closure that remembers initialFormState.
                const checkFormState = () => {
                    const currentFormState = getFormState(filterForm);
                    if (currentFormState !== initialFormState) {
                        refreshButton.classList.add(FORM_CHANGED_BUTTON_STYLE);
                    } else {
                        refreshButton.classList.remove(FORM_CHANGED_BUTTON_STYLE);
                    }
                };

                // Store the listener function reference so we can remove it later
                formInputListeners.set(formKey, checkFormState);
                filterForm.addEventListener('input', checkFormState);

                // Perform an initial check in case the form is already changed when the script loads
                checkFormState();

            }
        } else { // If the setting is disabled (false)
            // Remove the listener if it exists
            if (formInputListeners.has(formKey)) {
                const checkFormState = formInputListeners.get(formKey);
                filterForm.removeEventListener('input', checkFormState);
                formInputListeners.delete(formKey); // Clean up the map
                refreshButton.classList.remove(FORM_CHANGED_BUTTON_STYLE); // Ensure class is removed on disable
            }
            // Ensure the class is removed from the button, even if the listener wasn't found
            refreshButton.classList.remove(FORM_CHANGED_BUTTON_STYLE);
        }
    }

    // This function is used in applyFilterApplyButtonAnimation(); to serialize the current state of the filter form, to compare initial with the current state.
    function getFormState(form) {
        return new URLSearchParams(new FormData(form)).toString();
    }

    /// Add artikelnr. to search page (behind price)
    function articleNumberAddition(){
        const divs = document.querySelectorAll('div.mt-2');
        const ARTICLE_NUMBER_SPAN_CLASS = 'iq-tweaks-artikelnummer'; // Unique class for spans added by this feature

        if (currentSettings.enableArticleNumberToMorePlaces.value) {
            divs.forEach(div => {
                // Only add if it hasn't been added before in this div
                if (div.querySelector(`span.${ARTICLE_NUMBER_SPAN_CLASS}`)) {
                    return; // Skip if already present
                }

                const targetLinks = div.querySelectorAll('a.float-end.btn.btn-clr-basket.btn-icon.text-white.mt-2.me-1');
                targetLinks.forEach(link => {
                    const priceStrong = div.querySelector('strong.price');
                    if (priceStrong) {
                        const match = link.href.match(/(\d{6})(?!.*\d)/);
                        if (match && match[0]) {
                            const artikelnr = match[0];
                            const span = document.createElement('span');
                            span.classList.add(ARTICLE_NUMBER_SPAN_CLASS); // Add our unique class
                            span.style.fontSize = '0.7em';
                            span.textContent = ' (' + artikelnr + ')';
                            priceStrong.appendChild(span);
                        }
                    }
                });
            });
        } else {
            // Remove all spans added by this feature
            document.querySelectorAll(`span.${ARTICLE_NUMBER_SPAN_CLASS}`).forEach(span => {
                span.remove();
            });
        }
    }

    function stockInformationIconFix(){
        adjustLevertijdIconsOnSearch(currentSettings.enableStockInformationIconFix.value);
        adjustLevertijdIconsOnProductPage(currentSettings.enableStockInformationIconFix.value);
        adjustLevertijdIconsElsewhere(currentSettings.enableStockInformationIconFix.value);
    }
    /// Adjust levertijd icons on search and basket page (Yellow/orange tick or gray X icon).
    function adjustLevertijdIconsOnSearch(enable) {
        const smallElements = document.querySelectorAll('small.text-muted');

        // Unique classes to mark elements added/modified by this function
        const MODIFIED_CHECK_CLASS = 'iq-tweaks-lever-check-modified';
        const ADDED_X_ICON_CLASS = 'iq-tweaks-lever-x-icon';
        const ORIGINAL_TEXT_ATTR = 'data-iq-tweaks-original-text'; // To store original text for 'Onbekende levertijd'

        smallElements.forEach(small => {
            const textContent = small.textContent.trim();

            if (enable) {
                // --- ENABLE LOGIC ---
                // If leverbaar within certain werkdagen
                if (textContent.includes("werkdagen")) {
                    const icon = small.querySelector('i');
                    if (icon) {
                        // text-warning turns the icon orange/yellow.
                        // Add a custom class to identify that we modified this
                        icon.classList.add('fa', 'fa-check', 'fa-lg', 'ps-1', 'text-warning', 'me-1', MODIFIED_CHECK_CLASS);
                    }
                }
                // Adds an X-icon for Onbekende levertijd.
                else if (textContent.includes("Onbekende levertijd")) {
                    // Prevent adding duplicate icons if already enabled
                    if (!small.querySelector(`.${ADDED_X_ICON_CLASS}`)) {
                        const newIcon = document.createElement('i');
                        newIcon.classList.add('fa', 'fa-times', 'fa-lg', 'ps-1', 'text-times', 'me-1', ADDED_X_ICON_CLASS);

                        // Save the original text before emptying it, then clear it.
                        small.setAttribute(ORIGINAL_TEXT_ATTR, small.textContent);
                        small.textContent = "";

                        // Searches for six digits followed by a pipe (|) symbol.
                        const pattern = /^\d{6} \|/;

                        // Check if the text matches the pattern
                        if (pattern.test(small.getAttribute(ORIGINAL_TEXT_ATTR))) {
                            const match = small.getAttribute(ORIGINAL_TEXT_ATTR).match(/^(\d{6} \|)/);
                            if (match && match[1]) {
                                small.textContent += match[1];
                            }
                        }

                        // Add the icon.
                        small.appendChild(newIcon);
                        // Add the text back.
                        const span = document.createElement('span');
                        span.textContent = "Onbekende levertijd";
                        small.appendChild(span);
                    }
                }
            } else {
                // --- DISABLE LOGIC (Revert) ---
                // Revert 'werkdagen' icon
                const icon = small.querySelector(`i.${MODIFIED_CHECK_CLASS}`);
                if (icon) {
                    icon.classList.remove('fa', 'fa-check', 'fa-lg', 'ps-1', 'text-warning', 'me-1', MODIFIED_CHECK_CLASS);
                    // You might need to add back original classes if they were explicitly removed
                    // e.g., icon.classList.add('original-class');
                }

                // Remove 'Onbekende levertijd' icon and revert text
                const addedIcon = small.querySelector(`i.${ADDED_X_ICON_CLASS}`);
                if (addedIcon) {
                    const originalText = small.getAttribute(ORIGINAL_TEXT_ATTR);
                    if (originalText) {
                        small.textContent = originalText; // Restore original text
                        small.removeAttribute(ORIGINAL_TEXT_ATTR);
                    } else {
                        // Fallback if original text wasn't saved (e.g., script reloaded)
                        small.textContent = small.textContent.replace(/\s*(?:x|times)\s*Onbekende levertijd/i, 'Onbekende levertijd'); // Simple heuristic cleanup
                    }
                    addedIcon.remove(); // Remove the icon
                }
            }
        });
    }

    /// Adjust levertijd icons on product page (Yellow/orange tick or gray X icon).
    function adjustLevertijdIconsOnProductPage(enable) {
        const targetElements = document.querySelectorAll('.col-lg-8.col-7.border-bottom');

        // Unique classes to mark elements added/modified by this function
        const MODIFIED_SUCCESS_SPAN_CLASS = 'iq-tweaks-product-span-modified';
        const ADDED_ICON_SPAN_CLASS = 'iq-tweaks-product-icon-span';

        targetElements.forEach(element => {
            const textContentLower = element.textContent.toLowerCase();
            const successSpan = element.querySelector('span.text-success'); // Original success span

            if (enable) {
                // --- ENABLE LOGIC ---
                if (textContentLower.includes("werkdagen")) {
                    if (successSpan && !successSpan.classList.contains(MODIFIED_SUCCESS_SPAN_CLASS)) {
                        successSpan.classList.remove('text-success');
                        successSpan.classList.add('danger', MODIFIED_SUCCESS_SPAN_CLASS); // Mark as modified

                        const checkmarkSpan = document.createElement('span');
                        checkmarkSpan.setAttribute('role', 'status');
                        checkmarkSpan.style.color = 'rgb(255, 193, 7)';
                        checkmarkSpan.setAttribute('data-bs-toggle', 'tooltip');
                        checkmarkSpan.setAttribute('data-bs-placement', 'top');
                        checkmarkSpan.setAttribute('title', '');
                        checkmarkSpan.setAttribute('data-bs-html', 'true');
                        checkmarkSpan.setAttribute('data-bs-original-title', 'Op voorraad bij leverancier');
                        checkmarkSpan.innerHTML = '<i class="fa fa-check fa-lg" aria-hidden="true"></i>';
                        checkmarkSpan.classList.add(ADDED_ICON_SPAN_CLASS); // Mark as added by script

                        successSpan.parentNode.insertBefore(checkmarkSpan, successSpan);
                    }
                } else if (textContentLower.includes("levertijd onbekend") || textContentLower.includes("onbekende levertijd")) {
                    if (successSpan && !successSpan.classList.contains(MODIFIED_SUCCESS_SPAN_CLASS)) {
                        successSpan.classList.remove('text-success');
                        successSpan.classList.add('text-muted', MODIFIED_SUCCESS_SPAN_CLASS); // Mark as modified

                        const timesIconSmall = document.createElement('small');
                        timesIconSmall.classList.add('text-muted');
                        timesIconSmall.innerHTML = '<i class="fa fa-times fa-lg ps-1 text-times me-1"></i>';
                        timesIconSmall.classList.add(ADDED_ICON_SPAN_CLASS); // Mark as added by script

                        successSpan.parentNode.insertBefore(timesIconSmall, successSpan);
                    }
                }
            } else {
                // --- DISABLE LOGIC (Revert) ---
                // Revert modified successSpan
                if (successSpan && successSpan.classList.contains(MODIFIED_SUCCESS_SPAN_CLASS)) {
                    successSpan.classList.remove('danger', 'text-muted', MODIFIED_SUCCESS_SPAN_CLASS);
                    successSpan.classList.add('text-success'); // Revert to original class
                }

                // Remove icons added by this script within this element
                const addedIcons = element.querySelectorAll(`.${ADDED_ICON_SPAN_CLASS}`);
                addedIcons.forEach(icon => icon.remove());
            }
        });
    }

    /// Adjust levertijd icons elsewhere (Yellow/orange tick, "Onbekende levertijd" already has an appropriate icon).
    function adjustLevertijdIconsElsewhere(enable) {
        const stockDivs = document.querySelectorAll('div.card-product-list-stock');
        const MODIFIED_COLOR_CLASS = 'iq-tweaks-color-modified'; // Unique class for color change

        stockDivs.forEach(div => {
            const span = div.querySelector('span');
            // Target elements that originally had green color in style and "Op voorraad bij leverancier"
            const styleElements = div.querySelectorAll('[style*="color:#009400"]');

            if (enable) {
                // --- ENABLE LOGIC ---
                if (span && span.getAttribute('aria-label') === 'Op voorraad bij leverancier') {
                    styleElements.forEach(el => {
                        // Change inline style, but also add a class to mark it
                        el.style.color = '#ffc107'; // Yellow/orange
                        el.classList.add(MODIFIED_COLOR_CLASS); // Mark for easy reversion
                    });
                }
            } else {
                // --- DISABLE LOGIC (Revert) ---
                styleElements.forEach(el => {
                    // Only revert if our script previously modified it
                    if (el.classList.contains(MODIFIED_COLOR_CLASS)) {
                        el.style.color = '#009400'; // Revert to original green
                        el.classList.remove(MODIFIED_COLOR_CLASS);
                    }
                });
            }
        });
    }

    function contentGroupAddition(){
        const breadcrumbItems = document.querySelectorAll('li.breadcrumb-item.breadcrumb-item-nowrap.d-none.d-md-block');
        const ARTICLE_SUFFIX_SPAN_CLASS = 'iq-tweaks-article-suffix'; // Unique class for the span we add

        if (currentSettings.enableContentGroupAddition.value) {
            // --- ENABLE LOGIC ---
            breadcrumbItems.forEach(item => {
                const link = item.querySelector('a');
                // Only proceed if the link exists AND our suffix span is NOT already present in it
                if (link && !link.querySelector(`span.${ARTICLE_SUFFIX_SPAN_CLASS}`)) {
                    const href = link.href;
                    // THIS REGEX ALREADY ACCOUNTS FOR BOTH CASES (WITH OR WITHOUT A TRAILING SLASH):
                    // It looks for 'g', then captures 3 digits (\d{3}), then looks for an optional slash (\/?), at the end of the string ($)
                    const match = href.match(/(\d{3})\/?$/);

                    if (match && match[1]) {
                        const suffix = match[1];
                        const span = document.createElement('span');
                        span.classList.add(ARTICLE_SUFFIX_SPAN_CLASS); // Add our unique class
                        span.textContent = ` (${suffix})`;

                        // Append the span to the link text.
                        link.appendChild(span);
                    }
                }
            });
        } else {
            // --- DISABLE LOGIC (Revert) ---
            breadcrumbItems.forEach(item => {
                const link = item.querySelector('a');
                if (link) {
                    // Find and remove any suffix spans added by this feature within the link
                    const existingSuffixSpan = link.querySelector(`span.${ARTICLE_SUFFIX_SPAN_CLASS}`);
                    if (existingSuffixSpan) {
                        existingSuffixSpan.remove();
                    }
                }
            });
        }
    }

    function experimentalFeatures(){
        if(currentSettings.enableExperimentalFeatures.value){
            console.log("turned on experimental features");
        }
        else{
            console.log("turned off experimental features");
        }
    }

    // Control panel and slider CSS.
    function insertCSS(){
        const sliderSize = 15;
        GM_addStyle(`
            .switch {
                position: relative;
                display: inline-block;
                width: ${sliderSize * 2}px; /* e.g., 36px for sliderSize 20 */
                height: ${sliderSize}px;     /* e.g., 20px for sliderSize 20 */
                flex-shrink: 0;
            }

            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                -webkit-transition: .4s;
                transition: .4s;
                border-radius: ${sliderSize / 1}px; /* e.g., 10px for sliderSize 20 */
            }

            .slider:before {
                position: absolute;
                content: "";
                height: ${sliderSize * 0.8}px; /* e.g., 16px for sliderSize 20 */
                width: ${sliderSize * 0.8}px;  /* e.g., 16px for sliderSize 20 */
                left: ${sliderSize / 10}px;   /* e.g., 2px for sliderSize 20 */
                bottom: ${sliderSize * 0.1}px;  /* e.g., 2px for sliderSize 20 */
                background-color: white;
                -webkit-transition: .4s;
                transition: .4s;
                border-radius: 50%;
            }

            input:checked + .slider {
                background-color: #2196F3;
            }

            input:checked + .slider:before {
                -webkit-transform: translateX(${sliderSize * 1}px);
                transform: translateX(${sliderSize * 1}px);
            }
            #${SCRIPT_PREFIX}panel-wrapper {
                position: relative;
                margin-left: auto;
                display: flex;
                align-items: flex-end;
                flex-direction: column;
            }
            #${SCRIPT_PREFIX}control-panel-toggle {
                width: 30px;
                height: 30px;
                background-color: #006bb6;
                color: white;
                border-radius: 5px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                font-size: 1.2em;
                z-index: 9999;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                transition: transform 0.2s ease-in-out;
                font-family: sans-serif;
                margin-top: 10px;
            }
            #${SCRIPT_PREFIX}control-panel-toggle.open {
                transform: rotate(180deg);
            }
            #${SCRIPT_PREFIX}control-panel {
                position: absolute;
                bottom: calc(100% + 10px);
                right: 0;
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 9998;
                max-height: 80vh;
                overflow-y: auto; /* Keep overflow for panel content */
                width: 280px;
                display: none;
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                opacity: 0;
                transform: translateY(10px);
            }
            #${SCRIPT_PREFIX}control-panel.show {
                display: block;
                opacity: 1;
                transform: translateY(0);
            }
            #${SCRIPT_PREFIX}control-panel h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #343a40;
                font-size: 1.2em;
                border-bottom: 1px solid #dee2e6;
                padding-bottom: 10px;
            }

            /* Main container for each feature row */
            .${SCRIPT_PREFIX}feature-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
                padding-bottom: 5px;
                border-bottom: 1px dotted #eee;
            }
            .${SCRIPT_PREFIX}feature-item:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            /* Container for the title text and question mark */
            .${SCRIPT_PREFIX}feature-label-and-qmark {
                display: flex;
                align-items: center;
                flex-grow: 1;
                margin-right: 10px;
            }
            .${SCRIPT_PREFIX}feature-label-and-qmark label {
                margin-bottom: 0;
                cursor: pointer;
                color: #495057;
                font-size: 0.95em;
            }

            /* Styles for the new question mark icon with a circle */
            .${SCRIPT_PREFIX}q-mark-container {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.1em;
                height: 1.1em;
                border: 1px solid #006bb6;
                border-radius: 50%;
                font-size: 0.8em;
                color: #006bb6;
                cursor: pointer;
                margin-left: 0px;
                margin-right: 12px;
                flex-shrink: 0;
                transition: all 0.2s ease;
            }
            .${SCRIPT_PREFIX}q-mark-container:hover {
                background-color: #e0f2f7;
                border-color: #004a7a;
                color: #004a7a;
            }

            /* --- Global Tooltip Styles --- */
            #${SCRIPT_PREFIX}global-tooltip {
                /* Common tooltip text styles */
                width: 220px;
                background-color: rgba(0, 0, 0, 0.85);
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 8px 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                font-size: 0.8em;
                line-height: 1.4;

                /* Positioning and visibility controlled by JS */
                position: fixed; /* NEW: Fixed positioning to float over everything */
                z-index: 2147483647; /* Highest possible z-index to be on top */
                visibility: hidden; /* Default hidden */
                opacity: 0;       /* Default transparent */
                transition: opacity 0.2s ease-in-out; /* Fade effect */
                pointer-events: none; /* Allows interaction with elements underneath */
            }

            /* Default arrow for tooltip (pointing upwards, tooltip is above the icon) */
            #${SCRIPT_PREFIX}global-tooltip::after {
                content: "";
                position: absolute;
                top: 100%; /* At the bottom of the tooltip */
                left: 50%;
                margin-left: -5px; /* Half of border-width */
                border-width: 5px;
                border-style: solid;
                border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
            }

            /* Arrow style for when tooltip is displayed BELOW the icon */
            #${SCRIPT_PREFIX}global-tooltip.tooltip-bottom-arrow::after {
                top: -10px; /* Position at the top of the tooltip */
                border-color: transparent transparent rgba(0, 0, 0, 0.85) transparent; /* Point downwards */
            }
            .${FORM_CHANGED_BUTTON_STYLE} {
                background-color: #006bb6 !important; /* Main blue color */
                color: #ffffff !important; /* Text color changed to white */
                border-color: #005691 !important; /* Darker shade of blue for border */
                box-shadow: 0 0 10px rgba(0, 107, 182, 0.7); /* Box shadow based on blue */
                animation: pulse-animation 5.0s infinite; /* Animation speed in seconds */
            }

            @keyframes pulse-animation {
                0% {
                    box-shadow: 0 0 0 0 rgba(0, 107, 182, 0.7); /* Pulse start color based on blue */
                }
                70% {
                    box-shadow: 0 0 0 10px rgba(0, 107, 182, 0); /* Pulse end color (fading out) */
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(0, 107, 182, 0); /* Fully fades out */
                }
            }
        `);
    }
})
();
