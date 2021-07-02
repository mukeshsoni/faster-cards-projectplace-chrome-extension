function findParentBySelector(elm, selector) {
  return elm.closest(selector);
}

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
    top + height > window.pageYOffset &&
    left + width > window.pageXOffset
  );
}

function activeElementIsAnInputElement() {
  const inputElementTagNames = ['INPUT', 'TEXTAREA'];
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

// copied from vimium -
// https://github.com/philc/vimium/blob/bdf654aebe6f570f427c5f7bc9592cad86e642b5/lib/settings.js#L181
// Maybe, a combination of these characters lead to easier keyboard reachability
const linkHintCharacters = 'sadfjklewcmpgh';
// copied from vimium -
// https://github.com/philc/vimium/blob/bdf654aebe6f570f427c5f7bc9592cad86e642b5/content_scripts/link_hints.js#L647
function getHintStrings(count) {
  let hints = [''];
  let offset = 0;

  while (hints.length - offset < count || hints.length === 1) {
    const hint = hints[offset++];
    for (let ch of linkHintCharacters) {
      hints.push(ch + hint);
    }
  }

  hints = hints.slice(offset, offset + count);

  // Shuffle the hints so that they're scattered; hints starting with the same character and short hints are
  // spread evenly throughout the array.
  return hints.sort().map(str =>
    str
      .split('')
      .reverse()
      .join('')
  );
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

  putHintMarkers(cards);
}

function putTextOverEl(el, text, hintString = '') {
  const elPos = getElementPos(el);

  const hintTextContainer = document.createElement('div');
  const textSpans = text.split('').map((char, index) => {
    const textSpan = document.createElement('span');
    textSpan.innerText = char.toUpperCase();
    // we kind of dim the selected character in the hint string
    if (hintString && hintString.startsWith(text.slice(0, index + 1))) {
      textSpan.style = 'opacity:0.4';
    }
    return textSpan;
  });
  textSpans.forEach(textSpan => hintTextContainer.appendChild(textSpan));
  hintTextContainer.style = `background:rgb(255, 247, 133);padding:2px;color:black;border-width:1px;border-style:solid;border-color:rgb(227, 190, 35);opacity:0.8;line-height:1;position:absolute;display:flex;justify-content:center;align-items:center;font-size:14px;font-weight:700;z-index:100;opactiy:0.5;`;
  hintTextContainer.style.top = `${elPos.top}px`;
  hintTextContainer.style.left = `${elPos.left}px`;
  hintTextContainer.setAttribute(
    'data-special-active-element',
    'chrome-extension'
  );

  document.body.appendChild(hintTextContainer);
}

function highlightCardCreators() {
  const cardCreatorEls = Array.from(
    document.querySelectorAll('[data-sel-card-creator]')
  ).filter(elementInViewport);

  putHintMarkers(cardCreatorEls);
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
  // TODO: Maybe change logic to check if details pane is open or not
  // That's enough
  return /card\/[\d]+(,[\d]+)*$/.test(window.location.href);
  // can't use it because we keep the details pane in DOM all the time. Only remove it from viewport.
  // return !!getDetailsPaneWrapper();
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
  const curtainButtonCollapsed = document.querySelector(
    '.pp-curtain .pp-curtain__btn.pp-curtain__btn--collapsed'
  );

  // only open if we can see the curtain collapsed button
  if (curtainButtonCollapsed) {
    document.querySelector('button.pp-curtain__btn').click();
  }
}

function getAssigneeDropdownEl() {
  return document.querySelector('[data-sel-toolname="assignee_id"]');
}

function openAssigneeTool() {
  let assigneeDropdownEl = getAssigneeDropdownEl();

  if (assigneeDropdownEl) {
    assigneeDropdownEl.click();
  } else {
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

function getColumnNames() {
  return Array.from(document.querySelectorAll('[data-sel-column-header]')).map(
    el => {
      const nameInHeader = el.textContent;
      const indexOfCount = nameInHeader.search(/\([\d]+(\/[\d]+)?\).*$/);
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
    } else {
      // let's try opening dropdown once more
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
      setTimeout(() => {
        selectStatusFromDropdown(columnNameToMoveTo);
        // If i don't put it inside a settimeout, the shift+arrow doesn't work
        // the first time. Works from then onwards. <shrug />
      }, 250);
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
      setTimeout(() => {
        selectStatusFromDropdown(columnNameToMoveTo);
        // If i don't put it inside a settimeout, the shift+arrow doesn't work
        // the first time. Works from then onwards. <shrug />
      }, 250);
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
    nextCard.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}

function selectCardAboveSelectedCard() {
  const previousCard = getPrevCard();
  if (previousCard) {
    previousCard.click();
    previousCard.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
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
    let nextColumn = columnForCard.nextElementSibling;

    // what if the next column does not have any card? We should move on to the next column
    while (nextColumn) {
      const firstCardInColumn = nextColumn.firstElementChild.querySelector(
        'li'
      );
      if (firstCardInColumn) {
        firstCardInColumn.firstElementChild.click();
        firstCardInColumn.firstElementChild.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
        break;
      } else {
        nextColumn = nextColumn.nextElementSibling;
      }
    }
  }
}

function selectCardInPreviousColumn() {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    const columnForCard = getColumnContainerForCard(selectedCard);
    let prevColumn = columnForCard.previousElementSibling;

    // what if the prev column does not have any card? We should move on to the column before
    while (prevColumn) {
      const firstCardInColumn = prevColumn.firstElementChild.querySelector(
        'li'
      );
      if (firstCardInColumn) {
        firstCardInColumn.firstElementChild.click();
        firstCardInColumn.firstElementChild.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
        break;
      } else {
        prevColumn = prevColumn.previousElementSibling;
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
    openAssigneeTool();
    let assigneeDropdownEl = getAssigneeDropdownEl();
    setTimeout(() => {
      if (assigneeDropdownEl) {
        const listContainer = assigneeDropdownEl.querySelector(
          '.pp-simplecombobox__list'
        );
        const items = Array.from(listContainer.querySelectorAll('li')).filter(
          el => !el.querySelector('i.icon-wrong')
        );
        if (items.length > 0) {
          items[0].click();
        }
      }
    }, 500);
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
  if (e.key === 'ArrowDown' || e.key === 'J') {
    multiSelectNextCard();
  } else if (e.key === 'ArrowUp' || e.key === 'K') {
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

function clickDeleteButton() {
  const detailsPaneWrapper = getDetailsPaneWrapper();
  if (detailsPaneWrapper) {
    // TODO: This click also doesn't work. Anything using dropdown sucks.
    detailsPaneWrapper
      .querySelector('.pp-u-details-pane__more-menu')
      .querySelector('.pp-dropdown__trigger')
      .click();
  }
}

function tagAddButtonVisible() {
  return !!document.querySelector('[data-sel-btn-add-tag="true"]');
}

function addTag() {
  const detailsPaneWrapper = getDetailsPaneWrapper();
  if (detailsPaneWrapper) {
    openCurtain();

    setTimeout(() => {
      const planletTool = detailsPaneWrapper.querySelector(
        '[data-sel-toolname="planlet_id"]'
      );
      if (planletTool) {
        const tagTool = planletTool.nextElementSibling;

        if (tagTool) {
          if (!tagAddButtonVisible()) {
            tagTool.firstElementChild.click();
          }
          setTimeout(() => {
            const toolAddButton = tagTool.querySelector(
              '[data-sel-btn-add-tag="true"]'
            );
            toolAddButton.focus();

            toolAddButton.dispatchEvent(
              new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                // If i don't specify the keyCode, it doesn't work
                keyCode: 13,
                // bubbles: true is absolutely essentially if we are working
                // with react coponents
                bubbles: true
              })
            );
          }, 100);
        }
      }
    }, 300);
  }
}

function checklistAddButtonVisible() {
  return document.querySelector('[data-sel-toolname="checklist"]');
}

function addChecklistItem() {
  const detailsPaneWrapper = getDetailsPaneWrapper();
  if (detailsPaneWrapper) {
    openCurtain();

    setTimeout(() => {
      const labelTool = detailsPaneWrapper.querySelector(
        '[data-sel-toolname="label"]'
      );
      if (labelTool) {
        const checklistTool = labelTool.nextElementSibling;

        if (checklistTool) {
          if (!checklistAddButtonVisible()) {
            const blockTool = checklistTool.querySelector('.pp-block-tool');
            if (blockTool) {
              blockTool.firstElementChild.click();
            } else {
              // This should never happen
              console.error(
                'Block tool not found for checklist item',
                checklistTool
              );
            }
          }
          checklistTool
            .querySelector('[data-sel-toolname="checklist"]')
            .firstElementChild.firstElementChild.nextElementSibling.click();
        }
      }
    }, 300);
  }
}

function isSwimlaneHeader(el) {
  return el && el.classList.contains('print-swimlane-header');
}

function toggleSwimlane() {
  const clickcableItems = getClickableItems();

  putHintMarkers(clickcableItems.filter(isSwimlaneHeader));
}

function addComment() {
  if (isAnyCardOnPageSelected()) {
    const commentInput = document.querySelector('.pp-newpost__textarea');

    if (commentInput) {
      commentInput.focus();
    }
  }
}

function getClickableItems() {
  return Array.from(
    document.querySelectorAll('a, button, [role=button]')
  ).filter(elementInViewport);
}

function putHintMarkers(els = []) {
  const hints = getHintStrings(els.length);
  activeElements = {};
  els.forEach((item, index) => {
    activeElements[hints[index]] = item;
    putTextOverEl(item, hints[index]);
  });
}

function highlightClickableItems() {
  const clickableItems = getClickableItems();

  putHintMarkers(clickableItems);
}

function changeTitle() {
  const titleEditor = document.querySelector('.pp-titleeditor__result');
  if (titleEditor) {
    titleEditor.click();
  }
}

function changeDescription() {
  const descEditor = document.querySelector('.pp-description__result');
  if (descEditor) {
    descEditor.click();
  }
}

function rehighlightActiveElements(hintString = '') {
  const oldActiveElements = { ...activeElements };
  if (hintString && activeElements) {
    clearActiveElementOverlays();
    activeElements = Object.fromEntries(
      Object.entries(oldActiveElements).filter(([k, _]) =>
        k.startsWith(hintString)
      )
    );

    Object.entries(activeElements).forEach(([k, v]) => {
      putTextOverEl(v, k, hintString);
    });
  }
}

function activeElementsHaveHintString(activeElements, hintString) {
  return Object.keys(activeElements).some(key => key.startsWith(hintString));
}

function clickDelete() {
  const menu = document.querySelector('.dp-section--consistent__menu');
  if (menu) {
    const menuButton = menu.querySelector('.pp-dropdown__trigger');
    menuButton.click();

    const dropdownContent = menu.querySelector('.pp-dropdown__content');
    if (dropdownContent) {
      const accordionItems = Array.from(
        dropdownContent.querySelectorAll('.pp-accordion__item')
      );
      const deleteItem = accordionItems.find(item =>
        item.querySelector('.pp-btn--delete')
      );

      if (deleteItem) {
        deleteItem?.querySelector('.pp-accordion__trigger').click();
        deleteItem.querySelector('.pp-btn--delete').focus();
      }
    }
  }
}

function start() {
  console.log('start');
  document.addEventListener('keydown', e => {
    // we don't want to interrupt regular input text
    if (activeElementIsAnInputElement()) {
      return;
    }

    console.log('key', e);
    // handle single key strokes, without any modifier keys
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      // if there are some hot elements hwich are ready to be clicked, like + buttons after pressing c,
      // we don't want the normal key bindings to work
      if (activeElements) {
        const hintString = prefixKey ? `${prefixKey}${e.key}` : e.key;

        if (activeElements[hintString]) {
          e.preventDefault();
          activeElements[hintString].click();
          clearActiveElementOverlays();
          clearPrefixKey();
        } else if (activeElementsHaveHintString(activeElements, hintString)) {
          // we don't want to use saveAsPrefixKey because we don't want to
          // clear the prefix key after 2 seconds or whatever time we clear it
          // after
          prefixKey = prefixKey ? `${prefixKey}${e.key}` : e.key;
          rehighlightActiveElements(hintString);

          // this is some horrible logic which i won't remember the next day
          // Need to do something about the combination keys like ab ak etc.
        } else {
          clearPrefixKey();
          clearActiveElementOverlays();
        }

        // very tricky when to clear overlay elements
        // we want to definitely do it if user presses escape
        // Or when we found some activeElement corresponding to hintString
        // Or if user has already pressed 2 characters
        if (e.key === 'Escape') {
          clearActiveElementOverlays();
        }
        // if user is trying out some combination keys like `at` or `gi` etc.
        // TODO: Should instead keep every first key in prefixKey and wait for some time for the second key press
        // if nothing comes, try the single key mappings
        // E.g. ct can be used for create tag when c and t are pressed together very fast
        // Else, if only c was pressed, we wait for 500ms and then do whatever we should for 'c' keypress
      } else if (prefixKey !== null) {
        // TODO
        // am -> assign to me
        if (prefixKey === 'a') {
          switch (e.key) {
            case 'm':
              e.preventDefault();
              assignCardToMe();
              break;
            case 'l':
              e.preventDefault();
              addChecklistItem();
              break;
            case 't':
              e.preventDefault();
              addTag();
              break;
            case 'c':
              e.preventDefault();
              addComment();
              break;
          }
        } else if (prefixKey === 't' && e.key === 's') {
          // ts for toggle swimlane
          e.preventDefault();
          toggleSwimlane();
          // ac for add comment
        } else if (prefixKey === 'c') {
          switch (e.key) {
            // cc for create card
            case 'c':
              e.preventDefault();
              if (isAnyCardOnPageSelected()) {
                // TODO: If a card is already selected, press the + button in the same swimlane
                clickCardCreatorInSelectedCardColumn();
              } else {
                highlightCardCreators();
              }
              break;
            // ct for change title
            case 't':
              e.preventDefault();
              changeTitle();
              break;
            case 'd':
              e.preventDefault();
              changeDescription();
              break;
          }
        }

        clearPrefixKey();
      } else {
        if (e.key === 'Delete') {
          e.preventDefault();
          clickDelete();
        } else if (e.key === 'f') {
          // TODO: This interferes with other actions in an indeterministic way. Will switch off for now.
          // e.preventDefault();
          // toggleFilterSection();
          e.preventDefault();
          highlightClickableItems();
        } else if (e.key === '/') {
          // focus search box
          e.preventDefault();
          focusSearchBox();
        } else if (e.key === 's') {
          e.preventDefault();
          highlightCardsInViewport();
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
          // TODO: Disabling escape to close detailspane for now since it
          // interferes when escape should only cancel a dropdown or just take
          // away focus from an input
          // } else if (e.key === 'Escape') {
          // e.preventDefault();
          // deselectCard();
        } else if (e.key === 'Del') {
          e.preventDefault();
          clickDeleteButton();
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
      } else if (e.key === 'ArrowRight' || e.key === 'L') {
        e.preventDefault();
        moveCardToNextColumn();
      } else if (e.key === '#') {
        e.preventDefault();
        addTag();
      } else if (e.key === 'ArrowLeft' || e.key === 'H') {
        e.preventDefault();
        moveCardToPrevColumn();
      } else if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'J' ||
        e.key === 'K'
      ) {
        e.preventDefault();
        handleMultiSelection(e);
      }
    } else if (e.metaKey && e.key === 'Backspace') {
      e.preventDefault();
      clickDelete();
    }
  });
}

console.log('Awesome extension coming to party!');
setTimeout(start, 1);

// TODO
// - Press '#' to add tag
// - Press 'ac' to add comment
// - Press 'f' to show all clickable areas like buttons and links on the page
// - Raise a PR for boards/SNAP team where i change clickable divs to buttons

// Bugs
// 1. The up/down arrows don't work across swimlanes
// 2. The right/left arrows don't work when they come across an empty column
