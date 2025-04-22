// CONFIGURACIÓN INICIAL
// Se recupera el Canvas del HTML y se define el contexto del tablero
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d"); // Plano 2D

// Se recuperan las imágenes desde el HTML
const $sprite = document.querySelector("#sprite");
const $bricks = document.querySelector("#bricks");

// Se define el tamaño del Canvas
canvas.width = 448;
canvas.height = 400;

// Se recupera la etiqueta button del HTML
const $startBtn = document.querySelector("#startBtn");

// VARIABLES DEL JUEGO
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
const bricks = [];
const BRICK_STATUS = {
  ACTIVE: 1,
  DESTROYED: 0,
};

// Inicialización del arreglo de los ladrillos
// Se Crea la estructura de los ladrillos (filas y columnas)
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = []; // Se inicializa una columna como un array vacio
  for (let r = 0; r < brickRowCount; r++) {
    // Se calcula la posicion de cada ladrillo en el canvas
    const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
    const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
    // Se asigna un color aleatorio a cada ladrillo entre 0 y 7 (8 opciones)
    const random = Math.floor(Math.random() * 8);
    // Se guarda la información de cada ladrillo en un arreglo
    bricks[c][r] = {
      x: brickX,
      y: brickY,
      status: BRICK_STATUS.ACTIVE,
      color: random,
    };
  }
}

// VISUALIZACIÓN DE LOS ELEMENTOS DEL JUEGO EN EL CANVAS
// Función para dibujar la BOLA
function drawBall() {
  ctx.beginPath(); // iniciar el trazado
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2); // Dibuja un círculo
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath(); // terminar el trazado
}

// Función para dibujar la PALETA
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

// Función para dibujar los LADRILLOS
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

// Función de interfaz de FPS(Frames Per Second)
function drawUI() {
  ctx.fillText(`FPS: ${framesPerSec}`, 5, 10);
}

// LÓGICA DEL JUEGO

// Función de colisiones de ladrillos
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const currentBrick = bricks[c][r];
      if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;

      const isBallSameXAsBrick =
        x > currentBrick.x && x < currentBrick.x + brickWidth;

      const isBallSameYAsBrick =
        y > currentBrick.y && y < currentBrick.y + brickHeight;

      if (isBallSameXAsBrick && isBallSameYAsBrick) {
        dy = -dy;
        currentBrick.status = BRICK_STATUS.DESTROYED;
      }
    }
  }
}

// Función de movimiento de la pelota
function ballMovement() {
  // Rebote lateral
  if (x + dx > canvas.width - ballRadius || // la pared derecha
    x + dx < ballRadius // la pared izquierda
  ) {
    dx = -dx;
  }

  // Rebotar en la parte superior
  if (y + dy < ballRadius) {
    dy = -dy;
  }

  // La pelota toca la paleta
  const isBallSameXAsPaddle = x > paddleX && x < paddleX + paddleWidth;
  const isBallTouchingPaddle = y + dy > paddleY;

  if (isBallSameXAsPaddle && isBallTouchingPaddle) {
    dy = -dy; // Se cambia la dirección de la pelota
  } else if (
    // la pelota toca el suelo
    y + dy > canvas.height - ballRadius ||
    y + dy > paddleY + paddleHeight
  ) {
    gameOver = true;
    console.log("Game Over");
    document.location.reload(); // Reinicia el Juego
  }

  // mover la pelota
  x += dx;
  y += dy;
}

// Función de movimiento de LA PALETA
function paddleMovement() {
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += PADDLE_SENSITIVITY;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= PADDLE_SENSITIVITY;
  }
}

// EVENTOS Y CONTROLES
// Función para borrar el Canva en cada frame
function cleanCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Función para inicializar eventos
// Manejo de teclado
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

// ANIMACIÓN DEL JUEGO (FPS)
// Velocidad de fps para que renderice el juego
const fps = 60;

let msPrev = window.performance.now();
let msFPSPrev = window.performance.now() + 1000;
const msPerFrame = 1000 / fps;
let frames = 0;
let framesPerSec = fps;

let gameOver = false;

// Funcion de animación o de dibujo, base para cualquier video juego
function draw() {
  if (gameOver) return;

  window.requestAnimationFrame(draw);

  const msNow = window.performance.now();
  const msPassed = msNow - msPrev;

  if (msPassed < msPerFrame) return;

  const excessTime = msPassed % msPerFrame;
  msPrev = msNow - excessTime;

  frames++;

  if (msFPSPrev < msNow) {
    msFPSPrev = window.performance.now() + 1000;
    framesPerSec = frames;
    frames = 0;
  }

  // --- LIMPIAR EL CANVAS ---
// Borra el contenido del frame anterior para evitar superposición de dibujos
cleanCanvas();

// DIBUJAR LOS ELEMENTOS VISUALES DEL JUEGO
drawBall();
drawPaddle();
drawBricks();
drawUI();

// LÓGICA DEL JUEGO
collisionDetection();
ballMovement();
paddleMovement();
}

draw(); // Inicio la animación
initEvents(); // Inicio de controles
