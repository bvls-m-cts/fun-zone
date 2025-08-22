# Fun Zone

A web-based application that features a collection of interactive games, including a Puzzle Quiz, Spin the Wheel, and Truth or Dare.

## Features

*   **Puzzle Quiz**: A game with various types of puzzles, including multiple-choice, fill-in-the-blank, and image-based questions.
*   **Spin the Wheel**: A classic spinning wheel game where you can win points. It includes a leaderboard and points history.
*   **Truth or Dare**: A fun party game with a set of truth questions and dare challenges.

## Technologies Used

*   [Vite](https://vitejs.dev/): A fast build tool for modern web projects.
*   [Phaser](https://phaser.io/): A 2D game framework for making HTML5 games for desktop and mobile.
*   [Node.js](https://nodejs.org/): Used for the backend server to handle scores.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

*   [Node.js](https://nodejs.org/) (v14.0 or higher recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/bvls-m-cts/fun-zone.git
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd fun-zone
    ```

3.  **Install the dependencies:**

    ```bash
    npm install
    ```

### Running the Application

The application consists of a frontend (the game) and a backend (for scoring). You need to run both for the application to be fully functional.

1.  **Start the backend server:**

    Open a terminal and run the following command to start the Node.js server:

    ```bash
    node server.cjs
    ```

    The server will start on `http://localhost:3001`.

2.  **Start the frontend development server:**

    Open another terminal and run the following command to start the Vite development server:

    ```bash
    npm run dev
    ```

    The application will be available at the URL provided by Vite (usually `http://localhost:5173`).

## How to Play

*   Open the application in your browser.
*   You will see the main menu with options for "Puzzle Game", "Spin the Wheel", and "Truth or Dare".
*   Click on the game you want to play and follow the on-screen instructions.