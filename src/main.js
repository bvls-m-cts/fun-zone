import './style.css';
import './puzzleGame.js';
import { showSpinWheel } from './spin.js';
import { showTruthOrDare } from './truthOrDare.js';

document.querySelector('#app').innerHTML = `
  <div class="app-bg">
    <div class="main-layout">
      <div class="quiz-section">
        <div id="car"></div>
        <div class="quiz-window">
          <div id="game-root"></div>
          
        </div>
      </div>
      <div class="side-section">
        <button class="side-btn" id="spin-mode-btn">Spin</button>
        <button class="side-btn" id="truth-mode-btn">Truth or Dare</button>
        <img id="side-image" class="side-image" src="https://tse3.mm.bing.net/th/id/OIP.BTguMi1K03ueP-zrJjNNcwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="side image">
        <img id="aa-logo" src="/AA_logo.jpg" alt="AA Logo" class="side-image">
        <div id="side-window"></div>
      </div>
    </div>
  </div>
`;

const spinModeBtn = document.getElementById('spin-mode-btn');
const truthModeBtn = document.getElementById('truth-mode-btn');

spinModeBtn.onclick = showSpinWheel;
truthModeBtn.onclick = showTruthOrDare;
