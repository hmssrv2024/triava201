import {
  COUNTRY_OPTIONS,
  findCountryByCode,
  normaliseCountryCode,
  persistCountryCode,
  clearPersistedCountryCode,
  getPersistedCountryCode
} from './envios-express-countries.js';

const countryGrid = document.getElementById('selectorCountryGrid');
const continueButton = document.getElementById('selectorContinueButton');
const clearButton = document.getElementById('selectorClearButton');

let selectedCountryCode = normaliseCountryCode(getPersistedCountryCode());

function updateContinueState() {
  if (!continueButton) return;
  continueButton.disabled = !selectedCountryCode;
  if (selectedCountryCode) {
    const country = findCountryByCode(selectedCountryCode);
    if (country) {
      continueButton.innerHTML = `Continuar con ${country.flag} ${country.name}`;
    }
  } else {
    continueButton.textContent = 'Continuar con el país seleccionado';
  }
}

function handleCountrySelection(country, button) {
  if (!countryGrid) return;
  selectedCountryCode = country.code;
  persistCountryCode(selectedCountryCode);

  const cards = countryGrid.querySelectorAll('.country-card');
  cards.forEach((card) => {
    card.classList.toggle('country-card--selected', card === button);
    card.setAttribute('aria-selected', card === button ? 'true' : 'false');
  });

  updateContinueState();
}

function renderCountryOptions() {
  if (!countryGrid) return;
  const fragment = document.createDocumentFragment();

  COUNTRY_OPTIONS.forEach((country) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'country-card';
    button.setAttribute('data-country-code', country.code);
    button.setAttribute('role', 'option');
    button.setAttribute('aria-label', `${country.name}, ${country.currency}`);

    button.innerHTML = `
      <span class="country-card__flag" aria-hidden="true">${country.flag}</span>
      <span class="country-card__label">
        <span class="country-card__name">${country.name}</span>
        <span class="country-card__subtle">${country.currency}</span>
      </span>
      <span class="country-card__indicator" aria-hidden="true">✓</span>
    `;

    button.addEventListener('click', () => handleCountrySelection(country, button));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCountrySelection(country, button);
      }
    });

    fragment.appendChild(button);
  });

  countryGrid.appendChild(fragment);

  if (selectedCountryCode) {
    const preselectedButton = countryGrid.querySelector(`[data-country-code="${selectedCountryCode}"]`);
    const country = findCountryByCode(selectedCountryCode);
    if (preselectedButton && country) {
      handleCountrySelection(country, preselectedButton);
    }
  }
}

function goToEnviosExpress() {
  if (!selectedCountryCode) {
    updateContinueState();
    return;
  }

  const country = findCountryByCode(selectedCountryCode);
  if (!country) {
    selectedCountryCode = '';
    updateContinueState();
    return;
  }

  const url = new URL('envios-express.html', window.location.origin);
  url.searchParams.set('country', country.code);
  window.location.href = url.toString();
}

function clearSelection() {
  selectedCountryCode = '';
  clearPersistedCountryCode();
  if (countryGrid) {
    countryGrid.querySelectorAll('.country-card').forEach((card) => {
      card.classList.remove('country-card--selected');
      card.setAttribute('aria-selected', 'false');
    });
  }
  updateContinueState();
}

function hydrateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = normaliseCountryCode(params.get('country'));
  if (!fromQuery) return;

  const country = findCountryByCode(fromQuery);
  if (!country) return;

  const button = countryGrid?.querySelector(`[data-country-code="${country.code}"]`);
  if (button) {
    handleCountrySelection(country, button);
  }
}

renderCountryOptions();
updateContinueState();

if (continueButton) {
  continueButton.addEventListener('click', goToEnviosExpress);
}

if (clearButton) {
  clearButton.addEventListener('click', clearSelection);
}

hydrateFromQuery();

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && selectedCountryCode && document.activeElement === document.body) {
    goToEnviosExpress();
  }
});
