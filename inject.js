function elementInViewport(el) {
  var top = el.offsetTop;
  var left = el.offsetLeft;
  var width = el.offsetWidth;
  var height = el.offsetHeight;

  while (el.offsetParent) {
    el = el.offsetParent;
    top += el.offsetTop;
    left += el.offsetLeft;
  }

  return (
    top >= window.pageYOffset &&
    left >= window.pageXOffset &&
    top + height <= window.pageYOffset + window.innerHeight &&
    left + width <= window.pageXOffset + window.innerWidth
  );
}

function inBoardContext() {
  return document.querySelector('[data-id="boards"]');
}

function activeElementIsAnInputElement() {
  const inputElementTagNames = ['INPUT'];
  return (
    document.activeElement &&
    inputElementTagNames.includes(document.activeElement.tagName)
  );
}

function filterSectionOpen() {
  const filterPanel = document.querySelector('[data-sel-filter-panel="true"]');
  return filterPanel && filterPanel.parentElement.offsetLeft >= 0;
}

function toggleFilterSection() {
  if (filterSectionOpen()) {
    document.querySelector('[data-testid="toggle-filters"]').click();
  } else {
    document.querySelector('[data-testid="toggle-filters"]').click();
    setTimeout(() => {
      document
        .querySelector('[data-sel-filter-input="true"]')
        .querySelector('input')
        .focus();
    }, 300);
  }
}

function focusSearchBox() {
  const searchInputWrapper = document.querySelector(
    '[data-sel-navigation="input_search"]'
  );

  if (searchInputWrapper) {
    searchInputWrapper.querySelector('input').focus();
    // TODO: Would be great if we can also select type:card and the board name too
    // the search input does not support things like in:board:<board_id> and i would have to programatically click on filter button in search panel and then go from there. Too much work.
  }
}

function getElementPos(element) {
  var top = element.getBoundingClientRect().top + window.scrollY;
  var left = element.getBoundingClientRect().left + window.scrollX;

  return { left, top };
}

let activeElements;

function genCharArray(charA, charZ) {
  var a = [],
    i = charA.charCodeAt(0),
    j = charZ.charCodeAt(0);
  for (; i <= j; ++i) {
    a.push(String.fromCharCode(i));
  }
  return a;
}

function atoz() {
  return genCharArray('a', 'z');
}

function allCardsOnPage() {
  return Array.from(document.querySelectorAll('[data-sel-card]'));
}

function cardsInViewport() {
  return allCardsOnPage().filter(elementInViewport);
}

function isCardElementSelected(cardEl) {
  // TODO: This is a super bad way to find if we change the default background color some day
  // return false;
  console.log(
    'background color',
    window.getComputedStyle(cardEl).backgroundColor
  );
  return !window
    .getComputedStyle(cardEl)
    .backgroundColor.includes('rgb(255, 255, 255)');
}

function highlightCardsInViewport() {
  const cards = cardsInViewport();

  // only highlight cards in viewport

  activeElements = {};
  const chars = atoz();
  cards.forEach((cardEl, index) => {
    activeElements[chars[index]] = cardEl;
    putTextOverEl(cardEl, chars[index]);
  });
}

function putTextOverEl(el, number) {
  const elPos = getElementPos(el);
  const width = el.offsetWidth;
  const height = el.offsetHeight;

  const numberEl = document.createElement('div');
  const textSpan = document.createElement('div');
  textSpan.innerText = number;
  numberEl.appendChild(textSpan);
  numberEl.width = width;
  numberEl.height = height;
  numberEl.style = `position:absolute;display:flex;justify-content:center;align-items:center;font-size:30px;font-weight:700;color:red;z-index:100;width:${width}px;height:${height}px`;
  numberEl.style.top = `${elPos.top}px`;
  numberEl.style.left = `${elPos.left}px`;
  numberEl.setAttribute('data-special-active-element', 'chrome-extension');

  document.body.appendChild(numberEl);
}

function highlightCardCreators() {
  const cardCreatorEls = Array.from(
    document.querySelectorAll('[data-sel-card-creator]')
  ).filter(elementInViewport);

  activeElements = {};
  const chars = atoz();
  cardCreatorEls.forEach((cardCreatorEl, index) => {
    activeElements[chars[index]] = cardCreatorEl;
    putTextOverEl(cardCreatorEl, chars[index]);
  });
}

function clearActiveElementOverlays() {
  activeElements = null;
  Array.from(
    document.querySelectorAll(
      '[data-special-active-element="chrome-extension"]'
    )
  ).forEach(activeEl => {
    activeEl.remove();
  });
}

function isAnyCardOnPageSelected() {
  return /card\/[\d]+$/.test(window.location.href);
}

function getSelectedCard() {
  if (!isAnyCardOnPageSelected()) {
    return null;
  }

  const allCards = allCardsOnPage();

  return allCards.find(cardEl => {
    return isCardElementSelected(cardEl);
  });
}

function clickCardCreatorInSelectedCardColumn() {
  const selectedCard = getSelectedCard();
  console.log({ selectedCard }, selectedCard.textContent);
  // traverse up and find the li
  // traverse the siblings backward until you hit a div with data-sel-card-creator attribute
  const currentEl = selectedCard.parentElement;
  while (currentEl.previousSibling) {
    const ps = currentEl.previousSibling;
    if (ps.hasAttribute('data-sel-card-creator')) {
      ps.click();
      return ps;
    }
    currentEl = currentEl.previousSibling;
  }

  return null;
}

document.addEventListener('keydown', e => {
  if (!inBoardContext()) {
    return;
  }

  // we don't want to interrupt regular input text
  if (activeElementIsAnInputElement()) {
    console.log('active element seems like an anput', document.activeElement);
    return;
  }

  // handle single key strokes, without any modifier keys
  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    // if there are some hot elements hwich are ready to be clicked, like + buttons after pressing c,
    // we don't want the normal key bindings to work
    if (activeElements) {
      if (activeElements[e.key]) {
        e.preventDefault();
        activeElements[e.key].click();
      }

      clearActiveElementOverlays();
    } else {
      if (e.key === 'f') {
        e.preventDefault();
        toggleFilterSection();
      } else if (e.key === '/') {
        // focus search box
        e.preventDefault();
        focusSearchBox();
      } else if (e.key === 's') {
        e.preventDefault();
        highlightCardsInViewport();
      } else if (e.key === 'c') {
        e.preventDefault();
        if (isAnyCardOnPageSelected()) {
          // TODO: If a card is already selected, press the + button in the same swimlane
          clickCardCreatorInSelectedCardColumn();
        } else {
          highlightCardCreators();
        }
      }
    }
  }
});
