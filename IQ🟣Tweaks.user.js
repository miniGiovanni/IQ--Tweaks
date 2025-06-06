// ==UserScript==
// @name         IQ🟣Tweaks
// @version      0.7.3
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
// @icon         https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/favicon.ico
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let versionNumber = "v0.7.2";
    addCredits(versionNumber);
    removeRefreshFromFilters();
    addRefreshFilterButton();
    adjustLevertijdIconsOnSearch();
    adjustLevertijdIconsElsewhere();
    addArtikelNummerToSearchPage();
    addLogoChangerToggle();

    /// Credits a the bottom of the page
    function addCredits(versionNumber){
        const footerDiv = document.querySelector('.footer-bottom.d-flex.justify-content-lg-between.border-top');
        const p = document.createElement('p');
        p.textContent = 'IQ🟣Tweaks ' + versionNumber + ' created by Hop On LLC - Original idea by 🎸';
        p.className = 'text-muted mb-0';
        footerDiv.appendChild(p);
    }

    /// Removes the refresh function from all filters, so the webpage doesn't reload prematurely.
    function removeRefreshFromFilters(){
        const checkboxes = document.querySelectorAll('.form-check-input');

        checkboxes.forEach((checkbox, index) => {
            const onclickAttr = checkbox.getAttribute('onclick');
            if (onclickAttr && onclickAttr.trim() === 'this.form.submit();') {
                // Remove the onclick attribute (so the webpage doesn't reload prematurely)
                checkbox.removeAttribute('onclick');
            }
        });
    }

    /// Adds a seperate "Filters toepassen" button to the filter page.
    function addRefreshFilterButton(){
        // Find the container div with ID 'LeftFilterCollapse0001' (where it say "Direct leverbaar" and such)
        const parentDiv = document.getElementById('LeftFilterCollapse0001');
        if(parentDiv !== null){
            const filterDiv = parentDiv.querySelector('div.card-body.pe-3');

            if (filterDiv) {
                // Create a new div with class "form-check" (so it can be added alongside "Direct leverbaar" in the same style)
                const buttonDiv = document.createElement('div');
                buttonDiv.className = 'form-check';

                // Create the "Filters toepassen" button
                const applyButton = document.createElement('button');
                applyButton.textContent = 'Filters toepassen';
                applyButton.setAttribute('onclick', 'this.form.submit();');
                applyButton.style.display = 'block';
                applyButton.style.marginTop = '10px';
                applyButton.className = 'btn btn-light';

                // Append the button at the bottom of the div
                buttonDiv.appendChild(applyButton);

                // Append the div to the container
                filterDiv.appendChild(buttonDiv);
            }
        }
    }

    /// Add artikelnr. to search page (behind price)
    function addArtikelNummerToSearchPage(){
        const divs = document.querySelectorAll('div.mt-2');

        divs.forEach(div => {
            const targetElements = div.querySelectorAll('a.float-end.btn.btn-clr-basket.btn-icon.text-white.mt-2.me-1');

            targetElements.forEach(link => {
                if(div.querySelector('strong.price')){
                    // Create a span for the added text.
                    const span = document.createElement('span');

                    // Set font to a smaller size.
                    span.style.fontSize = '0.7em'; // smaller size

                    // Set the text to the artikelnr.
                    span.textContent = ' (' + link.href.match(/(\d{6})(?!.*\d)/)[0] + ')';

                    // Append the span to the <strong> element
                    div.querySelector('strong.price').appendChild(span);
                }
            });
        });
    }

    /// Adjust levertijd icons on search and basket page (Yellow/orange tick or gray X icon).
    function adjustLevertijdIconsOnSearch() {
        // Select levertijd elements
        const smallElements = document.querySelectorAll('small.text-muted');

        smallElements.forEach(small => {
            const textContent = small.textContent.trim();

            // If leverbaar within certain werkdagen
            if (textContent.includes("werkdagen")) {
                const icon = small.querySelector('i');
                if (icon) {
                    // text-warning turns the icon orange/yellow.
                    icon.classList.add('fa', 'fa-check', 'fa-lg', 'ps-1', 'text-warning', 'me-1');
                }
            }

            // Adds an X-icon for Onbekende levertijd.
            if (textContent.includes("Onbekende levertijd")) {
                const newIcon = document.createElement('i');
                // fa-times and text-times gives an X-icon and gray color respectively.
                newIcon.classList.add('fa', 'fa-times', 'fa-lg', 'ps-1', 'text-times', 'me-1');
                // Save the original text (to check it) and empty it.
                let originalText = small.textContent;
                small.textContent = "";

                // Searches for six digits followed by a pipe (|) symbol.
                const pattern = /^\d{6} \|/;

                // Check if the text matches the pattern
                if (pattern.test(originalText)) {
                    // Extract the number and pipe
                    const match = originalText.match(/^(\d{6} \|)/);
                    // match[1] contains the number and pipe
                    small.textContent += match[1];
                }
                // Add the icon.
                small.appendChild(newIcon);
                // Add the text back.
                const span = document.createElement('span');
                span.textContent = "Onbekende levertijd";
                small.appendChild(span);
            }
        });
    }

    /// Adjust levertijd icons elsewhere (Yellow/orange tick, "Onbekende levertijd" already has an appropriate icon).
    function adjustLevertijdIconsElsewhere() {
        const stockDivs = document.querySelectorAll('div.card-product-list-stock');

        stockDivs.forEach(div => {
            const span = div.querySelector('span');
            if (span && span.getAttribute('aria-label') === 'Op voorraad bij leverancier') {
                const styleElements = div.querySelectorAll('[style*="color:#009400"]');
                styleElements.forEach(el => {
                    el.style.color = '#ffc107';
                });
            }
        });
    }
    // Define the original and new logo.
    const originalLogo = 'https://www.informatique.nl/new2023/assets/img/informatique-logo-white-30y.svg?v=1';
    const lgbtLogo = 'https://raw.githubusercontent.com/miniGiovanni/IQ--Tweaks/main/informatique-logo-white-30y-june.svg';
    // On load
    const storedState = localStorage.getItem('lgbtLogoEnabled');
    let isLgbtLogoEnabled = storedState === 'true';

    // Apply on load
    updateLogo(isLgbtLogoEnabled);
    updateToggleUI(isLgbtLogoEnabled);

    // Change the logo from one to the other or back.
    function updateLogo(enabled) {
        if(enabled != null){
            const logoImg = document.querySelector('.informatique-logo');

            if (enabled) {
                logoImg.src = lgbtLogo;
            } else {
                logoImg.src = originalLogo;
            }
        }
    }

    // Logo change button and logic.
    function addLogoChangerToggle() {
        // Find the element with the logo.
        const logoElement = document.querySelector('.informatique-logo');
        const toggleButtonStyle = document.createElement('style');
        // Create the style for the toggle button.
        toggleButtonStyle.innerHTML = `
.switch {
  position: relative;
  display: inline-block;
  width: 10px;
  height: 5px;
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
}

.slider:before {
  position: absolute;
  content: "";
  height: 5px;
  width: 5px;
  left: 0.5px;
  bottom: 0.5px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 0.5px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(5px);
  -ms-transform: translateX(5px);
  transform: translateX(5px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 5px;
}

.slider.round:before {
  border-radius: 50%;
}
`;

        document.head.appendChild(toggleButtonStyle);

        // Create the label with checkbox
        const label = document.createElement('label');
        label.className = 'switch';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'logoChangeCheckbox';
        checkbox.checked = false;

        // Add the function to the toggle button.
        checkbox.addEventListener('change', function() {
            updateLogo();
        });

        const span = document.createElement('span');
        span.className = 'slider round';

        label.appendChild(checkbox);
        label.appendChild(span);

        // Insert the switch after the .informatique-logo element
        logoElement.parentNode.insertBefore(label, logoElement.nextSibling);
    }

    // Function to update toggle UI
    function updateToggleUI(enabled) {
        document.getElementById('logoChangeCheckbox').checked = enabled;
    }

    // Observe toggle changes, invert the current value and save it locally.
    const toggleButton = document.querySelector('#logoChangeCheckbox');
    toggleButton.addEventListener('click', () => {
        isLgbtLogoEnabled = !isLgbtLogoEnabled;
        localStorage.setItem('lgbtLogoEnabled', isLgbtLogoEnabled ? 'true' : 'false');
        updateLogo(isLgbtLogoEnabled);
        updateToggleUI(isLgbtLogoEnabled);
    });

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (event) => {
        if (event.key === 'lgbtLogoEnabled') {
            const newState = event.newValue === 'true';
            isLgbtLogoEnabled = newState;
            updateLogo(newState);
            updateToggleUI(newState);
        }
    });
})();
