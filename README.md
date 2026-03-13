# IQ🟣Tweaks

Minor tweaks to [informatique.nl](https://informatique.nl), installed via [Tampermonkey](https://www.tampermonkey.net/).  
by mini · Hop On LLC · WTFPL license, 2026.

---

## Features

### Filter toepassen knop
Disables the default behaviour of the filter sidebar auto-refreshing the page on every click. Adds a manual **"Filters toepassen"** button instead, so you can select multiple filters before applying them in one go. The button also pulses when there are unapplied changes (animation can be turned off separately).

### Artikelnr. op hoofdpagina
Shows the article number directly on product cards in category/search listings, so you don't have to open each product to find it.

### Voorraadstatus icoon fix
The stock status icons (in stock, at supplier, unknown) were inconsistently displayed across different parts of the site. This makes them uniform everywhere.

### Sneltoetsen *(product pages only)*
Keyboard shortcuts to navigate product pages faster:
- **S** — jump to the Specificaties tab
- **A** — jump to the Informatie tab
- **W** — go up to the parent category

### Extra content functies *(optional)*
Adds a content group label per category, filter attribute IDs next to each filter, and a quick-copy button for product content.

### EAN Tweakers zoeken *(optional)*
Adds a clickable Tweakers icon next to the EAN code on product pages, opening a direct Tweakers search for that product.

### Experimentele functies *(optional)*
- Defaults sort order to **prijs oplopend** when no sort is active in the URL
- Defaults stock filter to **direct leverbaar** when no stock filter is active in the URL
- **Z + click** a filter option to select it and all options below it (since higher values usually include lower ones, e.g. 144Hz→165Hz→240Hz). Z + click an already-selected option to trim everything above it.
- **Enter** submits the filter form (same as clicking "Filters toepassen")

### Speciaal logo *(optional, off by default)*
Replaces the Informatique logo with a special variant.

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser
2. Open the [script on GitHub](https://github.com/miniGiovanni/IQ--Tweaks) and click **Raw**
3. Tampermonkey will prompt you to install it

## Settings

A small toggle panel is injected at the bottom of the left filter sidebar on every page. All settings are saved locally per browser.
