export function showHomeBtns() {
  const sideWindow = document.getElementById('side-window');
  const spinModeBtn = document.getElementById('spin-mode-btn');
  const truthModeBtn = document.getElementById('truth-mode-btn');
  const sideImage = document.getElementById('side-image');
  const aaLogo = document.getElementById('aa-logo');
  const creditsIcon = document.getElementById('credits-icon');

  spinModeBtn.style.display = 'block';
  truthModeBtn.style.display = 'block';
  sideImage.style.display = 'block';
  aaLogo.style.display = 'block';
  sideWindow.innerHTML = '';
  if (creditsIcon) creditsIcon.style.display = 'flex';
}

export function hideHomeBtns() {
  const spinModeBtn = document.getElementById('spin-mode-btn');
  const truthModeBtn = document.getElementById('truth-mode-btn');
  const sideImage = document.getElementById('side-image');
  const aaLogo = document.getElementById('aa-logo');
  const creditsIcon = document.getElementById('credits-icon');

  spinModeBtn.style.display = 'none';
  truthModeBtn.style.display = 'none';
  sideImage.style.display = 'none';
  aaLogo.style.display = 'none';
  if (creditsIcon) creditsIcon.style.display = 'none';
}

export function showHomeBtn(callback) {
  const sideWindow = document.getElementById('side-window');
  sideWindow.innerHTML += `<button class="side-home-btn" id="side-home-btn">Home</button>`;
  document.getElementById('side-home-btn').onclick = () => {
    showHomeBtns();
    if (callback) callback();
  };
}

export function renderScoresPopup(title, scoresData) {
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

export function showCreditsPopup() {
  const popup = document.createElement('div');
  popup.classList.add('credits-popup-container');
  popup.innerHTML = `
    <div class="credits-popup">
      <h2>Credits</h2>
      <div class="credits-section">
        <h3>Developer</h3>
        <div class="credits-person">Bhargava Mandalaneni</div>
      </div>
      <div class="credits-section">
        <h3>Quiz Contributor</h3>
        <div class="credits-person">Sangeetha Seshadri</div>
        <div class="credits-person">Usha Nandhini</div>
        <div class="credits-person">Bhargava Mandalaneni</div>
      </div>
      <div class="credits-section">
        <h3>Advisor</h3>
        <div class="credits-person">Karthick Ramamurthy</div>
        <div class="credits-person">Sivasankar Natarajan</div>
      </div>
      <button id="close-credits-btn">Close</button>
    </div>
  `;
  document.body.appendChild(popup);
  popup.querySelector('#close-credits-btn').addEventListener('click', () => {
    document.body.removeChild(popup);
  });
}