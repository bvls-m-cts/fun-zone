import Phaser from 'phaser';
import { puzzles } from './puzzles';

class StartScene extends Phaser.Scene {
  constructor() {
    super('Start');
  }
  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#111');
    // Centered Start button only
    const startBtn = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Start', {
      fontSize: '36px',
      color: '#fff',
      backgroundColor: '#ff00cc',
      padding: { x: 30, y: 15 }
    })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('Puzzle'));
    startBtn.setAlpha(0.95);
    startBtn.on('pointerover', () => startBtn.setAlpha(1));
    startBtn.on('pointerout', () => startBtn.setAlpha(0.95));
  }
}

class PuzzleScene extends Phaser.Scene {
  constructor() {
    super('Puzzle');
    this.currentPuzzle = 0;
    this.puzzleList = [];
  }
  preload() {
    // Preload all images used in puzzles
    const allImages = [];
    (puzzles.all || []).forEach(p => {
      if (Array.isArray(p.images)) allImages.push(...p.images);
    });
    // Remove duplicates
    const uniqueImages = [...new Set(allImages)];
    uniqueImages.forEach((img) => {
      // If it's a remote URL, load as is; else, remove 'public/' prefix
      const isRemote = /^https?:\/\//.test(img);
      const key = isRemote ? img : img.replace(/^public\//, '');
      if (isRemote) {
        this.load.image(key, img);
      } else {
        this.load.image(key, img.replace(/^public\//, ''));
      }
    });
  }
  create() {
    this.puzzleList = puzzles.all;
    this.currentPuzzle = 0;
    this.showPuzzle();
  }
  showPuzzle() {
    this.cameras.main.setBackgroundColor('#111');
    this.children.removeAll();
    const puzzle = this.puzzleList[this.currentPuzzle];
    if (!puzzle) {
      this.add.text(200, 200, 'No more puzzles! Congrats!', { fontSize: '32px', color: '#fff' });
      // Home button at top right
      const homeBtn = this.add.text(this.sys.game.config.width - 120, 30, '🏠 Home', { fontSize: '22px', color: '#fff', backgroundColor: '#222', padding: { x: 10, y: 5 } })
        .setInteractive()
        .on('pointerdown', () => this.scene.start('Start'));
      homeBtn.setAlpha(0.85);
      homeBtn.on('pointerover', () => homeBtn.setAlpha(1));
      homeBtn.on('pointerout', () => homeBtn.setAlpha(0.85));
      return;
    }
    const questionText = this.add.text(100, 100, puzzle.question, { fontSize: '22px', color: '#fff', wordWrap: { width: 600 } });
    questionText.setAlpha(0);
    this.tweens.add({ targets: questionText, alpha: 1, duration: 600, delay: 200 });
    let lastY = 180;
    let answerText;
    let inputBox;
    let revealed = false;
    if (puzzle.type === 'multiple-choice') {
      answerText = this.add.text(400, 420, '', { fontSize: '20px', color: '#00fff7' });
      puzzle.options.forEach((opt, i) => {
        const optText = this.add.text(120, lastY + i * 40, opt, { fontSize: '20px', color: '#fff', backgroundColor: '#333' })
          .setInteractive()
          .on('pointerdown', () => {
            if (!revealed) answerText.setText('');
            // No correct/wrong feedback here
          });
        optText.setAlpha(0);
        this.tweens.add({ targets: optText, alpha: 1, duration: 400, delay: 400 + i * 100 });
      });
      lastY += puzzle.options.length * 40;
    } else if (
      puzzle.type === 'fill-in-the-blank' ||
      puzzle.type === 'riddle' ||
      puzzle.type === 'word-image'
    ) {
      inputBox = this.add.dom(400, lastY + 30).createFromHTML('<input type="text" id="answerInput" style="font-size:20px;padding:5px;width:220px;">');
      answerText = this.add.text(400, 420, '', { fontSize: '20px', color: '#00fff7' });
      // Check Answer button
      const checkBtn = this.add.text(650, lastY + 20, 'Check', { fontSize: '20px', color: '#fff', backgroundColor: '#27ae60', padding: { x: 10, y: 5 } })
        .setInteractive()
        .on('pointerdown', () => {
          if (revealed) return;
          // No correct/wrong feedback here
        });
      checkBtn.setAlpha(0.9);
      checkBtn.on('pointerover', () => checkBtn.setAlpha(1));
      checkBtn.on('pointerout', () => checkBtn.setAlpha(0.9));
      lastY += 120;
    } else if (puzzle.type === 'image-choice') {
      answerText = this.add.text(this.sys.game.config.width / 2, 420, '', { fontSize: '20px', color: '#f39c12' }).setOrigin(0.5, 0.5);
      // Center images horizontally and auto-fit size (maximize size)
      const imgCount = puzzle.images.length;
      const maxTotalWidth = this.sys.game.config.width - 40; // 20px margin on each side
      const spacing = 32;
      let imgSize = 240;
      if (imgCount * imgSize + (imgCount - 1) * spacing > maxTotalWidth) {
        imgSize = Math.floor((maxTotalWidth - (imgCount - 1) * spacing) / imgCount);
      }
      const totalWidth = imgCount * imgSize + (imgCount - 1) * spacing;
      const startX = (this.sys.game.config.width - totalWidth) / 2 + imgSize / 2;
      puzzle.images.forEach((img, i) => {
        const isRemote = /^https?:\/\//.test(img);
        const key = isRemote ? img : img.replace(/^public\//, '');
        const x = startX + i * (imgSize + spacing);
        const imgObj = this.add.image(x, lastY + imgSize / 2, key)
          .setDisplaySize(imgSize, imgSize)
          .setInteractive();
        imgObj.setAlpha(0);
        this.tweens.add({ targets: imgObj, alpha: 1, duration: 500, delay: 400 + i * 120 });
        imgObj.on('pointerdown', () => {
          if (!revealed) answerText.setText('');
        });
      });
      lastY += imgSize + 60;
    }
    // Center answer text for all puzzle types and set color to orange
    if (answerText) {
      answerText.setX(this.sys.game.config.width / 2);
      answerText.setOrigin(0.5, 0.5);
      answerText.setColor('#f39c12');
    }
    // Reveal Answer button (top left)
    const revealBtnX = 30;
    const revealBtnY = 30;
    const revealBtn = this.add.text(revealBtnX, revealBtnY, 'Reveal Answer', { fontSize: '20px', color: '#fff', backgroundColor: '#f39c12', padding: { x: 16, y: 8 } })
      .setInteractive()
      .on('pointerdown', () => {
        revealed = true;
        answerText.setText(puzzle.answer); // Only the answer, no prefix
        answerText.setColor('#f39c12');
      });
    revealBtn.setAlpha(0.9);
    revealBtn.on('pointerover', () => revealBtn.setAlpha(1));
    revealBtn.on('pointerout', () => revealBtn.setAlpha(0.9));
    // Navigation buttons (bottom left and right)
    const navBtnY = this.sys.game.config.height - 60;
    // Back button (bottom left)
    const navBackBtn = this.add.text(30, navBtnY, '◀ Back', { fontSize: '20px', color: '#00fff7', backgroundColor: '#222', padding: { x: 16, y: 8 } })
      .setInteractive()
      .on('pointerdown', () => {
        if (this.currentPuzzle > 0) {
          this.currentPuzzle--;
          this.showPuzzle();
        }
      });
    navBackBtn.setAlpha(0.9);
    navBackBtn.on('pointerover', () => navBackBtn.setAlpha(1));
    navBackBtn.on('pointerout', () => navBackBtn.setAlpha(0.9));
    // Next button (bottom right)
    const navNextBtnX = this.sys.game.config.width - 170;
    const navNextBtn = this.add.text(navNextBtnX, navBtnY, 'Next ▶', { fontSize: '20px', color: '#00fff7', backgroundColor: '#222', padding: { x: 16, y: 8 } })
      .setInteractive()
      .on('pointerdown', () => {
        if (this.currentPuzzle < this.puzzleList.length - 1) {
          this.currentPuzzle++;
          this.showPuzzle();
        } else {
          this.currentPuzzle++;
          this.showPuzzle();
        }
      });
    navNextBtn.setAlpha(0.9);
    navNextBtn.on('pointerover', () => navNextBtn.setAlpha(1));
    navNextBtn.on('pointerout', () => navNextBtn.setAlpha(0.9));
    this.tweens.add({ targets: navNextBtn, alpha: 1, duration: 400, delay: 1000 });
    // Home button always present
    const homeBtn = this.add.text(this.sys.game.config.width - 120, 30, '🏠 Home', { fontSize: '22px', color: '#fff', backgroundColor: '#222', padding: { x: 10, y: 5 } })
      .setInteractive()
      .on('pointerdown', () => this.scene.start('Start'));
    homeBtn.setAlpha(0.85);
    homeBtn.on('pointerover', () => homeBtn.setAlpha(1));
    homeBtn.on('pointerout', () => homeBtn.setAlpha(0.85));
    // Position answer text below navigation buttons for all puzzle types
    if (answerText) {
      const answerY = this.sys.game.config.height - 20; // 20px from bottom
      answerText.setX(this.sys.game.config.width / 2);
      answerText.setY(answerY);
      answerText.setOrigin(0.5, 1);
      answerText.setColor('#f39c12');
      answerText.setDepth(10);
    }
  }
  checkAnswer(ans) {
    const puzzle = puzzles[this.level][this.currentPuzzle];
    let correct = false;
    if (puzzle.type === 'multiple-choice') {
      correct = ans === puzzle.answer;
    } else if (puzzle.type === 'fill-in-the-blank' || puzzle.type === 'riddle' || puzzle.type === 'word-image') {
      correct = ans.toString().toLowerCase().replace(/\s/g, '') === puzzle.answer.toString().toLowerCase().replace(/\s/g, '');
    } else if (puzzle.type === 'image-choice') {
      correct = ans === puzzle.answer;
    }
    const resultText = this.add.text(100, 350, correct ? 'Correct!' : 'Wrong!', { fontSize: '24px', color: correct ? '#0f0' : '#f00' });
    resultText.setScale(0);
    this.tweens.add({ targets: resultText, scale: 1, duration: 400, ease: 'Back.Out' });
    this.time.delayedCall(1200, () => {
      this.currentPuzzle++;
      this.scene.restart({ level: this.level });
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 500,
  backgroundColor: '#111',
  parent: 'game-root',
  scene: [StartScene, PuzzleScene],
};

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Phaser.Game(config);
});

// For multiplayer, you can extend this with player turn logic and online features.
// For now, use hot-seat: players take turns at the same device.
