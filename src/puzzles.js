// Puzzle data for all levels
export const puzzles = {
  all: [
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle1.jpg'
    ],
      answer: 'One in a million'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle2.jpg'
        ],
      answer: 'Scrambled eggs'
    }
    ,
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle3.jpg'
      ],
      answer: 'Happy hour'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle4.jpg'
      ],
      answer: 'Eiffel Tower'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle5.jpg'
      ],
      answer: 'you are in trouble'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle6.jpg'
      ],
      answer: 'Travel overseas'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle7.jpg'
      ],
      answer: 'Forgive and forget'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle8.jpg'
      ],
      answer: 'Summer'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle9.jpg'
      ],
      answer: 'Trail mix'
    },
    {
      type: 'image-choice',
      question: 'Guess the Word...',
      images: [
        'public/puzzle10.jpg'
      ],
      answer: 'Try to understand'
    }
    // ,{
    //   type: 'multiple-choice',
    //   question: 'What is the next number in the sequence: 2, 4, 8, 16, ?',
    //   options: ['18', '20', '32', '24'],
    //   answer: '32'
    // }
  ],

  // THEMES SUPPORT: To add more themes, just add a new key to the puzzles object in puzzles.js, e.g.:
  // mytheme: [ { type: 'multiple-choice', question: '...', ... }, ... ]
  // Each theme (key) can have any number of questions, and each question can be of any supported type.
  // To make a theme appear in the UI, it is automatically listed from the puzzles object keys.
  // Supported types: 'multiple-choice', 'fill-in-the-blank', 'riddle', 'image-choice', 'word-image'.
  // For image-based puzzles, add your images to the public/ folder and reference them by relative path.
  // Example:
  // export const puzzles = {
  //   numbers: [ ... ],
  //   riddles: [ ... ],
  //   mytheme: [
  //     { type: 'multiple-choice', question: '...', options: [...], answer: '...' },
  //     { type: 'fill-in-the-blank', question: '...', answer: '...' },
  //     { type: 'image-choice', question: '...', images: [...], answer: 0 },
  //     { type: 'word-image', question: '...', images: [...], answer: '...' }
  //   ]
  // }
};
