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
  textSpan.style =
    'background:rgb(255, 247, 133);padding:2px;color:black;border-width:1px;border-style:solid;border-color:rgb(227, 190, 35);';
  textSpan.innerText = number;
  numberEl.appendChild(textSpan);
  numberEl.width = width;
  numberEl.height = height;
  numberEl.style = `position:absolute;display:flex;justify-content:center;align-items:center;font-size:24px;font-weight:700;color:red;z-index:100;width:${width}px;height:${height}px`;
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
  return /card\/[\d]+(,[\d]+)*$/.test(window.location.href);
}

function getSelectedCards() {
  if (!isAnyCardOnPageSelected()) {
    return [];
  }

  const allCards = allCardsOnPage();

  // If multiple cards are selected, we will return the last one
  return allCards.filter(cardEl => {
    return isCardElementSelected(cardEl);
  });
}

function getSelectedCard() {
  return getSelectedCards()[0];
}

function clickCardCreatorInSelectedCardColumn() {
  const selectedCard = getSelectedCard();
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

function openCurtain() {
  document.querySelector('button.pp-curtain__btn').click();
}

function openAssigneeTool() {
  let assigneeDropdownEl = document.querySelector(
    '[data-sel-toolname="assignee_id"]'
  );

  if (assigneeDropdownEl) {
    assigneeDropdownEl.click();
  } else {
    if (isAnyCardOnPageSelected()) {
      // the assignee tool might be hidden in the curtain. open the curtain first
      // The cruel part is that the stuff inside the curtain is still in DOM and opens up from inside the closed
      // curtain
      openCurtain();
      assigneeDropdownEl = document.querySelector(
        '[data-sel-toolname="assignee_id"]'
      );
      if (assigneeDropdownEl) {
        assigneeDropdownEl.click();
      }
    }
  }
}

function getColumnNames() {
  return Array.from(document.querySelectorAll('[data-sel-column-header]')).map(
    el => {
      const nameInHeader = el.textContent;
      const indexOfCount = nameInHeader.search(/\([\d]+\).*$/);
      return nameInHeader.slice(0, indexOfCount).trim();
    }
  );
}

function getSelectedCardColumnName() {
  const statusDropdownEl = document.querySelector(
    '[data-sel-dropdown="status"]'
  );

  if (statusDropdownEl) {
    return statusDropdownEl.firstElementChild.textContent;
  }

  return null;
}

// TODO: initEvent is deprected
// use Event constructors
function triggerMouseEvent(node, eventType, options = {}) {
  const mouseEvent = new MouseEvent(eventType, { ...options, bubbles: true });
  node.dispatchEvent(mouseEvent);
}

function getStatusDropdown() {
  return document.querySelector('[data-sel-dropdown="status"]');
}

function openColumnSelectorDropdown() {
  const statusDropdownEl = getStatusDropdown();

  if (statusDropdownEl) {
    statusDropdownEl.firstElementChild.click();
  }
}

function selectStatusFromDropdown(columnNameToMoveTo) {
  const statusDropdownEl = getStatusDropdown();
  if (statusDropdownEl) {
    const dropdownContent = statusDropdownEl.querySelector(
      '.pp-dropdown__content'
    );

    if (dropdownContent) {
      const dropdownItems = dropdownContent.querySelectorAll('a');
      const dropdownItemToMoveTo = Array.from(dropdownItems).find(itemEl =>
        itemEl.textContent.includes(columnNameToMoveTo)
      );

      if (dropdownItemToMoveTo) {
        dropdownItemToMoveTo.click();
      }
    }
  }
}

function moveCardToPrevColumn() {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    const columnNames = getColumnNames();

    const currentColumnName = getSelectedCardColumnName();
    const existingColumnIndex = columnNames.findIndex(
      cn => cn === currentColumnName
    );
    if (existingColumnIndex > 0) {
      const columnNameToMoveTo = columnNames[existingColumnIndex - 1];

      openColumnSelectorDropdown();
      selectStatusFromDropdown(columnNameToMoveTo);
    }
  }
}

function moveCardToNextColumn() {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    const columnNames = getColumnNames();

    const currentColumnName = getSelectedCardColumnName();
    const existingColumnIndex = columnNames.findIndex(
      cn => cn === currentColumnName
    );
    if (existingColumnIndex < columnNames.length - 1) {
      const columnNameToMoveTo = columnNames[existingColumnIndex + 1];

      openColumnSelectorDropdown();
      selectStatusFromDropdown(columnNameToMoveTo);
    }
  }
}

function getPrevCard() {
  const selectedCards = getSelectedCards();

  if (selectedCards.length > 0) {
    const selectedCard = selectedCards[0];

    if (selectedCard) {
      const currentEl = selectedCard.parentElement;
      if (
        currentEl.previousElementSibling &&
        currentEl.previousElementSibling.tagName === 'LI'
      ) {
        return currentEl.previousElementSibling.firstElementChild;
      }
    }
  }
  return null;
}

function getNextCard() {
  const selectedCards = getSelectedCards();

  if (selectedCards.length > 0) {
    const selectedCard = selectedCards[selectedCards.length - 1];
    if (selectedCard) {
      const currentEl = selectedCard.parentElement;
      if (
        currentEl.nextElementSibling &&
        currentEl.nextElementSibling.tagName === 'LI'
      ) {
        return currentEl.nextElementSibling.firstElementChild;
      }
    }
  }
  return null;
}

function selectCardBelowSelectedCard() {
  const nextCard = getNextCard();

  if (nextCard) {
    nextCard.click();
  }
}

function selectCardAboveSelectedCard() {
  const previousCard = getPrevCard();
  if (previousCard) {
    previousCard.click();
  }
}

function getColumnContainerForCard(card) {
  // TODO: Make this more robust by find something in parent with attribute of data-sel-column
  return card.parentElement.parentElement.parentElement;
}

function selectCardInNextColumn() {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    const columnForCard = getColumnContainerForCard(selectedCard);
    const nextColumn = columnForCard.nextElementSibling;

    if (nextColumn) {
      const firstCardInColumn = nextColumn.firstElementChild.querySelector(
        'li'
      );
      if (firstCardInColumn) {
        firstCardInColumn.firstElementChild.click();
      }
    }
  }
}

function selectCardInPreviousColumn() {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    const columnForCard = getColumnContainerForCard(selectedCard);
    const prevColumn = columnForCard.previousElementSibling;

    if (prevColumn) {
      const firstCardInColumn = prevColumn.firstElementChild.querySelector(
        'li'
      );
      if (firstCardInColumn) {
        firstCardInColumn.firstElementChild.click();
      }
    }
  }
}

function getDetailsPaneWrapper() {
  return document.querySelector('[data-testid="pp-details-pane"]');
}

function clickDetailsPaneCloseButton() {
  const detailsPaneWrapper = getDetailsPaneWrapper();

  if (detailsPaneWrapper) {
    detailsPaneWrapper.querySelector('i[title="Close"]').click();
  }
}

// deselect any card, if there's a selected card
function deselectCard() {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    clickDetailsPaneCloseButton();
  }
}

let prefixKey = null;

function clearPrefixKey() {
  prefixKey = null;
}

function saveAsPrefixKey(key) {
  prefixKey = key;
  // clear the prefix key after 2 seconds in case user pressed it by mistake
  setTimeout(clearPrefixKey, 2000);
}

function assignCardToMe() {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    // TODO;
  }
}

function multiSelectNextCard() {
  const nextCard = getNextCard();

  if (nextCard) {
    triggerMouseEvent(nextCard, 'click', { metaKey: true });
  }
}

function multiSelectPreviousCard() {
  const prevCard = getPrevCard();

  if (prevCard) {
    triggerMouseEvent(prevCard, 'click', { metaKey: true });
  }
}

// if the direction user was moving was down and they selected multiple cards and want to unselect the last card, they
// will press the up key and think the last selected card will be deselected. But shift-up for us means
// multiSelectPreviousCard. Which means we have to remember the direction user is moving in multiselect at a particular
// point in time
function handleMultiSelection(e) {
  if (e.key === 'ArrowDown') {
    multiSelectNextCard();
  } else if (e.key === 'ArrowUp') {
    multiSelectPreviousCard();
  }
}

function selectPoints(points) {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    const estimateTool = document.querySelector(
      '[data-sel-toolname="estimate"]'
    );
    if (estimateTool) {
      estimateTool.click();
      // wait for the dropdown to open
      setTimeout(() => {
        const pointsEl = Array.from(estimateTool.querySelectorAll('li')).find(
          el => el.textContent === `${points}`
        );
        if (pointsEl) {
          pointsEl.click();
        }
      }, 30);
    }
  }
}

document.addEventListener('keydown', e => {
  if (!inBoardContext()) {
    return;
  }

  // we don't want to interrupt regular input text
  if (activeElementIsAnInputElement()) {
    return;
  }

  console.log('event', e);
  // handle single key strokes, without any modifier keys
  if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    // if there are some hot elements hwich are ready to be clicked, like + buttons after pressing c,
    // we don't want the normal key bindings to work
    if (activeElements) {
      if (activeElements[e.key]) {
        e.preventDefault();
        activeElements[e.key].click();
      }

      clearActiveElementOverlays();
      // if user is trying out some combination keys like `at` or `gi` etc.
    } else if (prefixKey !== null) {
      // TODO
      // am -> assign to me
      if (prefixKey === 'a' && e.key === 'm') {
        e.preventDefault();
        assignCardToMe();
      }

      clearPrefixKey();
    } else {
      if (e.key === 'f') {
        // TODO: This interferes with other actions in an indeterministic way. Will switch off for now.
        // e.preventDefault();
        // toggleFilterSection();
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
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        selectCardBelowSelectedCard();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        selectCardAboveSelectedCard();
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        selectCardInNextColumn();
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault();
        selectCardInPreviousColumn();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        deselectCard();
      } else if (!Number.isNaN(parseInt(e.key, 10))) {
        e.preventDefault();
        selectPoints(parseInt(e.key, 10));
      } else {
        // for combination keys like `at` to add a tag
        // we will save a key and wait for the next one
        // we will clear the prefix key after some milliseconds or seconds
        saveAsPrefixKey(e.key);
      }
    }
  } else if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    // pressing '@' will open the assignee dropdown
    if (e.key === '@') {
      e.preventDefault();
      openAssigneeTool();
      //
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveCardToNextColumn();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveCardToPrevColumn();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleMultiSelection(e);
    }
  }
});
