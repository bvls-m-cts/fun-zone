import { hideHomeBtns, showHomeBtn } from './ui.js';
import { truthQuestions, dareQuestions } from './questions.js';

function renderOptions(mode, usedTruths, usedDares) {
  const questionDisplay = document.getElementById('td-question');
  const optionsContainer = document.getElementById('td-options-container');

  questionDisplay.innerHTML = '';
  optionsContainer.innerHTML = '<p class="td-instruction">Choose an option to reveal the question</p>';
  const questions = mode === 'truth' ? truthQuestions : dareQuestions;
  const usedQuestions = mode === 'truth' ? usedTruths : usedDares;
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('td-options-buttons');
  optionsContainer.appendChild(buttonContainer);

  for (let i = 0; i < questions.length; i++) {
    const optionBtn = document.createElement('button');
    optionBtn.classList.add('td-option-btn');
    optionBtn.textContent = i + 1;
    if (usedQuestions.includes(i)) {
      optionBtn.classList.add('disabled');
      optionBtn.disabled = true;
    }
    optionBtn.addEventListener('click', () => {
      questionDisplay.textContent = questions[i];
      optionBtn.classList.add('disabled');
      optionBtn.disabled = true;
      if (!usedQuestions.includes(i)) {
        usedQuestions.push(i);
        if (mode === 'truth') {
          localStorage.setItem('usedTruths', JSON.stringify(usedQuestions));
        } else {
          localStorage.setItem('usedDares', JSON.stringify(usedQuestions));
        }
      }
    });
    buttonContainer.appendChild(optionBtn);
  }
}

export function showTruthOrDare() {
  const sideWindow = document.getElementById('side-window');
  hideHomeBtns();

  let usedTruths = JSON.parse(localStorage.getItem('usedTruths')) || [];
  let usedDares = JSON.parse(localStorage.getItem('usedDares')) || [];

  sideWindow.innerHTML = `
    <div class="truth-dare-window">
      <button class="truth-btn" id="truth-btn">Truth</button>
      <button class="dare-btn" id="dare-btn">Dare</button>
      <div id="td-options-container" class="td-options-container"></div>
      <div id="td-question" class="td-question"></div>
      <button class="td-reset-btn" id="td-reset-btn">Reset Options</button>
    </div>
  `;
  showHomeBtn(() => {
    sideWindow.innerHTML = '';
  });

  const truthBtn = document.getElementById('truth-btn');
  const dareBtn = document.getElementById('dare-btn');
  const questionDisplay = document.getElementById('td-question');

  const resetTdBtn = document.getElementById('td-reset-btn');
  resetTdBtn.addEventListener('click', () => {
    localStorage.removeItem('usedTruths');
    localStorage.removeItem('usedDares');
    usedTruths = []; // Reset in-memory arrays
    usedDares = [];   // Reset in-memory arrays
    renderOptions('truth', usedTruths, usedDares); // Re-render truth options to show them enabled
    renderOptions('dare', usedTruths, usedDares); // Re-render dare options to show them enabled
    questionDisplay.textContent = ''; // Clear displayed question
  });

  truthBtn.addEventListener('click', () => {
    truthBtn.classList.add('active');
    dareBtn.classList.remove('active');
    renderOptions('truth', usedTruths, usedDares);
  });

  dareBtn.addEventListener('click', () => {
    dareBtn.classList.add('active');
    truthBtn.classList.remove('active');
    renderOptions('dare', usedTruths, usedDares);
  });
}