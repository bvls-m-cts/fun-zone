import Phaser from 'phaser';
import { puzzles } from './questions.js';

class StartScene extends Phaser.Scene {
  constructor() {
    super('Start');
  }
  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#111');
    // Play button as a triangle (play icon) with text inside
    const centerX = this.sys.game.config.width / 2;
    const centerY = this.sys.game.config.height / 2;
    const triangleSize = 45;
    const playBtnShape = this.add.graphics();
    playBtnShape.fillStyle(0xFFD700, 1);
    playBtnShape.lineStyle(4, 0x000, 1);
    playBtnShape.beginPath();
    playBtnShape.moveTo(centerX - triangleSize, centerY - triangleSize);
    playBtnShape.lineTo(centerX - triangleSize, centerY + triangleSize);
    playBtnShape.lineTo(centerX + triangleSize, centerY);
    playBtnShape.closePath();
    playBtnShape.fillPath();
    playBtnShape.strokePath();
    playBtnShape.setInteractive(new Phaser.Geom.Triangle(centerX - triangleSize, centerY - triangleSize, centerX - triangleSize, centerY + triangleSize, centerX + triangleSize, centerY), Phaser.Geom.Triangle.Contains);
    playBtnShape.setDepth(2);

    // Play text inside triangle
    const playBtnText = this.add.text(centerX, centerY, 'Play', {
      fontSize: '22px',
      color: '#000',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      // fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 2
    }).setOrigin(0.85, 0.5).setDepth(3);

    // Make both triangle and text interactive
    playBtnText.setInteractive();
    const startGame = () => this.scene.start('Puzzle');
    playBtnShape.on('pointerdown', startGame);
    playBtnText.on('pointerdown', startGame);
    playBtnShape.on('pointerover', () => {
      playBtnShape.setAlpha(0.85);
      playBtnText.setAlpha(1);
    });
    playBtnShape.on('pointerout', () => {
      playBtnShape.setAlpha(1);
      playBtnText.setAlpha(1);
    });
    playBtnText.on('pointerover', () => {
      playBtnShape.setAlpha(0.85);
      playBtnText.setAlpha(1);
    });
    playBtnText.on('pointerout', () => {
      playBtnShape.setAlpha(1);
      playBtnText.setAlpha(1);
    });
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
      const imgCount = puzzle.images.length;
      const maxTotalWidth = this.sys.game.config.width - 40; // 20px margin on each side
      const spacing = 32;
      const maxImgSize = 400;
      let imgSizes = [];
      let loadedCount = 0;
      let naturalSizes = [];
      puzzle.images.forEach((img, i) => {
        const image = new window.Image();
        image.src = img.startsWith('public/') ? img.replace(/^public\//, '') : img;
        image.onload = () => {
          naturalSizes[i] = { w: image.naturalWidth, h: image.naturalHeight };
          loadedCount++;
          if (loadedCount === imgCount) {
            let displaySizes = [];
            if (imgCount === 1) {
              // Single image: use natural size, scale down if needed
              let w = naturalSizes[0].w;
              let h = naturalSizes[0].h;
              if (w > maxImgSize || h > maxImgSize) {
                const scale = Math.min(maxImgSize / w, maxImgSize / h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
              }
              displaySizes = [{ w, h }];
              const x = this.sys.game.config.width / 2;
              const y = lastY + h / 2;
              const key = puzzle.images[0].startsWith('http') ? puzzle.images[0] : puzzle.images[0].replace(/^public\//, '');
              const imgObj = this.add.image(x, y, key)
                .setDisplaySize(w, h)
                .setInteractive();
              imgObj.setAlpha(0);
              this.tweens.add({ targets: imgObj, alpha: 1, duration: 500, delay: 400 });
              imgObj.on('pointerdown', () => {
                this.showImageModal(key);
              });
              this.activeImages.push(imgObj);
              lastY += h + 60;
            } else {
              // Multiple images: scale all to same size so all fit in screen
              // Find the smallest aspect ratio among images
              let minAspect = Math.min(...naturalSizes.map(sz => sz.w / sz.h));
              let maxAspect = Math.max(...naturalSizes.map(sz => sz.w / sz.h));
              // Calculate max width per image
              let availableWidth = maxTotalWidth - (imgCount - 1) * spacing;
              let imgW = Math.floor(availableWidth / imgCount);
              imgW = Math.min(imgW, maxImgSize);
              // Calculate height for each image based on aspect ratio
              let imgH = Math.min(...naturalSizes.map(sz => Math.round(imgW / (sz.w / sz.h))));
              displaySizes = naturalSizes.map(sz => {
                const scale = Math.min(imgW / sz.w, imgH / sz.h);
                return { w: Math.round(sz.w * scale), h: Math.round(sz.h * scale) };
              });
              // Use the smallest height for all images
              imgH = Math.min(...displaySizes.map(sz => sz.h));
              displaySizes = displaySizes.map(sz => ({ w: imgW, h: imgH }));
              const totalWidth = imgCount * imgW + (imgCount - 1) * spacing;
              let startX = (this.sys.game.config.width - totalWidth) / 2;
              puzzle.images.forEach((img, j) => {
                const key = img.startsWith('http') ? img : img.replace(/^public\//, '');
                const x = startX + j * (imgW + spacing) + imgW / 2;
                const y = lastY + imgH / 2;
                const imgObj = this.add.image(x, y, key)
                  .setDisplaySize(imgW, imgH)
                  .setInteractive();
                imgObj.setAlpha(0);
                this.tweens.add({ targets: imgObj, alpha: 1, duration: 500, delay: 400 + j * 120 });
                imgObj.on('pointerdown', () => {
                  this.showImageModal(key);
                });
                this.activeImages.push(imgObj);
              });
              lastY += imgH + 60;
            }
          }
        };
      });
    } else if (puzzle.type === 'direct-answer') {
      answerText = this.add.text(400, 420, '', { fontSize: '22px', color: '#27ae60', fontFamily: 'Arial, sans-serif' });
      hintText = this.add.text(400, 420, '', { fontSize: '22px', color: '#f39c12', fontFamily: 'Arial, sans-serif' });
      hintText.setVisible(false);
      // Show image in main puzzle area if present
      // (REMOVED: do not show image immediately for direct-answer)
      // if (puzzle.images && puzzle.images.length > 0) {
      //   const imgSrc = puzzle.images[0];
      //   const key = imgSrc.startsWith('http') ? imgSrc : imgSrc.replace(/^public\//, '');
      //   const image = new window.Image();
      //   image.src = key;
      //   image.onload = () => {
      //     let w = image.naturalWidth;
      //     let h = image.naturalHeight;
      //     const maxImgSize = 400;
      //     if (w > maxImgSize || h > maxImgSize) {
      //       const scale = Math.min(maxImgSize / w, maxImgSize / h);
      //       w = Math.round(w * scale);
      //       h = Math.round(h * scale);
      //     }
      //     const x = this.sys.game.config.width / 2;
      //     const y = lastY + h / 2;
      //     const imgObj = this.add.image(x, y, key)
      //       .setDisplaySize(w, h)
      //       .setAlpha(0);
      //     this.tweens.add({ targets: imgObj, alpha: 1, duration: 500, delay: 200 });
      //     imgObj.setInteractive();
      //     imgObj.on('pointerdown', () => {
      //       this.showImageModal(key);
      //     });
      //     this.activeImages.push(imgObj);
      //     lastY += h + 60;
      //   };
      // }
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
          // Show image if present for direct-answer
          if (puzzle.type === 'direct-answer' && puzzle.images && puzzle.images.length > 0) {
            // Only show first image for direct-answer
            const imgSrc = puzzle.images[0];
            const key = imgSrc.startsWith('http') ? imgSrc : imgSrc.replace(/^public\//, '');
            // Load image to get natural size
            const image = new window.Image();
            image.src = key;
            image.onload = () => {
              let w = image.naturalWidth;
              let h = image.naturalHeight;
              const maxImgSize = 400;
              if (w > maxImgSize || h > maxImgSize) {
                const scale = Math.min(maxImgSize / w, maxImgSize / h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
              }
              const x = this.sys.game.config.width / 2;
              const y = answerText.y + answerText.height + h / 2 + 20;
              const imgObj = this.add.image(x, y, key)
                .setDisplaySize(w, h)
                .setAlpha(0);
              this.tweens.add({ targets: imgObj, alpha: 1, duration: 500, delay: 200 });
              imgObj.setInteractive();
              imgObj.on('pointerdown', () => {
                this.showImageModal(key);
              });
              this.activeImages.push(imgObj);
            };
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
    // Dimmed background, closes popup on click
    const explanationBg = this.add.graphics();
    explanationBg.fillStyle(0x000000, 0.7);
    explanationBg.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height);
    explanationBg.setDepth(10);
    explanationBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height), Phaser.Geom.Rectangle.Contains);

    // Popup box
    const boxWidth = this.sys.game.config.width * 0.7;
    const boxHeight = this.sys.game.config.height * 0.35;
    const boxX = (this.sys.game.config.width - boxWidth) / 2;
    const boxY = (this.sys.game.config.height - boxHeight) / 2;
    const popupBox = this.add.graphics();
    popupBox.fillStyle(0xffffff, 1);
    popupBox.lineStyle(3, 0x27ae60, 1);
    popupBox.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 24);
    popupBox.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 24);
    popupBox.setDepth(11);

    // Explanation text
    const explanationText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, explanation, {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '22px',
      color: '#222',
      wordWrap: { width: boxWidth - 40 },
      align: 'center',
      padding: { x: 20, y: 20 }
    }).setOrigin(0.5);
    explanationText.setDepth(12);

    // Close button (top right of popup)
    const closeBtn = this.add.text(boxX + boxWidth - 24, boxY + 24, '✖', {
      fontSize: '28px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#fff',
      backgroundColor: '#e74c3c',
      padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setInteractive();
    closeBtn.setDepth(13);

    // Close on background click or button click
    const destroyPopup = () => {
      explanationBg.destroy();
      popupBox.destroy();
      explanationText.destroy();
      closeBtn.destroy();
    };
    explanationBg.on('pointerdown', destroyPopup);
    closeBtn.on('pointerdown', destroyPopup);
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
        endImage.setAlpha(0); // Start invisible
        this.tweens.add({
            targets: endImage,
            alpha: 1,
            duration: 1200,
            ease: 'Power2'
        });

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