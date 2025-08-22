import './style.css'
import './puzzleGame';


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
        <button class="side-btn" id="spin-mode-btn">SPIN</button>
        <button class="side-btn" id="truth-mode-btn">Truth or Dare</button>
        <img id="side-image" class="side-image" src="https://tse3.mm.bing.net/th/id/OIP.BTguMi1K03ueP-zrJjNNcwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="side image">
        <img id="aa-logo" src="/AA_logo.jpg" alt="AA Logo" class="side-image">
        <div id="side-window"></div>
      </div>
    </div>
  </div>
`;

// Layout logic
const sideWindow = document.getElementById('side-window');
const spinModeBtn = document.getElementById('spin-mode-btn');
const truthModeBtn = document.getElementById('truth-mode-btn');
const sideImage = document.getElementById('side-image');
const aaLogo = document.getElementById('aa-logo');
const sideSection = document.querySelector('.side-section');

function showHomeBtns() {
  spinModeBtn.style.display = 'block';
  truthModeBtn.style.display = 'block';
  sideImage.style.display = 'block';
  aaLogo.style.display = 'block';
  sideWindow.innerHTML = '';
}
function hideHomeBtns() {
  spinModeBtn.style.display = 'none';
  truthModeBtn.style.display = 'none';
  sideImage.style.display = 'none';
  aaLogo.style.display = 'none';
}
function showHomeBtn(callback) {
  sideWindow.innerHTML += `<button class="side-home-btn" id="side-home-btn">Home</button>`;
  document.getElementById('side-home-btn').onclick = () => {
    showHomeBtns();
    if (callback) callback();
  };
}
function showSpinWheel() {
  sideWindow.innerHTML = '';
  hideHomeBtns();

  const points = [0, 1000, 10, 100, 150, 20, 500, 50, 250, '100 + Bonus Spin', 5, 200];

  function drawWheel(rotation = 0) {
    const canvas = document.getElementById('spin-wheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const numSegments = points.length;
    const angleStep = (2 * Math.PI) / numSegments;
    const radius = canvas.width / 2;
    const colors = [
        ['#3CACCF', '#327A8F'], // Blue gradient
        ['#ff0000', '#D80000'], // Red gradient
        ['#41F09A', '#2EAF72'], // Green gradient
        ['#FFD700', '#D98E00']  // Orange gradient
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(rotation * Math.PI / 180);

    points.forEach((point, i) => {
        const angle = i * angleStep;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + angleStep);
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, colors[i % colors.length][0]);
        gradient.addColorStop(1, colors[i % colors.length][1]);
        ctx.fillStyle = gradient;

        ctx.fill();

        ctx.save();
        ctx.rotate(angle + angleStep / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        if (point === '100 + Bonus Spin') {
            ctx.font = 'bold 10px Arial';
        } else {
            ctx.font = 'bold 14px Arial';
        }
        ctx.fillText(point, radius - 10, 0);
        ctx.restore();
    });

    ctx.restore();
  }

  sideWindow.innerHTML = `
    <div class="spin-wheel-container">
      <canvas id="spin-wheel" width="250" height="250"></canvas>
      <button class="spin-btn" id="spin-btn">Spin</button>
    </div>
    <div class="bottom-right-buttons">
      <button id="leaderboard-btn" class="aa-button">Leader Board</button>
      <button id="history-btn" class="aa-button">Points History</button>
      <button id="reset-btn" class="aa-button">Reset</button>
    </div>
  `;
  setTimeout(drawWheel, 0);
  showHomeBtn(() => sideWindow.innerHTML = '');

  const spinBtn = document.getElementById('spin-btn');
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const historyBtn = document.getElementById('history-btn');
  const resetBtn = document.getElementById('reset-btn');

  let spinning = false;
  let currentRotation = 0;
  let animationFrameId = null;

  function getScoreFromAngle(angle) {
    const winningAngle = (0 - (angle % 360) + 360) % 360;
    const sectionAngle = 360 / points.length;
    const sectionIndex = Math.floor(winningAngle / sectionAngle);
    return points[sectionIndex];
  }

  async function updateScores(name, score) {
    await fetch('http://localhost:3001/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
  }

  function renderScoresPopup(title, scoresData) {
    const popup = document.createElement('div');
    popup.classList.add('history-popup-container');
    
    let tableHTML = `<div class="history-popup"><h2>${title}</h2>`;
    if (scoresData && scoresData.length > 0) {
      scoresData.sort((a, b) => b.score - a.score);
      tableHTML += '<table><thead><tr><th>Name</th><th>Score</th></tr></thead><tbody>';
      scoresData.forEach(player => {
        tableHTML += `<tr><td>${player.name.toUpperCase()}</td><td>${player.score}</td></tr>`;
      });
      tableHTML += '</tbody></table>';
    } else {
      tableHTML += '<p>No scores yet!</p>';
    }
    tableHTML += '<button id="close-popup-btn">Close</button></div>';
    
    popup.innerHTML = tableHTML;
    document.body.appendChild(popup);

    popup.querySelector('#close-popup-btn').addEventListener('click', () => {
      document.body.removeChild(popup);
    });
  }

  function animateSpin() {
    currentRotation += 15; // Adjust for spin speed
    drawWheel(currentRotation);
    animationFrameId = requestAnimationFrame(animateSpin);
  }

  spinBtn.addEventListener('click', () => {
    if (!spinning) {
        spinning = true;
        spinBtn.textContent = 'Stop';
        animateSpin();
    } else {
        spinning = false;
        spinBtn.textContent = 'Spin';
        cancelAnimationFrame(animationFrameId);

        const spinTime = 4000; // 4 seconds to slow down
        const randomExtraRotation = 360 * (Math.floor(Math.random() * 2) + 1);
        const randomStopAngle = Math.floor(Math.random() * 360);
        const targetRotation = currentRotation + randomExtraRotation + randomStopAngle;

        let startTime = null;

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const easeOutCubic = 1 - Math.pow(1 - progress / spinTime, 3);
            const rotation = currentRotation + (targetRotation - currentRotation) * easeOutCubic;

            drawWheel(rotation);

            if (progress < spinTime) {
                requestAnimationFrame(animate);
            } else {
                currentRotation = targetRotation;
                const finalAngle = currentRotation % 360;
                const score = getScoreFromAngle(finalAngle);

                const name = prompt(`You won ${score}! Enter your name:`);
                if (name) {
                    if (typeof score === 'number') {
                        updateScores(name, score);
                    } else { // Handle "100 + Bonus Spin"
                        updateScores(name, 100);
                        setTimeout(() => spinBtn.click(), 500);
                    }
                }
            }
        }

        requestAnimationFrame(animate);
    }
  });

  leaderboardBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scores?today=true', { cache: 'no-cache' });
      const scores = await response.json();
      renderScoresPopup("Today's Leaderboard", scores);
    } catch (e) {
      console.error('Error fetching leaderboard scores:', e);
      alert('Could not fetch leaderboard scores. Is the backend server running?');
    }
  });

  historyBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scores', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const scores = await response.json();

      const historyPopup = document.createElement('div');
      historyPopup.classList.add('history-popup-container');
      
      let historyHTML = '<div class="history-popup"><h2>Points History</h2>';
      if (Object.keys(scores).length > 0) {
        const dates = Object.keys(scores).reverse();
        for (const date of dates) {
          historyHTML += `<h3>${date}</h3>`;
          const dailyScores = scores[date];
          dailyScores.sort((a, b) => b.score - a.score);
          historyHTML += '<table><thead><tr><th>Name</th><th>Score</th></tr></thead><tbody>';
          dailyScores.forEach(player => {
            historyHTML += `<tr><td>${player.name.toUpperCase()}</td><td>${player.score}</td></tr>`;
          });
          historyHTML += '</tbody></table>';
        }
      } else {
        historyHTML += '<p>No history yet!</p>';
      }
      historyHTML += '<button id="close-history-btn">Close</button></div>';
      
      historyPopup.innerHTML = historyHTML;
      document.body.appendChild(historyPopup);

      historyPopup.querySelector('#close-history-btn').addEventListener('click', () => {
        document.body.removeChild(historyPopup);
      });
    } catch (e) {
      console.error('Error fetching history:', e);
      alert('Could not fetch history. Is the backend server running?\n' + e.message);
    }
  });

  resetBtn.addEventListener('click', () => {
    const resetPopup = document.createElement('div');
    resetPopup.classList.add('history-popup-container');
    
    resetPopup.innerHTML = `
      <div class="history-popup">
        <h2>Reset Scores</h2>
        <div>
          <input type="checkbox" id="reset-leaderboard-check">
          <label for="reset-leaderboard-check">Leader board reset</label>
        </div>
        <div>
          <input type="checkbox" id="reset-history-check">
          <label for="reset-history-check">History table reset</label>
        </div>
        <div>
          <label for="reset-password">Password:</label>
          <input type="password" id="reset-password">
        </div>
        <button id="confirm-reset-btn">Reset</button>
        <button id="cancel-reset-btn">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(resetPopup);

    resetPopup.querySelector('#cancel-reset-btn').addEventListener('click', () => {
      document.body.removeChild(resetPopup);
    });

    resetPopup.querySelector('#confirm-reset-btn').addEventListener('click', async () => {
      const password = resetPopup.querySelector('#reset-password').value;
      if (password !== 'reset123') {
        alert('Incorrect password!');
        return;
      }

      const resetLeaderboard = resetPopup.querySelector('#reset-leaderboard-check').checked;
      const resetHistory = resetPopup.querySelector('#reset-history-check').checked;

      try {
        if (resetLeaderboard) {
          const response = await fetch('http://localhost:3001/api/reset/today', { method: 'POST' });
          if (!response.ok) {
            throw new Error('Failed to reset leaderboard');
          }
        }

        if (resetHistory) {
          const response = await fetch('http://localhost:3001/api/reset/all', { method: 'POST' });
          if (!response.ok) {
            throw new Error('Failed to reset history');
          }
        }

        alert('Scores have been reset.');
        location.reload(); // Reload the page

      } catch (e) {
        alert('Error: ' + e.message);
      }
    });
  });
}
spinModeBtn.onclick = showSpinWheel;
import { truthQuestions, dareQuestions } from './questions.js';
function showTruthOrDare() {
  hideHomeBtns();

  let usedTruths = JSON.parse(localStorage.getItem('usedTruths')) || [];
  let usedDares = JSON.parse(localStorage.getItem('usedDares')) || [];
  console.log('Loaded usedTruths:', usedTruths);
  console.log('Loaded usedDares:', usedDares);

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
  const optionsContainer = document.getElementById('td-options-container');
  const questionDisplay = document.getElementById('td-question');

  function renderOptions(mode) {
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
            localStorage.setItem('usedTruths', JSON.stringify(usedTruths));
          } else {
            localStorage.setItem('usedDares', JSON.stringify(usedDares));
          }
        }
      });
      buttonContainer.appendChild(optionBtn);
    }
  }

  const resetTdBtn = document.getElementById('td-reset-btn');
  resetTdBtn.addEventListener('click', () => {
    localStorage.removeItem('usedTruths');
    localStorage.removeItem('usedDares');
    usedTruths = []; // Reset in-memory arrays
    usedDares = [];   // Reset in-memory arrays
    renderOptions('truth'); // Re-render truth options to show them enabled
    renderOptions('dare'); // Re-render dare options to show them enabled
    questionDisplay.textContent = ''; // Clear displayed question
  });

  truthBtn.addEventListener('click', () => {
    truthBtn.classList.add('active');
    dareBtn.classList.remove('active');
    renderOptions('truth');
  });

  dareBtn.addEventListener('click', () => {
    dareBtn.classList.add('active');
    truthBtn.classList.remove('active');
    renderOptions('dare');
  });
}

truthModeBtn.onclick = showTruthOrDare;