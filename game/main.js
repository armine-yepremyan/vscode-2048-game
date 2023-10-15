const defaultTraversalX = [0, 1, 2, 3];
const defaultTraversalY = [0, 1, 2, 3];
let head = document.getElementById("head");
let scoreBar = document.getElementById("scoreBar");
let scoreItem = document.getElementById("score");
let bestScoreBar = document.getElementById("bestScoreBar");
let bestScoreItem = document.getElementById("bestScore");
let container = document.getElementById("container");
let currentGame = null;
let mask = document.querySelectorAll(".mask, .gameover, #again");
let board = document.getElementById("board");
let restartBtn = document.getElementById("restart");
let againBtn = document.getElementById("again");

document.addEventListener("DOMContentLoaded", () => {
  currentGame = new Game();
  currentGame.init();
})

const newGame = () => {
  currentGame.clear();
  currentGame = null;
  currentGame = new Game();
  currentGame.init();
}


class Game {
  static dir = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1]
  ];
  constructor() {
    this.board = document.getElementById("board");
    this.item = document.querySelectorAll(".item");
    this.tile = new Array(4);
    this.score = 0;
    this.bestResult = localStorage.getItem("bestResult") || 0;
    this.setBestResult()
  }

  static getScore() {
    return this.score
  }

  setBestResult() {
    bestScoreItem.innerHTML = this.bestResult;
    let item = document.createElement("div");
    item.className = "bestScoreAdd";
    item.innerHTML = `${this.bestResult}`;
    item.style.top = 60 + "px";
    item.style.right = 130 + "px";
    container.append(item);

    setTimeout(() => {
      item.style.top = -100 + "px";
      item.style.opacity = 0;
    }, 0);

    setTimeout(() => {
      item.remove()
    }, 2000);
  }

  updateBestResult() {
    if (this.score > this.bestResult) {
      localStorage.setItem("bestResult", this.score)
    }
    return this.score > this.bestResult
  }

  resetGameHistory() {
    localStorage.removeItem("bestResult")
    this.bestResult = 0
    this.setBestResult()
  }

  clear = () => {
    location.reload();
  }

  init() {
    let promise = new Promise(resolve => {
      for (let i = 0; i < 4; ++i) {
        this.tile[i] = new Array(4).fill(0);
      }
      resolve()
    });
    promise
      .then(this.createNewTile(2))
      .then(() => document.addEventListener("keydown", onKeyDown));
  }

  createNewTile(num = 1) {
    for (let i = 0; i < num; ++i) {
      let rand = Math.floor(Math.random() * 16);
      let x = Math.floor(rand / 4);
      let y = rand % 4;

      while (this.tile[x][y]) {
        rand = Math.floor(Math.random() * 16);
        x = Math.floor(rand / 4);
        y = rand % 4;
      }

      let value = (Math.floor(Math.random() * 2) + 1) * 2;
      this.tile[x][y] = value;
      this.addTile({ x, y, val: value}, 250, false, true);
    }
  }

  addTile(tile, delay, merged, created = false) {
    let { x, y, val } = tile;
    let coordinate = getCoordinate(this.item[x * 4 + y]);
    let newTile = null;

    if (merged || created) {
      newTile = document.createElement("div");
      let className = merged ? "mergeTile" : "newTile";
      newTile.classList.add(className);
      newTile.classList.add("item");
      newTile.dataset.value = val;
      newTile.innerHTML = val;
      newTile.style.left = coordinate.left + "px";
      newTile.style.top = coordinate.top + "px";
      container.append(newTile);
      
      newTile.getBoundingClientRect();
      newTile.style.transform = "scale(1)";
      newTile.style.visibility = "hidden";
    }
    setTimeout(() => {
      this.item[x * 4 + y].innerHTML = val;
      this.item[x * 4 + y].dataset.value = val;
    }, delay)

  }

  findFinalPosition(n, current) {
    let res = current;
    while (current.x >= 0 && current.x <= 3 && current.y >= 0 && current.y <= 3) {
      res = current;
      current = { x: current.x + Game.dir[n][0], y: current.y + Game.dir[n][1] };

      if (
        current.x > 3 ||
        current.x < 0 ||
        current.y > 3 ||
        current.y < 0 ||
        this.tile[current.x][current.y]
      ) {
        break;
      }
    }
    return {
      x: res.x,
      y: res.y,
      next: { x: current.x, y: current.y }
    }
  }

  move(oldTile, newTile) {
    let oldIndex = oldTile.x * 4 + oldTile.y;
    let newIndex = newTile.x * 4 + newTile.y;
    let merged = oldTile.val != newTile.val;

    let oldCoordinate = getCoordinate(this.item[oldIndex]);

    let moveTile = document.createElement("div");
    moveTile.classList.add("moveTile", "item");
    moveTile.dataset.value = oldTile.val;
    moveTile.innerHTML = oldTile.val;
    moveTile.style.left = oldCoordinate.left + "px";
    moveTile.style.top = oldCoordinate.top + "px";

    container.append(moveTile);
    this.item[oldIndex].innerHTML = "";
    this.item[oldIndex].dataset.value = 0;

    this.addTile(newTile, 100, merged);
    let newCoordinate = getCoordinate(this.item[newIndex]);
    moveTile.style.left = newCoordinate.left + "px";
    moveTile.style.top = newCoordinate.top + "px";
    moveTile.style.visibility = "hidden";

  }

  updateScore(score) {
    this.score += score;
    scoreItem.innerHTML = this.score;
    let item = document.createElement("div");
    item.className = "scoreAdd";
    item.innerHTML = `${score}`;
    item.style.top = 60 + "px";
    item.style.right = 130 + "px";
    container.append(item);

    setTimeout(() => {
      item.style.top = -100 + "px";
      item.style.opacity = 0;
    }, 0);

    setTimeout(() => {
      item.remove()
    }, 2000);
  }

  async moveTile(n, traversal) {
    let changed = false;
    let score = 0;
    if (Game.dir[n][0] == 1) traversal.x = traversal.x.reverse();
    if (Game.dir[n][1] == 1) traversal.y = traversal.y.reverse();

    let lastChangedItem = null;

    traversal.x.forEach((i) => {
      traversal.y.forEach((j) => {
        let val = this.tile[i][j];

        if (val != 0) {
          let current = { x: i, y: j, val: val };
          let finalPosition = this.findFinalPosition(n, current);
          let next = finalPosition.next;
          let newTile;

          if (
            next.x >= 0 &&
            next.x < 4 &&
            next.y >= 0 &&
            next.y < 4 &&
            val == this.tile[next.x][next.y] &&
            (!lastChangedItem ||
              next.y != lastChangedItem.x ||
              next.y != lastChangedItem.y)
          ) {
            score += val * 2;
            newTile = { x: next.x, y: next.y, val: val * 2 };
            lastChangedItem = { x: next.x, y: next.y };
          } else {
            newTile = { x: finalPosition.x, y: finalPosition.y, val: val };
          }

          if (!changed && (newTile.x != i || newTile.y != j)) {
            changed = true;
          }

          if (newTile.x == i && newTile.y == j) return;
          this.tile[i][j] = 0;
          this.tile[newTile.x][newTile.y] = newTile.val;

          this.move(current, newTile);
        }
      });
    });
    if (score) this.updateScore(score);
    return changed;
  }

  isNoEmptySpace() {
    for (let row of this.tile) {
      for (let i of row) {
        if (i == 0) {
          return false
        }
      }
    }
    return true
  }

  canMove() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (
          (j < 3 && this.tile[i][j] == this.tile[i][j+1]) ||
          (i < 3 && this.tile[i][j] == this.tile[i + 1][j])
        ) {
          return true;
        }
      }
    }
    return false
  }

  endGame() {
    document.removeEventListener("keydown", onKeyDown);
    mask.forEach((i) => {
      i.hidden = false;
    })
  }

  
}

const getCoordinate = (item) => {
  let containerCoordinate = container.getBoundingClientRect();
  let coordinate = item.getBoundingClientRect();

  return {
    left: coordinate.left - containerCoordinate.left,
    top: coordinate.top - containerCoordinate.top
  }
}

const clearAnimatedItem = () => {
  let temp = document.querySelectorAll(".newTile, .mergeTile, .moveTile");
  temp.forEach(t => t.remove());

}

window.addEventListener('message', async (event) => {

  const message = event.data;
  switch(message.type) {
    case "restart":
      if (currentGame.updateBestResult()) {
        currentGame.setBestResult()
      }
      break;
    case "reset":
      currentGame.resetGameHistory()
      break;

  }
})

const onKeyDown = (event) => {
  let dir = 0;
  event.preventDefault();
  console.log("event.key ", event.key)
  switch(event.key) {
    case "w":
    case "ArrowUp":
      dir = 0;
      break;
    case "d":
    case "ArrowRight":
      dir = 1;
      break;
    case "s":
    case "ArrowDown":
      dir = 2;  
      break;
    case "a":
    case "ArrowLeft":
      dir = 3;
      break;
    default:
      return;
  }
  let traversal = {
    x: [...defaultTraversalX],
    y: [...defaultTraversalY]
  };
  clearAnimatedItem();

  let promise = currentGame.moveTile(dir, traversal);

  promise.then(moved => {
    if (moved && !currentGame.isNoEmptySpace()) {
      currentGame.createNewTile();
    }
    if (currentGame.isNoEmptySpace() && !currentGame.canMove()) {
      if (currentGame.updateBestResult()) {
        currentGame.setBestResult()
      }
      currentGame.endGame();
    }
  })
}