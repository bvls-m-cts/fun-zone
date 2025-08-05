import './style.css'
import './puzzleGame';

document.querySelector('#app').innerHTML = `
  <div class="app-bg">
    <div class="main-layout">
      <div class="quiz-section">
        <div id="game-root"></div>
        <div class="dev-credit">@ by Bhargava_Mandalaneni</div>
      </div>
      <div class="side-section">
        <button class="side-btn" id="spin-mode-btn">SPIN</button>
        <button class="side-btn" id="truth-mode-btn">Truth or Dare</button>
        <div id="side-window"></div>
      </div>
    </div>
  </div>
`;

// Layout logic
const sideWindow = document.getElementById('side-window');
const spinModeBtn = document.getElementById('spin-mode-btn');
const truthModeBtn = document.getElementById('truth-mode-btn');
const sideSection = document.querySelector('.side-section');

function showHomeBtns() {
  spinModeBtn.style.display = 'block';
  truthModeBtn.style.display = 'block';
  sideWindow.innerHTML = '';
}
function hideHomeBtns() {
  spinModeBtn.style.display = 'none';
  truthModeBtn.style.display = 'none';
}
function showHomeBtn(callback) {
  sideWindow.innerHTML += `<button class="side-home-btn" id="side-home-btn">Home</button>`;
  document.getElementById('side-home-btn').onclick = () => {
    showHomeBtns();
    if (callback) callback();
  };
}
function showSpinBar() {
  hideHomeBtns();
  sideWindow.innerHTML = `
    <div class="spin-bar" id="spin-bar">
      <div class="spin-point">10</div>
      <div class="spin-point">50</div>
      <div class="spin-point">100</div>
      <div class="spin-point">250</div>
      <div class="spin-point">500</div>
      <div class="spin-point">1000</div>
      <div class="spin-bar-arrow">&#9654;</div>
    </div>
    <button class="spin-btn" id="spin-btn">Spin</button>
  `;
  showHomeBtn(() => sideWindow.innerHTML = '');
  // Spin bar logic
  const spinBtn = document.getElementById('spin-btn');
  const spinBar = document.getElementById('spin-bar');
  const points = Array.from(document.querySelectorAll('.spin-point'));
  let spinning = false;
  let spinInterval = null;
  let selectedIdx = 0;
  function highlightPoint(idx) {
    points.forEach((el, i) => {
      el.style.background = i === idx ? 'linear-gradient(90deg, #ffe600 0%, #ff00cc 100%)' : 'linear-gradient(90deg, #222 60%, #ffe60022 100%)';
      el.style.color = i === idx ? '#222' : '#ffe600';
      el.style.boxShadow = i === idx ? '0 0 18px #ff00cc, 0 0 32px #ffe600' : '';
    });
  }
  spinBtn.addEventListener('click', () => {
    if (!spinning) {
      spinning = true;
      spinBtn.textContent = 'Stop';
      spinInterval = setInterval(() => {
        const idx = Math.floor(Math.random() * points.length);
        highlightPoint(idx);
      }, 40);
    } else {
      spinning = false;
      spinBtn.textContent = 'Spin';
      clearInterval(spinInterval);
      selectedIdx = Math.floor(Math.random() * points.length);
      highlightPoint(selectedIdx);
    }
  });
}
const truthQuestions = [
  "What's your biggest fear?",
  "What's a secret you've never told anyone?",
  "Who was your first crush?",
  "What's the most embarrassing thing you've done?",
  "What's your wildest dream?",
  "What's the last lie you told?",
  "What's your favorite guilty pleasure?",
  "What's the most trouble you've been in?",
  "What's something you wish you could change about yourself?",
  "What's the most daring thing you've ever done?"
];
const dareQuestions = [
  "Do a silly dance for 30 seconds.",
  "Sing a song loudly.",
  "Act like your favorite animal.",
  "Speak in a funny accent for 1 minute.",
  "Do 10 jumping jacks.",
  "Pretend to be a celebrity.",
  "Tell a joke.",
  "Draw a mustache on your face with a washable marker.",
  "Do your best impression of someone in the room.",
  "Try to touch your toes for 10 seconds."
];
function showTruthOrDare() {
  hideHomeBtns();
  // Restore last mode and indices from localStorage if available
  let tdTruthIndex = 0;
  let tdDareIndex = 0;
  let tdMode = null;
  const saved = localStorage.getItem('tdState');
  if (saved) {
    const state = JSON.parse(saved);
    tdTruthIndex = state.tdTruthIndex ?? 0;
    tdDareIndex = state.tdDareIndex ?? 0;
    tdMode = state.tdMode;
  }
  sideWindow.innerHTML = `
    <div class="truth-dare-window">
      <button class="truth-btn" id="truth-btn">Truth</button>
      <button class="dare-btn" id="dare-btn">Dare</button>
      <div id="td-question" class="td-question"></div>
      <div class="td-nav td-nav-center" id="td-nav" style="display:none;">
        <button class="td-nav-btn" id="td-back">Back</button>
        <button class="td-nav-btn" id="td-next">Next</button>
      </div>
    </div>
  `;
  showHomeBtn(() => sideWindow.innerHTML = '');
  const tdQuestion = document.getElementById('td-question');
  const truthBtn = document.getElementById('truth-btn');
  const dareBtn = document.getElementById('dare-btn');
  const tdNav = document.getElementById('td-nav');
  function updateTDQuestion() {
    if (tdMode === 'truth') {
      tdQuestion.textContent = truthQuestions[tdTruthIndex];
    } else if (tdMode === 'dare') {
      tdQuestion.textContent = dareQuestions[tdDareIndex];
    } else {
      tdQuestion.textContent = '';
    }
    // Highlight active button
    truthBtn.classList.toggle('active', tdMode === 'truth');
    dareBtn.classList.toggle('active', tdMode === 'dare');
    // Save state
    localStorage.setItem('tdState', JSON.stringify({ tdTruthIndex, tdDareIndex, tdMode }));
    // Show nav only after mode is selected
    tdNav.style.display = (tdMode === 'truth' || tdMode === 'dare') ? 'flex' : 'none';
  }
  truthBtn.onclick = () => {
    tdMode = 'truth';
    updateTDQuestion();
  };
  dareBtn.onclick = () => {
    tdMode = 'dare';
    updateTDQuestion();
  };
  document.getElementById('td-back').onclick = () => {
    if (tdMode === 'truth' && tdTruthIndex > 0) tdTruthIndex--;
    if (tdMode === 'dare' && tdDareIndex > 0) tdDareIndex--;
    updateTDQuestion();
  };
  document.getElementById('td-next').onclick = () => {
    if (tdMode === 'truth' && tdTruthIndex < truthQuestions.length - 1) tdTruthIndex++;
    if (tdMode === 'dare' && tdDareIndex < dareQuestions.length - 1) tdDareIndex++;
    updateTDQuestion();
  };
  updateTDQuestion();
}
spinModeBtn.onclick = showSpinBar;
truthModeBtn.onclick = showTruthOrDare;
window.addEventListener('beforeunload', () => {
  localStorage.removeItem('tdState');
});
