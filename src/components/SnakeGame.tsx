import { useState, useEffect, useCallback } from "react";

interface SnakeGameProps {
  onExit: () => void;
  highScore: number;
  onHighScore: (score: number) => void;
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const GRID_WIDTH = 30;
const GRID_HEIGHT = 15;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;
const SPEED_DECREASE_PER_FOOD = 5;

const SnakeGame = ({ onExit, highScore, onHighScore }: SnakeGameProps) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 15, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 20, y: 7 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      };
    } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = useCallback(() => {
    setSnake([{ x: 15, y: 7 }]);
    setFood({ x: 20, y: 7 });
    setDirection("RIGHT");
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "q" || e.key === "Q") {
        onExit();
        return;
      }

      if (gameOver) {
        if (e.key === "r" || e.key === "R") {
          resetGame();
        }
        return;
      }

      if (e.key === "p" || e.key === "P") {
        setIsPaused((prev) => !prev);
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (direction !== "DOWN") setDirection("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (direction !== "UP") setDirection("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (direction !== "RIGHT") setDirection("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (direction !== "LEFT") setDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, gameOver, onExit, resetGame]);

  // Calculate current speed based on score
  const currentSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(score / 10) * SPEED_DECREASE_PER_FOOD);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        let newHead: Position;

        switch (direction) {
          case "UP":
            newHead = { x: head.x, y: head.y - 1 };
            break;
          case "DOWN":
            newHead = { x: head.x, y: head.y + 1 };
            break;
          case "LEFT":
            newHead = { x: head.x - 1, y: head.y };
            break;
          case "RIGHT":
            newHead = { x: head.x + 1, y: head.y };
            break;
        }

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_WIDTH ||
          newHead.y < 0 ||
          newHead.y >= GRID_HEIGHT
        ) {
          const finalScore = prevSnake.length * 10 - 10;
          setTimeout(() => {
            setGameOver(true);
            if (finalScore > highScore) {
              onHighScore(finalScore);
            }
          }, 0);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          const finalScore = prevSnake.length * 10 - 10;
          setTimeout(() => {
            setGameOver(true);
            if (finalScore > highScore) {
              onHighScore(finalScore);
            }
          }, 0);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setTimeout(() => {
            setScore((prev) => prev + 10);
            setFood(generateFood());
          }, 0);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, currentSpeed);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, isPaused, generateFood, currentSpeed, highScore, onHighScore]);

  const renderGrid = () => {
    const grid: string[][] = [];

    // Initialize empty grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid[y][x] = " ";
      }
    }

    // Place food
    grid[food.y][food.x] = "●";

    // Place snake
    snake.forEach((segment, index) => {
      if (segment.y >= 0 && segment.y < GRID_HEIGHT && segment.x >= 0 && segment.x < GRID_WIDTH) {
        grid[segment.y][segment.x] = index === 0 ? "█" : "▓";
      }
    });

    return grid;
  };

  const grid = renderGrid();
  const border = "+" + "-".repeat(GRID_WIDTH) + "+";

  return (
    <div className="text-terminal-green font-mono">
      <div className="mb-2 flex justify-between">
        <span>SNAKE</span>
        <span>Score: {score} | High: {highScore}</span>
      </div>
      
      <div className="text-terminal-green-dim text-xs mb-2">
        [arrows/wasd] move | [p] pause | [q/esc] quit
      </div>

      <div className="leading-none">
        <div className="text-terminal-green-dim">{border}</div>
        {grid.map((row, y) => (
          <div key={y} className="whitespace-pre">
            <span className="text-terminal-green-dim">|</span>
            {row.map((cell, x) => (
              <span
                key={x}
                className={
                  cell === "●"
                    ? "text-terminal-green-bright"
                    : cell === "█" || cell === "▓"
                    ? "text-terminal-green"
                    : ""
                }
              >
                {cell}
              </span>
            ))}
            <span className="text-terminal-green-dim">|</span>
          </div>
        ))}
        <div className="text-terminal-green-dim">{border}</div>
      </div>

      {isPaused && (
        <div className="mt-2 text-terminal-green-bright">
          PAUSED - Press [p] to continue
        </div>
      )}

      {gameOver && (
        <div className="mt-2">
          <p className="text-terminal-green-bright">GAME OVER!</p>
          <p className="text-terminal-green-dim text-sm mt-1">
            [r] restart | [q/esc] quit
          </p>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
