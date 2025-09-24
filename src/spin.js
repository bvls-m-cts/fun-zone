import { hideHomeBtns, showHomeBtn, renderScoresPopup } from './ui.js';

function drawWheel(points, rotation = 0) {
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

function getScoreFromAngle(points, angle) {
  const winningAngle = (0 - (angle % 360) + 360) % 360;
  const sectionAngle = 360 / points.length;
  const sectionIndex = Math.floor(winningAngle / sectionAngle);
  return points[sectionIndex];
}

async function updateScores(name, score) {
  try {
    const response = await fetch('http://localhost:3001/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update scores');
    }
  } catch (e) {
    console.error('Error updating scores:', e);
    alert('Could not update scores. Is the backend server running?\n' + e.message);
  }
}

export function showSpinWheel() {
  const sideWindow = document.getElementById('side-window');
  sideWindow.innerHTML = '';
  hideHomeBtns();

  const points = [0, 1000, 10, 100, 150, 20, 500, 50, 250, '100 + Bonus Spin', 5, 200];

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
  setTimeout(() => drawWheel(points), 0);
  showHomeBtn(() => sideWindow.innerHTML = '');

  const spinBtn = document.getElementById('spin-btn');
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const historyBtn = document.getElementById('history-btn');
  const resetBtn = document.getElementById('reset-btn');

  let spinning = false;
  let currentRotation = 0;
  let animationFrameId = null;

  function animateSpin() {
    currentRotation += 15; // Adjust for spin speed
    drawWheel(points, currentRotation);
    animationFrameId = requestAnimationFrame(animateSpin);
  }

  function showNamePopup(score) {
    // Fetch player names from backend file
    fetch('http://localhost:3001/api/players')
      .then(res => res.json())
      .then(playerNames => {
        const popup = document.createElement('div');
        popup.classList.add('history-popup-container');
        let optionsHTML = playerNames.map(name => `<option value="${name}">${name}</option>`).join('');
        popup.innerHTML = `
          <div class="history-popup">
            <h2>You won ${score}!</h2>
            <label for="player-name-select">Choose the player:</label>
            <select id="player-name-select">
              <option value="">--Select--</option>
              ${optionsHTML}
            </select>
            <br><br>
            <label for="player-name-input">Or Add new player:</label>
            <input type="text" id="player-name-input" style="font-size:18px;padding:5px;width:220px;">
            <br><br>
            <button id="submit-score-btn">Submit</button>
            <button id="cancel-score-btn">Cancel</button>
          </div>
        `;
        document.body.appendChild(popup);
        const select = popup.querySelector('#player-name-select');
        const input = popup.querySelector('#player-name-input');
        select.addEventListener('change', () => {
          input.value = select.value;
        });
        popup.querySelector('#cancel-score-btn').addEventListener('click', () => {
          document.body.removeChild(popup);
        });
        popup.querySelector('#submit-score-btn').addEventListener('click', async () => {
          let name = input.value.trim();
          if (!name) {
            alert('Please enter or select a name.');
            return;
          }
          // Add new name to backend if not present
          if (!playerNames.includes(name)) {
            await fetch('http://localhost:3001/api/players', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
            });
          }
          await updateScores(name, score);
          document.body.removeChild(popup);
        });
      });
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

            drawWheel(points, rotation);

            if (progress < spinTime) {
                requestAnimationFrame(animate);
            } else {
                currentRotation = targetRotation;
                const finalAngle = currentRotation % 360;
                const score = getScoreFromAngle(points, finalAngle);
                if (typeof score === 'number') {
                  showNamePopup(score);
                } else { // Handle "100 + Bonus Spin"
                  showNamePopup(100);
                  setTimeout(() => spinBtn.click(), 500);
                }
            }
        }

        requestAnimationFrame(animate);
    }
  });

  leaderboardBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scores?today=true', { cache: 'no-cache' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch leaderboard scores');
      }
      const scores = await response.json();
      renderScoresPopup("Today's Leaderboard", scores);
    } catch (e) {
      console.error('Error fetching leaderboard scores:', e);
      alert('Could not fetch leaderboard scores. Is the backend server running?\n' + e.message);
    }
  });

  historyBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('http://localhost:3001/api/scores', { cache: 'no-cache' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch history');
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
      const resetLeaderboard = resetPopup.querySelector('#reset-leaderboard-check').checked;
      const resetHistory = resetPopup.querySelector('#reset-history-check').checked;

      try {
        if (resetLeaderboard) {
          const response = await fetch('http://localhost:3001/api/reset/today', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reset leaderboard');
          }
        }

        if (resetHistory) {
          const response = await fetch('http://localhost:3001/api/reset/all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reset history');
          }
        }

        alert('Scores have been reset.');
        location.reload(); // Reload the page

      } catch (e) {
        if (e instanceof TypeError) {
          alert('Could not connect to the server. Please make sure it is running.');
        } else {
          alert('Error: ' + e.message);
        }
      }
    });
  });
}