import Phaser from 'phaser';
import { puzzles } from './questions.js';

class StartScene extends Phaser.Scene {
  constructor() {
    super('Start');
  }
  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#111');
    // Centered Play button only
    const playBtn = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Play', {
      fontSize: '36px',
      color: '#000000',
      backgroundColor: '#FFD700',
      padding: { x: 30, y: 15 }
    })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('Puzzle'));
    playBtn.setAlpha(0.95);
    playBtn.on('pointerover', () => playBtn.setAlpha(1));
    playBtn.on('pointerout', () => playBtn.setAlpha(0.95));
  }
}

class PuzzleScene extends Phaser.Scene {
  constructor() {
    super('Puzzle');
    this.currentPuzzle = 0;
    this.puzzleList = [];
    this.activeModal = null; // Track active modal
    this.modalOpen = false; // Track modal state
    this.activeImages = []; // Track all images for cleanup
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
    // Destroy any open modal before rendering new question
    if (this.activeModal && typeof this.activeModal.destroy === 'function') {
      this.activeModal.destroy();
      this.activeModal = null;
      this.modalOpen = false;
    }
    // Destroy all images from previous question
    if (this.activeImages && this.activeImages.length > 0) {
      this.activeImages.forEach(imgObj => {
        if (imgObj && typeof imgObj.destroy === 'function') imgObj.destroy();
      });
      this.activeImages = [];
    }
    this.cameras.main.setBackgroundColor('#111');
    this.children.removeAll();
    const puzzle = this.puzzleList[this.currentPuzzle];
    if (!puzzle) {
      this.scene.start('End');
      return;
    }
    const questionText = this.add.text(100, 100, puzzle.question, { fontSize: '22px', color: '#fff', wordWrap: { width: 800 }, fontFamily: 'Arial, sans-serif' });
    questionText.setAlpha(0);
    this.tweens.add({ targets: questionText, alpha: 1, duration: 600, delay: 200 });
    let lastY = 180;
    let answerText;
    let hintText;
    let inputBox;
    let revealed = false;
    if (puzzle.type === 'multiple-choice') {
      answerText = this.add.text(400, 420, '', { fontSize: '22px', color: '#27ae60', fontFamily: 'Arial, sans-serif' });
      hintText = this.add.text(400, 420, '', { fontSize: '22px', color: '#f39c12', fontFamily: 'Arial, sans-serif' });
      hintText.setVisible(false);
      puzzle.options.forEach((opt, i) => {
        const optText = this.add.text(130, lastY + i * 50, opt, {
          fontSize: '22px',
          color: '#000',
          backgroundColor: '#fff',
          padding: { x: 10, y: 5 },
        })
          .setInteractive()
          .on('pointerdown', () => {
            if (!revealed) this.checkAnswer(opt);
          });
        const border = this.add.graphics();
        border.lineStyle(2, 0x000000, 1);
        border.strokeRoundedRect(optText.x - 5, optText.y - 5, optText.width + 10, optText.height + 10, 10);
        optText.setData('option', opt);
        optText.setData('border', border);
        optText.setAlpha(0);
        this.tweens.add({ targets: [optText, border], alpha: 1, duration: 400, delay: 400 + i * 100 });
      });
      lastY += puzzle.options.length * 50;
    } else if (
      puzzle.type === 'fill-in-the-blank' ||
      puzzle.type === 'riddle' ||
      puzzle.type === 'word-image'
    ) {
      inputBox = this.add.dom(400, lastY + 30).createFromHTML('<input type="text" id="answerInput" style="font-size:20px;padding:5px;width:220px;">');
      answerText = this.add.text(400, 420, '', { fontSize: '22px', color: '#27ae60', fontFamily: 'Arial, sans-serif' });
      hintText = this.add.text(400, 420, '', { fontSize: '22px', color: '#f39c12', fontFamily: 'Arial, sans-serif' });
      hintText.setVisible(false);
      // Check Answer button
      const checkBtn = this.add.text(650, lastY + 20, 'Check', { fontSize: '20px', color: '#fff', backgroundColor: '#27ae60', padding: { x: 10, y: 5 } })
        .setInteractive()
        .on('pointerdown', () => {
          if (revealed) return;
          const userAnswer = inputBox.getChildByID('answerInput').value;
          this.checkAnswer(userAnswer);
        });
      checkBtn.setAlpha(0.9);
      checkBtn.on('pointerover', () => checkBtn.setAlpha(1));
      checkBtn.on('pointerout', () => checkBtn.setAlpha(0.9));
      lastY += 120;
    } else if (puzzle.type === 'image-choice') {
      answerText = this.add.text(this.sys.game.config.width / 2, 420, '', { fontSize: '22px', color: '#27ae60', fontFamily: 'Arial, sans-serif' }).setOrigin(0.5, 0.5);
      hintText = this.add.text(this.sys.game.config.width / 2, 420, '', { fontSize: '22px', color: '#f39c12', fontFamily: 'Arial, sans-serif' }).setOrigin(0.5, 0.5);
      hintText.setVisible(false);
      // Center images horizontally and auto-fit size (maximize size)
      const imgCount = puzzle.images.length;
      const maxTotalWidth = this.sys.game.config.width - 40; // 20px margin on each side
      const spacing = 32;
      let imgSize = 280;
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
          this.showImageModal(key);
        });
        this.activeImages.push(imgObj); // Track for cleanup
      });
      lastY += imgSize + 60;
    } else if (puzzle.type === 'direct-answer') {
      answerText = this.add.text(400, 420, '', { fontSize: '22px', color: '#27ae60', fontFamily: 'Arial, sans-serif' });
      hintText = this.add.text(400, 420, '', { fontSize: '22px', color: '#f39c12', fontFamily: 'Arial, sans-serif' });
      hintText.setVisible(false);
    }
    // Center answer text for all puzzle types and set color to orange
    if (answerText) {
      answerText.setX(this.sys.game.config.width / 2);
      answerText.setY(this.sys.game.config.height - 30);
      answerText.setOrigin(0.5, 1);
    }
    if (hintText) {
      hintText.setX(this.sys.game.config.width / 2);
      hintText.setY(this.sys.game.config.height - 30);
      hintText.setOrigin(0.5, 1);
    }
    // Reveal Answer button (top left)
    const revealBtnX = 30;
    const revealBtnY = 30;
    const revealBtn = this.add.text(revealBtnX, revealBtnY, 'Reveal Answer', { fontSize: '20px', color: '#fff', backgroundColor: '#27ae60', padding: { x: 16, y: 8 } })
      .setInteractive()
      .on('pointerdown', () => {
        revealed = true;
        if (puzzle.type === 'multiple-choice') {
          this.children.each(child => {
            if (child.getData('option') === puzzle.answer) {
              const border = child.getData('border');
              border.clear();
              border.lineStyle(4, 0x00ff00, 1);
              border.strokeRoundedRect(child.x - 5, child.y - 5, child.width + 10, child.height + 10, 10);
              if (puzzle.explanation) {
                const infoIcon = this.add.text(child.x + child.width + 25, child.y + 10, 'ℹ️', { fontSize: '24px' })
                    .setInteractive()
                    .on('pointerdown', () => {
                        this.showExplanation(puzzle.explanation);
                    });
              }
            }
          });
        } else {
          answerText.setText(puzzle.answer);
          answerText.setVisible(true);
          if(hintText) hintText.setVisible(false);
          if (puzzle.explanation) {
            const infoIcon = this.add.text(answerText.x + answerText.width/2 + 20, answerText.y, 'ℹ️', { fontSize: '24px' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.showExplanation(puzzle.explanation);
                });
            infoIcon.setOrigin(0, 0.5);
          }
        }
      });
    revealBtn.setAlpha(0.9);
    revealBtn.on('pointerover', () => revealBtn.setAlpha(1));
    revealBtn.on('pointerout', () => revealBtn.setAlpha(0.9));

    // Hint button
    const hintBtnX = revealBtnX + revealBtn.width + 20;
    const hintBtn = this.add.text(hintBtnX, revealBtnY, 'Hint', { fontSize: '20px', color: '#fff', backgroundColor: '#f39c12', padding: { x: 16, y: 8 } })
      .setInteractive()
      .on('pointerdown', () => {
        if (puzzle.hint) {
          if(answerText) answerText.setVisible(false);
          if(hintText) {
            hintText.setText(`${puzzle.hint}`);
            hintText.setVisible(true);
          }
        }
      });

    if (puzzle.hint) {
      hintBtn.setAlpha(0.9);
      hintBtn.on('pointerover', () => hintBtn.setAlpha(1));
      hintBtn.on('pointerout', () => hintBtn.setAlpha(0.9));
    } else {
      hintBtn.setAlpha(0.3);
      hintBtn.disableInteractive();
    }
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
    const navNextBtnX = this.sys.game.config.width - 130;
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
    const homeBtn = this.add.text(this.sys.game.config.width - 130, 30, '🏠 Home', { fontSize: '22px', color: '#fff', backgroundColor: '#222', padding: { x: 10, y: 5 } })
      .setInteractive()
      .on('pointerdown', () => this.scene.start('Start'));
    homeBtn.setAlpha(0.85);
    homeBtn.on('pointerover', () => homeBtn.setAlpha(1));
    homeBtn.on('pointerout', () => homeBtn.setAlpha(0.85));
  }
  checkAnswer(ans) {
    // const puzzle = this.puzzleList[this.currentPuzzle];
    // let correct = false;
    // if (puzzle.type === 'multiple-choice') {
    //   correct = ans === puzzle.answer;
    // } else if (puzzle.type === 'fill-in-the-blank' || puzzle.type === 'riddle' || puzzle.type === 'word-image') {
    //   correct = ans.toString().toLowerCase().replace(/\s/g, '') === puzzle.answer.toString().toLowerCase().replace(/\s/g, '');
    // } else if (puzzle.type === 'image-choice') {
    //   correct = ans === puzzle.answer;
    // } else if (puzzle.type === 'direct-answer') {
    //   correct = true;
    // }
    // const resultText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, correct ? 'Correct!' : 'Wrong!', { fontSize: '32px', color: correct ? '#0f0' : '#f00' }).setOrigin(0.5, 0.5);
    // resultText.setScale(0);
    // this.tweens.add({ targets: resultText, scale: 1, duration: 400, ease: 'Back.Out' });
    // this.time.delayedCall(1200, () => {
    //   this.currentPuzzle++;
    //   this.showPuzzle();
    // });
  }
  showExplanation(explanation) {
    const explanationBg = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
    explanationBg.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height);
    explanationBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height), Phaser.Geom.Rectangle.Contains);

    const explanationText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, explanation, {
        fontSize: '20px',
        color: '#000',
        backgroundColor: '#fff',
        wordWrap: { width: this.sys.game.config.width * 0.8 },
        padding: { x: 20, y: 20 }
    }).setOrigin(0.5);

    const closeBtn = this.add.text(explanationText.x + explanationText.width / 2 - 20, explanationText.y - explanationText.height / 2 + 20, 'X', {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#ff0000',
        padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerdown', () => {
        explanationBg.destroy();
        explanationText.destroy();
        closeBtn.destroy();
    });
  }

  showImageModal(imageKey) {
    if (this.modalOpen) return; // Prevent multiple modals
    this.modalOpen = true;
    const modalBg = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
    modalBg.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height);
    modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height), Phaser.Geom.Rectangle.Contains);

    const modalImage = this.add.image(this.sys.game.config.width / 2, this.sys.game.config.height / 2, imageKey);
    modalImage.setScale(Math.min(this.sys.game.config.width / modalImage.width, this.sys.game.config.height / modalImage.height) * 0.8);

    const closeBtn = this.add.text(this.sys.game.config.width - 20, 20, 'X', {
        fontSize: '32px',
        color: '#fff',
        backgroundColor: '#000',
        padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setInteractive();

    const closeModal = () => {
        modalBg.destroy();
        modalImage.destroy();
        closeBtn.destroy();
        this.activeModal = null;
        this.modalOpen = false;
    };

    closeBtn.on('pointerdown', closeModal);
    modalBg.on('pointerdown', closeModal);

    // Track modal for cleanup
    this.activeModal = {
      destroy: () => {
        modalBg.destroy();
        modalImage.destroy();
        closeBtn.destroy();
        this.modalOpen = false;
      }
    };
  }
}

class EndScene extends Phaser.Scene {
    constructor() {
        super('End');
    }

    preload() {
        this.load.image('the-end', 'The_End.jpg');
    }

    create() {
        const endImage = this.add.image(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'the-end');
        endImage.setScale(Math.min(this.sys.game.config.width / endImage.width, this.sys.game.config.height / endImage.height));

        const homeBtn = this.add.text(this.sys.game.config.width - 120, 30, '🏠 Home', { fontSize: '22px', color: '#fff', backgroundColor: '#222', padding: { x: 10, y: 5 } })
            .setInteractive()
            .on('pointerdown', () => this.scene.start('Start'));
        homeBtn.setAlpha(0.85);
        homeBtn.on('pointerover', () => homeBtn.setAlpha(1));
        homeBtn.on('pointerout', () => homeBtn.setAlpha(0.85));
    }
}

const config = {
  type: Phaser.AUTO,
  width: 920,
  height: 530,
  backgroundColor: 'transparent',
  parent: 'game-root',
  dom: {
    createContainer: true
  },
  scene: [StartScene, PuzzleScene, EndScene],
};

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Phaser.Game(config);
});