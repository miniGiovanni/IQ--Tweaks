    function darkMode() {

        const STYLE_ID = 'iq-tweaks-dark-mode';

        document.getElementById(STYLE_ID)?.remove();

        if (!currentSettings.enableDarkMode.value) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `:root {

            --iq-bg: #111827;
            --iq-surface: #1b2635;
            --iq-surface2: #243447;

            --iq-text: #e5e7eb;
            --iq-muted: #9ca3af;

            --iq-accent: #006bb6;
        }
        html,
        body {

            background: var(--iq-bg) !important;
            color: var(--iq-text) !important;
        }
        .bg-white,
        .container.bg-white {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }

        .bg-light {

            background: var(--iq-surface2) !important;
        }
        .card,
        .card-product-grid {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }
        h1,h2,h3,h4,h5,h6,
        p,
        span,
        dt,
        dd,
        label,
        small {

            color: var(--iq-text);
        }
        a {

            color: #7ec3ff !important;
        }

        a:hover {

            color: #9fd2ff !important;
        }
        input,
        textarea,
        select,
        .form-control {

            background: #2b3545 !important;
            color: white !important;

            border-color: #4b5563 !important;
        }
        .dropdown-menu {

            background: #1e293b !important;
            border-color: #334155 !important;
        }

        .dropdown-item {

            color: white !important;
        }

        .dropdown-item:hover {

            background: #334155 !important;
        }
        .mix-blend-multiply {

            mix-blend-mode: normal !important;
        }
        .img-wrap,
        .img-wrap-productcard {

            background: #2b3545 !important;
        }
        article,
        section {

            color: var(--iq-text);
        }
        .iq-tweaks-credits {
            color: inherit !important;
            font-size: inherit !important;
            opacity: .8;
        }
        #IQTweak_control-panel {
        background: #1b2635 !important;
        border-color: #374151 !important;
        color: #e5e7eb !important;
        }

        #IQTweak_control-panel h3 {
        color: #e5e7eb !important;
        border-bottom-color: #374151 !important;
        }

        #IQTweak_control-panel label {
        color: #e5e7eb !important;
        }

        #IQTweak_control-panel select {
        background: #243447 !important;
        color: #e5e7eb !important;
        border-color: #4b5563 !important;
        }

        #IQTweak_control-panel-toggle {
        background: #006bb6 !important;
        }

        body *,
        .card *,
        .card-product-grid *,
        .card-product-list *,
        section *,
        article * {

            color: inherit;
        }
        body {
            color: var(--iq-text) !important;
        }

        p,
        span,
        strong,
        small,
        li,
        dd,
        dt,
        td,
        th,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        .title,
        .section-title,
        .card-title {

            color: var(--iq-text) !important;
        }

        .color-1,
        .color-2,
        .text-secondary,
        .text-muted {

            color: var(--iq-text) !important;
        }
        .text-muted {
            color: #b2bcc8 !important;
        }
        .table {
            background: var(--iq-surface) !important;
        }

        .table th,
        .table td {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;

            border-color: #374151 !important;
        }

        .box,
        .itemside,
        .card-body {

            color: var(--iq-text) !important;
        }
        #mainCarousel,
        #thumbCarousel {

        background: #243447 !important;
        border-color: #374151 !important;
        }
        .card-banner,
        .card-banner .title {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }
        .footer-2026-main,
        .footer-2026-bottom {

            background: #0f172a !important;
        }

        .footer-2026 *,
        .footer-2026 a {

            color: #d1d5db !important;
        }
        .bg-white,
        [style*="background:#fff"],
        [style*="background: #fff"],
        [style*="background:white"],
        [style*="background: white"] {

            background: var(--iq-surface) !important;
        }
        .nav-tabs .nav-link.active,
        .nav-pills .nav-link.active {

            background: #243447 !important;
            color: #ffffff !important;

            border-color: #4b5563 !important;
        }

        .nav-tabs .nav-link,
        .nav-pills .nav-link {

            color: var(--iq-text) !important;
        }

        .nav-tabs .nav-link:hover {
            background: #1b2635 !important;
        }
        .table {

            --bs-table-bg: var(--iq-surface);
            --bs-table-striped-bg: #243447;
            --bs-table-hover-bg: #32465d;

            --bs-table-color: var(--iq-text);
            --bs-table-hover-color: white;
        }
        .table-hover tbody tr:hover > * {

            color: white !important;

            background-color: #32465d !important;

            box-shadow:
            inset 0 0 0 9999px #32465d !important;
        }
        .header-2026-topbar {
            display: none !important;
        }
        .header-2026-topbar {

            height: 0 !important;
            min-height: 0 !important;

            overflow: hidden !important;

            padding: 0 !important;
            margin: 0 !important;
        }
        #mainCarousel,
        #thumbCarousel,
        .carousel__slide {

            background: #243447 !important;

            border-color: #4b5563 !important;
        }
        .card-header {

            border-color: #4b5563 !important;
        }
        /* --------------------------------------------------
         *  PRODUCT BENEFITS
         - *------------------------------------------------- */

        .iq-pd-benefits {

            background: var(--iq-surface) !important;
            border-color: var(--iq-border) !important;
        }

        .iq-pd-benefit {

            background: transparent !important;
            border-color: var(--iq-border) !important;
        }

        .iq-pd-benefit-title {

            color: var(--iq-text) !important;
        }

        .iq-pd-benefit-description {

            color: var(--iq-muted) !important;
        }

        .iq-pd-benefit-description a {

            color: #7ec3ff !important;
        }

        .iq-pd-benefit-icon {

            color: var(--iq-accent) !important;
        }
        [class^="iq-pd-"],
        [class*=" iq-pd-"] {

            color: var(--iq-text) !important;
        }

        [class^="iq-pd-"] a,
        [class*=" iq-pd-"] a {

            color: #7ec3ff !important;
        }

        [class^="iq-pd-"] h1,
        [class^="iq-pd-"] h2,
        [class^="iq-pd-"] h3,
        [class^="iq-pd-"] h4,
        [class^="iq-pd-"] h5,
        [class^="iq-pd-"] h6,
        [class*=" iq-pd-"] h1,
        [class*=" iq-pd-"] h2,
        [class*=" iq-pd-"] h3,
        [class*=" iq-pd-"] h4,
        [class*=" iq-pd-"] h5,
        [class*=" iq-pd-"] h6 {

            color: var(--iq-text) !important;
        }
        /* IQ Tweaks eigen knop */

        #iq-tweaks-apply-button {

        background: #243447 !important;
        color: #e5e7eb !important;

        border: 1px solid #4b5563 !important;
        }

        #iq-tweaks-apply-button:hover {

        background: #32465d !important;
        color: white !important;
        }
        /* Pagination */

        .pagination .page-link {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;

            border-color: var(--iq-border) !important;
        }

        .pagination .page-link:hover {

            background: #32465d !important;
            color: white !important;
        }

        .pagination .page-item.active .page-link {

            background: var(--iq-accent) !important;
            color: white !important;

            border-color: var(--iq-accent) !important;
        }

        .pagination .page-item.disabled .page-link {

            background: var(--iq-surface) !important;

            color: var(--iq-muted) !important;

            border-color: var(--iq-border) !important;
        }
        /* Search */

        .product_search_form,
        .search_form_btn {

            background: #243447 !important;
        }

        .product_search_form input,
        .product_search_form .form-control {

            background: #243447 !important;

            color: #e5e7eb !important;

            border-color: #4b5563 !important;
        }

        .product_search_form input::placeholder {

            color: #cbd5e1 !important;
        }
        .search_btn3 {

            background: #006bb6 !important;
        }

        .search_btn3:hover {

            background: #0a84db !important;
        }
        .btn-light {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;

            border-color: var(--iq-border) !important;
        }

        .btn-light:hover {

            background: #32465d !important;
            color: white !important;
        }
        /* Badges */

        .badge.bg-light {

            background: #374151 !important;
            color: #e5e7eb !important;
        }

        .badge.text-dark {

            color: #e5e7eb !important;
        }

        .badge.bg-light.text-dark {

            background: #374151 !important;
            color: #e5e7eb !important;
        }
        /* Winkelwagen knop */

        .btn-clr-basket {

            background: #006bb6 !important;
            border-color: #006bb6 !important;

            color: #ffffff !important;
        }

        .btn-clr-basket:hover {

            background: #0a84db !important;
            border-color: #0a84db !important;

            color: #ffffff !important;
        }

        .btn-clr-basket i {

            color: #ffffff !important;
        }
        .text-dark {
            color: var(--iq-text) !important;
        }

        .bg-light {
            background: var(--iq-surface2) !important;
        }

        .bg-white {
            background: var(--iq-surface) !important;
        }
        /* ==================================================
         *  PRODUCTVERGELIJKER
         = *================================================= */

        #vergelijking,
        .iq-compare-page {

            color: var(--iq-text) !important;
        }

        .compare-table {

            color: var(--iq-text) !important;
            background: var(--iq-surface) !important;
        }

        .compare-table th,
        .compare-table td {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;

            border-color: var(--iq-border) !important;
        }

        /* Product cards bovenaan */

        .compare-head,
        .compare-card {

            background: #1b2635 !important;
            color: var(--iq-text) !important;
        }

        /* Productnaam */

        .compare-name,
        .compare-name a {

            color: var(--iq-text) !important;
        }

        /* Groepstitels zoals Processor, Geheugen, etc */

        .compare-group {

            background: #243447 !important;
            color: white !important;

            border-color: var(--iq-border) !important;
        }

        .compare-group span {

            color: white !important;
        }

        /* Linkerkolom labels */

        .compare-label {

            background: #223142 !important;
            color: var(--iq-text) !important;
        }

        /* Gewone cellen */

        .compare-table td {

            background: #1b2635 !important;
        }

        /* Missing values */

        [data-compare-missing] {

            color: var(--iq-muted) !important;
        }

        /* Toolbar */

        .compare-toolbar {

            color: var(--iq-text) !important;
        }

        .compare-toolbar .form-check-label {

            color: var(--iq-text) !important;
        }

        /* Share button */

        .compare-outline {

            background: #243447 !important;

            color: var(--iq-text) !important;

            border: 1px solid var(--iq-border) !important;
        }

        .compare-outline:hover {

            background: #32465d !important;

            color: white !important;
        }

        /* Verplaats/verwijder iconen */

        .compare-icon {

            background: #243447 !important;
            color: var(--iq-text) !important;

            border: 1px solid var(--iq-border) !important;
        }

        .compare-icon:hover {

            background: #32465d !important;
        }

        /* Alternating rows */

        .compare-table tr:nth-child(even) td {

            background: #202b38 !important;
        }

        /* Hover */

        .compare-table tr:hover td,
        .compare-table tr:hover th.compare-label {

            background: #32465d !important;
            color: white !important;
        }

        /* Availability */

        .compare-availability,
        .compare-delivery {

            color: var(--iq-text) !important;
        }

        /* Prijzen */

        .compare-price {

            color: #6ee7b7 !important;

            font-weight: 600;
        }

        /* Dialogs */

        .compare-dialog {

            background: #1b2635 !important;

            color: var(--iq-text) !important;

            border: 1px solid var(--iq-border) !important;
        }

        .compare-dialog::backdrop {

            background: rgba(0,0,0,.7);
        }

        /* Dialog inputs */

        .compare-dialog input,
        .compare-dialog select {

            background: #243447 !important;

            color: var(--iq-text) !important;

            border-color: var(--iq-border) !important;
        }
        .compare-table .text-muted {

            color: #9ca3af !important;
        }

        .compare-table .text-success {

            color: #22c55e !important;
        }
        /* ==================================================
         *  PRODUCTVERGELIJKER - CONTAINERS
         = *================================================= */

        #vergelijking,
        .iq-compare-page,
        .compare-table-wrap {

            background: var(--iq-bg) !important;
        }

        /* buitenste compare container */

        #vergelijking > * {

        background: transparent !important;
        }

        /* scrollable onderdeel */

        .compare-table-wrap {

            border: 1px solid var(--iq-border) !important;

            border-radius: 8px;

            background: #111827 !important;
        }
        .container.bg-white.iq-min-height {

            background: var(--iq-bg) !important;
        }
        #vergelijking table,
        #vergelijking tbody,
        #vergelijking thead,
        #vergelijking tr {

        background: transparent !important;
        }
        /* ==================================================
         *  ACCORDIONS
         = *================================================= */

        .accordion {

            --bs-accordion-bg: var(--iq-surface);
            --bs-accordion-color: var(--iq-text);

            --bs-accordion-border-color: var(--iq-border);

            --bs-accordion-btn-bg: var(--iq-surface);
            --bs-accordion-btn-color: var(--iq-text);

            --bs-accordion-active-bg: #243447;
            --bs-accordion-active-color: white;
        }

        .accordion-item {

            background: var(--iq-surface) !important;
            border-color: var(--iq-border) !important;
        }

        .accordion-header {

            background: var(--iq-surface) !important;
        }

        .accordion-button {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }

        .accordion-button:not(.collapsed) {

            background: #243447 !important;
            color: white !important;

            box-shadow: none !important;
        }

        .accordion-button:hover {

            background: #32465d !important;
        }

        .accordion-button::after {

            filter: invert(1) brightness(2);
        }

        .accordion-body {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }

        /* links binnen FAQ */

        .accordion-body a {

            color: #7ec3ff !important;
        }
        .content-body {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }
        .table-success {

            --bs-table-bg: var(--iq-surface) !important;
            --bs-table-color: var(--iq-text) !important;
        }
        /* ==================================================
         *  ACCORDIONS
         = *================================================= */

        .accordion {

            --bs-accordion-bg: var(--iq-surface);
            --bs-accordion-color: var(--iq-text);

            --bs-accordion-border-color: var(--iq-border);

            --bs-accordion-btn-bg: var(--iq-surface);
            --bs-accordion-btn-color: var(--iq-text);

            --bs-accordion-active-bg: #243447;
            --bs-accordion-active-color: white;
        }

        .accordion-item {

            background: var(--iq-surface) !important;
            border-color: var(--iq-border) !important;
        }

        .accordion-header {

            background: var(--iq-surface) !important;
        }

        .accordion-button {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }

        .accordion-button:not(.collapsed) {

            background: #243447 !important;
            color: white !important;

            box-shadow: none !important;
        }

        .accordion-button:hover {

            background: #32465d !important;
        }

        .accordion-button::after {

            filter: invert(1) brightness(2);
        }

        .accordion-body {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }

        /* links binnen FAQ */

        .accordion-body a {

            color: #7ec3ff !important;
        }
        .content-body {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }
        .table-success {

            --bs-table-bg: var(--iq-surface) !important;
            --bs-table-color: var(--iq-text) !important;
        }
        [id^="win-"] .btn-light,
        [id^="win-"] .card,
        [id^="win-"] .content-body {

            background: var(--iq-surface) !important;
            color: var(--iq-text) !important;
        }
        #win-ps5 .ps5-panel * {
        color: inherit !important;
        }`;

        document.head.appendChild(style);
    }
