const canvas = document.querySelector("#canvas");
const canvasWrapper = document.querySelector("#canvasWrapper");

setCanvasWH();

const ctx = canvas.getContext("2d");

const scoreBlock = document.querySelector("#score");
const startText = document.querySelector(".start-text");
const wrapperEnd = document.querySelector(".end-screen__wrapper");
const blockEnd = document.querySelector(".end-screen__block");
const endScore = document.querySelector(".end-screen__score");
const endBtn = document.querySelector(".end-screen__btn");

document.addEventListener("click", clickHandler);

let game = {
  requestId: null,
  started: false,
  stop: false,
  goUp: false,
  score: 0,
  time: {
    start: performance.now(),
    elapsed: 0,
    refreshRate: 16,
  },
};

let player = {
  width: 30,
  height: 30,
  dx: 3,
  dy: 3,
  jump: false,
  fall: false,
  jumpRow: 0,
  stickLeft: false,
  stickRight: false,
  stickTop: false,
  stickBottom: false,
  paddleStickedTo: null,
};

let images = {
  background: new Image(),
  brick: new Image(),
  playerFrontSide: new Image(),
  playerFrontFall: new Image(),
  playerLeftJump: new Image(),
  playerRightJump: new Image(),
  playerLeftStick: new Image(),
  playerRightStick: new Image(),
};

images.background.src = "./img/background.png";
images.brick.src = "./img/brick.jpg";
images.playerFrontSide.src = "./img/front-side.png";
images.playerFrontFall.src = "./img/front-fall.png";
images.playerLeftJump.src = "./img/jump-left.png";
images.playerRightJump.src = "./img/jump-right.png";
images.playerLeftStick.src = "./img/stick-left.png";
images.playerRightStick.src = "./img/stick-right.png";

let platesArr = [];
let bricksArr = [];

class Plate {
  constructor(x, y, direction, isMain) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 100;
    this.direction = direction;
    this.isMain = isMain;
  }

  draw() {
    ctx.fillStyle = "#1D1D1D";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Brick {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dy = 0;
    this.width = 20;
    this.height = 10;
  }
  draw() {
    ctx.drawImage(images.brick, this.x, this.y, this.width, this.height);
  }
}

function play() {
  cancelAnimationFrame(game.requestId);
  resetGamePlayerOpt();
  resetPlayer();
  resetPlates();
  animate();
}

function animate(now = 0) {
  game.time.elapsed = now - game.time.start;
  if (game.time.elapsed > game.time.refreshRate) {
    game.time.start = now;
    draw();
    if (game.started) {
      detectCollision();
      update();
    }
  }
  if (game.stop) {
    wrapperEnd.style.display = "block";
    blockEnd.style.display = "block";
    endScore.textContent = `Your score: ${game.score.toFixed()}`;

    endBtn.addEventListener("click", (event) => {
      event.preventDefault();
      wrapperEnd.style.display = "none";
      blockEnd.style.display = "none";
      setTimeout(() => {
        play();
      }, 50);
    });

    window.cancelAnimationFrame(game.requestId);
    game.requestId = null;
    return;
  }

  game.requestId = requestAnimationFrame(animate);
}

function resetGamePlayerOpt() {
  game = {
    requestId: null,
    started: false,
    stop: false,
    goUp: false,
    score: 0,
    time: {
      start: performance.now(),
      elapsed: 0,
      refreshRate: 16,
    },
  };

  player = {
    width: 24,
    height: 24,
    dx: 3,
    dy: 3,
    jump: false,
    fall: false,
    jumpRow: 0,
    stickLeft: false,
    stickRight: false,
    stickTop: false,
    stickBottom: false,
    paddleStickedTo: null,
  };

  platesArr = [];
  bricksArr = [];
}

function resetPlayer() {
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height / 2;
}

function resetPlates() {
  platesArr = [];
  generatePlates(10);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawPlayer();
  drawPlates();
  drawBricks();
}

function drawBackground() {
  ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  if (player.jump) {
    if (player.dx > 0) {
      ctx.drawImage(
        images.playerRightJump,
        player.x,
        player.y,
        player.width,
        player.height
      );
    } else {
      ctx.drawImage(
        images.playerLeftJump,
        player.x,
        player.y,
        player.width,
        player.height
      );
    }
  } else if (player.stickLeft) {
    ctx.drawImage(
      images.playerRightStick,
      player.x,
      player.y,
      player.width,
      player.height
    );
  } else if (player.stickRight) {
    ctx.drawImage(
      images.playerLeftStick,
      player.x,
      player.y,
      player.width,
      player.height
    );
  } else if (player.fall) {
    ctx.drawImage(
      images.playerFrontFall,
      player.x,
      player.y,
      player.width,
      player.height
    );
  } else {
    ctx.drawImage(
      images.playerFrontSide,
      player.x,
      player.y,
      player.width,
      player.height
    );
  }
}

function drawPlates() {
  platesArr.forEach((plate) => plate.draw());
}

function drawBricks() {
  if (bricksArr.length > 0) bricksArr.forEach((brick) => brick.draw());
}

function detectCollision() {
  const hitsTop = () => player.y < 0;
  const hitsBottom = () => player.y + player.height > canvas.height;
  const hitsLeftWall = () => player.x < 0;
  const hitsRightWall = () => player.x + player.width > canvas.width;

  if (hitsTop() || hitsBottom() || hitsLeftWall() || hitsRightWall()) {
    game.stop = true;
  }
  detectPlateCollision();
  detectBrickCollision();
}

function detectPlateCollision() {
  const playerInsidePlate = (plate) =>
    player.x + player.width > plate.x &&
    player.x < plate.x + plate.width &&
    player.y + player.height > plate.y &&
    player.y < plate.y + plate.height;

  let collisionDetected = false;

  platesArr.forEach((plate) => {
    if (playerInsidePlate(plate) && collisionDetected == false) {
      player.jump = false;
      player.fall = false;
      player.jumpRow = 0;
      player.paddleStickedTo = plate;
      collisionDetected = true;
      detectCollisionDirection(plate);
    } else if (!collisionDetected) {
      player.stickLeft = false;
      player.stickRight = false;
      player.stickTop = false;
      player.stickBottom = false;
      if (player.y < canvas.height / 2 - 100 && player.jump) {
        game.goUp = true;
      } else {
        game.goUp = false;
      }
    }
  });
}

function detectBrickCollision() {
  const brickInsidePlayer = (brick) =>
    player.x + player.width > brick.x &&
    player.x < brick.x + brick.width &&
    player.y + player.height > brick.y &&
    player.y < brick.y + brick.height;

  bricksArr.forEach((brick) => {
    if (brickInsidePlayer(brick)) {
      game.stop = true;
    }
  });
}

function detectCollisionDirection(plate) {
  const hitPlateLeftSide = () => player.x + player.width - player.dx <= plate.x;
  const hitPlateRightSide = () => player.x - player.dx >= plate.x + plate.width;
  const hitPlateToptSide = () => player.y + player.height - 4 <= plate.y;
  const hitPlateBottomSide = () => player.y + 4 >= plate.y + plate.height;

  if (hitPlateLeftSide()) {
    player.stickLeft = true;
  } else if (hitPlateRightSide()) {
    player.stickRight = true;
  } else if (hitPlateToptSide()) {
    player.stickTop = true;
  } else if (hitPlateBottomSide()) {
    player.stickBottom = true;
  }
}

function update() {
  if (player.jump) {
    jump();
  } else if (player.stickLeft || player.stickRight || player.stickBottom) {
    player.dy = 1;
    player.y += player.dy;
  } else if (
    !player.jump &&
    !player.stickLeft &&
    !player.stickRight &&
    !player.stickBottom &&
    !player.stickTop
  ) {
    if (!player.fall) {
      player.fall = true;
      player.y += 1;
      player.dy = -1;
    }
    player.dy *= 0.99;
    player.dy -= 0.1;
    player.y -= player.dy;
  }

  player.y += +game.score.toFixed() / 1000;
  platesArr.forEach((plate) => (plate.y += +game.score.toFixed() / 1000));

  checkAndDeletePlates();

  let length = platesArr.length;
  for (let index = length - 1; index > length - 3; index--) {
    if (platesArr[index].isMain && platesArr[index].y > 30) {
      let point = Math.random();
      point < 0.5 ? (point = 1) : (point = 2);
      generatePlates(point);
    }
  }

  spawnBrick();
  updateBricks();
  deleteBrick();
  scoreBlock.textContent = game.score.toFixed();
}

function jump() {
  if (game.goUp) {
    if (player.dy > 0) {
      platesArr.forEach((plate) => {
        plate.y += player.dy;
      });
      game.score += player.dy / 10;
    } else {
      player.y -= player.dy;
    }
    player.dy *= 0.99;
    player.dy -= 0.1;
    player.x += player.dx;
  } else {
    player.x += player.dx;
    player.y -= player.dy;
    player.dy *= 0.99;
    player.dy -= 0.1;
  }
}

function generatePlates(point = 1) {
  const normalL = canvas.width / 2 - 70;
  const normalR = canvas.width / 2 + 70;
  point === 1 ? createOnePlate() : createManyPlates(point);

  function createOnePlate() {
    const randNum = Math.random();
    let direction, coordinateX, coordinateY;
    const isMain = true;

    if (randNum < 0.5) {
      direction = "left";
      coordinateX = getRandNum(normalL - 50, normalL + 30);
    } else {
      direction = "right";
      coordinateX = getRandNum(normalR - 30, normalR + 50);
    }

    const lastPlate = platesArr[platesArr.length - 1];
    const lastPlateY = lastPlate.y;
    coordinateY = getRandNum(lastPlateY - 70 - 100, lastPlateY - 30 - 100);

    const plate = new Plate(coordinateX, coordinateY, direction, isMain);
    plate.draw();
    platesArr.push(plate);
  }

  function createManyPlates(point) {
    for (let i = 0; i < point; i++) {
      const length = platesArr.length;
      let coordinateX, coordinateY, direction, isMain;
      let prevPlateY;
      if (i % 2 === 0 || i === 0) {
        direction = "left";
        coordinateX = getRandNum(normalL - 50, normalL + 30);
        isMain = false;
      } else {
        direction = "right";
        coordinateX = getRandNum(normalR - 30, normalR + 50);
        isMain = true;
      }

      if (length > 1) {
        for (let index = length - 1; index > length - 3; index--) {
          if (platesArr[index].isMain === true) {
            prevPlateY = platesArr[index].y;
            break;
          }
        }
      } else {
        prevPlateY = canvas.height / 2 + canvas.height / 4;
      }
      coordinateY = getRandNum(prevPlateY - 70 - 100, prevPlateY - 30 - 100);
      const plate = new Plate(coordinateX, coordinateY, direction, isMain);
      plate.draw();
      platesArr.push(plate);
    }
  }
}

function checkAndDeletePlates() {
  platesArr.forEach((plate, index) => {
    if (plate.y > canvas.height) {
      platesArr.splice(index, 1);
    }
  });
}

function createBrick() {
  const minX = canvas.width / 2 - 100;
  const maxX = canvas.width / 2 + 100;

  const coordinateX = getRandNum(minX, maxX);
  const coordinateY = -20;
  const brick = new Brick(coordinateX, coordinateY);
  brick.draw();
  bricksArr.push(brick);
}

function spawnBrick() {
  let randSign = Math.random();

  let cof = ((game.score % 50) * 0.05) / 600;
  if (randSign < cof) {
    createBrick();
  }
}

function updateBricks() {
  if (bricksArr.length > 0) {
    bricksArr.forEach((brick) => {
      if (brick.y < 60) {
      }
      brick.y -= brick.dy;
      brick.dy *= 0.99;
      brick.dy -= 0.1;
    });
  }
}

function deleteBrick() {
  if (bricksArr.length > 0) {
    bricksArr.forEach((brick, index) => {
      if (brick.y > canvas.height) {
        bricksArr.splice(index, 1);
      }
    });
  }
}

function clickHandler() {
  if (!game.started) {
    game.started = true;
    startText.style.display = "none";
  }
  if (player.jumpRow < 3) {
    if (player.stickLeft) {
      player.x -= 4;
      player.y -= 4;
    } else if (player.stickRight) {
      player.x += 4;
      player.y -= 4;
    } else if (player.stickTop) {
      if (player.x + player.width / 2 < canvas.width / 2) {
        player.dx = -3;
        player.x += player.dx;
        player.y -= 4;
      } else {
        player.dx = 3;
        player.x += player.dx;
        player.y -= 4;
      }
    } else if (player.stickBottom) {
      if (player.x + player.width / 2 < canvas.width / 2) {
        player.dx = -3;
        player.x += player.dx;
        player.y -= 4;
      } else {
        player.dx = 3;
        player.x += player.dx;
      }
    }

    player.dy = 3;
    player.dx = -player.dx;
    player.jump = true;
    player.fall = false;
    player.jumpRow++;
    player.stickLeft = false;
    player.stickRight = false;
    player.stickTop = false;
    player.stickBottom = false;
  }
}

function setCanvasWH() {
  const winWidth = window.innerWidth - 2;
  const winHeight = window.innerHeight - 2;
  let width, height;
  if (winWidth >= 500) {
    width = 500;
    height = winHeight;
  } else {
    width = winWidth;
    height = winHeight;
  }

  canvasWrapper.style.width = width + "px";
  canvasWrapper.style.height = height + "px";
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = width;
  canvas.height = height;
}

function getRandNum(min, max) {
  return Math.random() * (max - min) + min;
}

play();
