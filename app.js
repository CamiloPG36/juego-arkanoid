// ===============================
// CONFIGURACIÓN INICIAL
// ===============================

// Se recupera el Canvas del HTML y se define el contexto del tablero
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d"); // Plano 2D

// Imágenes desde el HTML
const $sprite = document.querySelector("#sprite");
const $bricks = document.querySelector("#bricks");

// Botón inicio
const $startBtn = document.querySelector("#startBtn");

// Tamaño del Canvas
canvas.width = 448;
canvas.height = 400;

// ===============================
// VARIABLES DEL JUEGO
// ===============================

// Variables de animación
let animationFrameId = null;
let eventsInitialized = false;
let gameOver = false;

// Variables de la pelota
const ballRadius = 3; //Radio de la pelota
let x = canvas.width / 2; // Posición inicial horizontal
let y = canvas.height - 30; // Posición inicial vertical
let dx = -3; // Velocidad horizontal
let dy = -3; // Velocidad vertical

// Variables de la paleta
const PADDLE_SENSITIVITY = 8;
const paddleHeight = 10;
const paddleWidth = 50;
let paddleX = (canvas.width - paddleWidth) / 2; // Centrada al inicio
let paddleY = canvas.height - paddleHeight - 10; // 10px arriba del borde inferior
let rightPressed = false;
let leftPressed = false;

// Variables de los ladrillos
const brickRowCount = 6;
const brickColumnCount = 13;
const brickWidth = 32;
const brickHeight = 16;
const brickPadding = 0;
const brickOffsetTop = 80;
const brickOffsetLeft = 16;

const BRICK_STATUS = {
  ACTIVE: 1,
  DESTROYED: 0,
};

const bricks = []; // Matriz de ladrillos

// ===============================
// CONFIGURACIÓN DE FPS
// ===============================

// Velocidad de fps para que renderice el juego
const fps = 60;
const msPerFrame = 1000 / fps;
let msPrev = window.performance.now();
let msFPSPrev = window.performance.now() + 1000;
let frames = 0;
let framesPerSec = fps;

// ===============================
// FUNCIONES DE DIBUJO
// ===============================

// Dibuja la PELOTA
function drawBall() {
  ctx.beginPath(); // iniciar el trazado
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2); // Dibuja un círculo
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath(); // terminar el trazado
}

// Dibuja la PALETA
function drawPaddle() {
  ctx.drawImage(
    $sprite, // imagen
    29, // clipX: coordenadas de recorte
    174, // clipY: coordenadas de recorte
    paddleWidth, paddleHeight, // Tamaño del recorte
    paddleX, // Posición X del dibujo
    paddleY, // Posición Y del dibujo
    paddleWidth, // Ancho del dibujo
    paddleHeight // Alto del dibujo
  );
}

// Dibuja los LADRILLOS
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const currentBrick = bricks[c][r];
      if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;

      const clipX = currentBrick.color * 32;
      ctx.drawImage(
        $bricks,
        clipX, 0,
        brickWidth, // 31
        brickHeight, // 14
        currentBrick.x, currentBrick.y,
        brickWidth,brickHeight
      );
    }
  }
}

// Dibujar FPS(Frames Per Second)
function drawUI() {
  ctx.fillText(`FPS: ${framesPerSec}`, 5, 10);
}

// ===============================
// FUNCIONES DE LÓGICA DEL JUEGO
// ===============================

// Detecta colisiones entre pelota y ladrillos
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const currentBrick = bricks[c][r];
      if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;

      const isBallSameXAsBrick = x > currentBrick.x && x < currentBrick.x + brickWidth;
      const isBallSameYAsBrick = y > currentBrick.y && y < currentBrick.y + brickHeight;

      if (isBallSameXAsBrick && isBallSameYAsBrick) {
        dy = -dy;
        currentBrick.status = BRICK_STATUS.DESTROYED;
      }
    }
  }
}

// Movimiento de la pelota
function ballMovement() {
  // Rebote en paredes laterales
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) { // 1:Pared der y 2:Pared izq
    dx = -dx;
  }

  // Rebote en la parte superior
  if (y + dy < ballRadius) {
    dy = -dy;
  }

  // Colisión con la paleta
  const isBallSameXAsPaddle = x > paddleX && x < paddleX + paddleWidth;
  const isBallTouchingPaddle = y + dy > paddleY;

  // Detecta si la pelota toca el suelo (fin del juego)
  if (y + dy > canvas.height - ballRadius || y + dy > paddleY + paddleHeight) {
    gameOver = true;
    showGameOver(); // Muestra el mensaje en el canvas
    $startBtn.textContent = "Reiniciar juego";
  }

  // Si la pelota toca la paleta, rebota
  else if (isBallSameXAsPaddle && isBallTouchingPaddle) {
    dy = -dy;
  }

  // Actualiza la posición de la pelota
  x += dx;
  y += dy;
}

// Movimiento de LA PALETA
function paddleMovement() {
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += PADDLE_SENSITIVITY;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= PADDLE_SENSITIVITY;
  }
}

// ===============================
// FUNCIONES DE CONTROL DEL JUEGO
// ===============================

// Inicializa la estructura de ladrillos
function buildBricks() {
  // Vaciar contenido del array
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = []; // Reinicio de columnas
    for (let r = 0; r < brickRowCount; r++) {
      const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
      const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
      const random = Math.floor(Math.random() * 8);
      
      bricks[c][r] = {
        x: brickX,
        y: brickY,
        status: BRICK_STATUS.ACTIVE,
        color: random,
      };
    }
  }
}

// Reinicia variables cuando la pelota toca el suelo
function resetGameVariables() {
  cleanCanvas(); // Limpia el canvas

  // Posición inicial de la pelota
  x = canvas.width / 2;
  y = canvas.height - 30;

  // Velocidad inicial
  dx= -3;
  dy = -3;

  // Paleta al centro
  paddleX = (canvas.width - paddleWidth) / 2;

  // Reconstruir ladrillos
  buildBricks();

  // Reiniciar estado del juego
  gameOver = false;
}

// Limpia el canvas en cada frame
function cleanCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Muestra mensaje de "GAME OVER"
function showGameOver() {
  ctx.font = "32px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

// ===============================
// EVENTOS DEL JUEGO
// ===============================

// Inicia eventos de teclado
function initEvents() {
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);

  function keyDownHandler(event) {
    const { key } = event;
    if (key === "Right" || key === "ArrowRight" || key.toLowerCase() === "d") {
      rightPressed = true;
    } else if (
      key === "Left" ||
      key === "ArrowLeft" ||
      key.toLowerCase() === "a"
    ) {
      leftPressed = true;
    }
  }

  function keyUpHandler(event) {
    const { key } = event;
    if (key === "Right" || key === "ArrowRight" || key.toLowerCase() === "d") {
      rightPressed = false;
    } else if (
      key === "Left" ||
      key === "ArrowLeft" ||
      key.toLowerCase() === "a"
    ) {
      leftPressed = false;
    }
  }
}

// ===============================
// ANIMACIÓN PRINCIPAL
// ===============================

// Funcion de animación o de dibujo
function draw() {
  if (gameOver) {
    cleanCanvas();      // Limpia el canvas
    showGameOver();     // Muestra solo el mensaje
    return;             // No se dibuja nada más
  }

  animationFrameId = requestAnimationFrame(draw);

  const msNow = window.performance.now();
  const msPassed = msNow - msPrev;

  if (msPassed < msPerFrame) return;

  msPrev = msNow - (msPassed % msPerFrame);

  frames++;
  if (msFPSPrev < msNow) {
    msFPSPrev = window.performance.now() + 1000;
    framesPerSec = frames;
    frames = 0;
  }

//LIMPIAR EL CANVAS
// Evitar superposición de dibujos
cleanCanvas();

// DIBUJAR LOS ELEMENTOS VISUALES DEL JUEGO
drawBall();
drawPaddle();
drawBricks();
// drawUI(); // Oculta el contador de FPS

// LÓGICA DEL JUEGO
collisionDetection();
ballMovement();
paddleMovement();
}

// ===============================
// INICIAR O REINICIAR JUEGO
// ===============================

function startGame (){
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId); // Evita que se duplique la animación
  }

  if (gameOver) {
    resetGameVariables(); // Reinicia las variables si el juego ya terminó
  }

  if (!eventsInitialized) {
    initEvents(); // Solo la primera vez
    eventsInitialized = true;
  }

  draw(); // Inicio la animación
}

$startBtn.addEventListener("click", startGame);

// Inicializa ladrillos al cargar
buildBricks();