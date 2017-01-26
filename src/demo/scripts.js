// Use special focus styles when keyboard navigation is in use
let lastEventType;
const focusClass = 'js-keyboard-focus';
const links = document.getElementsByTagName('a');
const buttons = document.getElementsByTagName('button');

const blurHandler = event => {
  event.target.classList.remove(focusClass);
  event.target.removeEventListener('blur', blurHandler);
};

const focusHandler = event => {
  if (lastEventType === 'keydown') {
    event.target.classList.add(focusClass);
    event.target.addEventListener('blur', blurHandler);
  }
};

document.body.addEventListener('click', () => lastEventType = 'click');
document.body.addEventListener('keydown', () => lastEventType = 'keydown');

[...links, ...buttons].forEach(el => el.addEventListener('focus', focusHandler));
