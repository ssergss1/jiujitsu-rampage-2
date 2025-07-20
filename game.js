// --- Инициализация ----------------------------------------------------------
kaboom({
  width:360,
  height:640,
  canvas:document.querySelector("#game"),
  background:[0,0,0],
  scale:1,
  crisp:true,
});

const TG = window.Telegram?.WebApp;
TG?.onEvent?.("themeChanged", applyTheme);
TG?.ready?.();

// --- Ассеты -----------------------------------------------------------------
loadRoot("assets/");
loadSprite("player-run1","images/characters/player-run1.png");
loadSprite("player-run2","images/characters/player-run2.png");
loadSprite("player-run3","images/characters/player-run3.png");
loadSprite("player-jump","images/characters/player-jump.png");
loadSprite("coin","images/objects/coin.png");
loadSprite("block","images/objects/obstacle.png");
loadSprite("building","images/objects/building.png");
loadSprite("heart","images/ui/heart.png");

loadSound("jump","sounds/sfx/jump.mp3");
loadSound("fall","sounds/sfx/fall.mp3");
loadSound("coin","sounds/sfx/coin.mp3");
loadSound("victory","sounds/sfx/victory.mp3");

const musicMenu = loadSound("menu","sounds/music/menu-theme.mp3");
const musicLvl  = loadSound("lvl","sounds/music/level-theme.mp3");

// --- Глобальное состояние ---------------------------------------------------
let high = +(localStorage.getItem("high")||0);
let score,lives,level,speed,jumps;

// --- Сцены ------------------------------------------------------------------
scene("menu",() => {
  musicLvl.pause();
  if(!musicMenu.playing()) musicMenu.play();
  add([
    text("JIUJITSU RAMPAGE 2",{size:24}),
    pos(center().sub(0,180)),
    origin("center"),color(255,50,50),
  ]);
  add([
    text(`РЕКОРД ${high.toString().padStart(7,"0")}`,{size:16}),
    pos(center().sub(0,120)),origin("center"),
  ]);
  // DOM‑кнопка
  const btn=document.getElementById("start-btn");
  btn.hidden=false;
  btn.onclick=() => {
    btn.hidden=true;
    go("game");
  };
});

scene("game",() => {
  initLevelVars();
  musicMenu.pause();
  if(!musicLvl.playing()) musicLvl.play();
  generateLevel();
  makeUI();
  const player=makePlayer();

  // управление (тач/клик) -----------------------------------------------
  onTouchStart(handleJump);
  onKeyPress("space",handleJump);

  // столкновения ---------------------------------------------------------
  player.onCollide("coin",(c) => {
    destroy(c); score+=100; updateScore(); play("coin");
  });

  player.onCollide("block",() => {
    // просто упёрся
  });

  player.onCollide("building",() => {
    victory();
  });

  // падение --------------------------------------------------------------
  player.onUpdate(() => {
    if(player.pos.y > height()){
      respawn(player);
    }
  });

  // генерация «бесконечно» ----------------------------------------------
  onUpdate(() => scrollWorld(player));
});

// --- Функции‑помощники ------------------------------------------------------
function initLevelVars(){
  score=0; lives=3; level=1; speed=120;
}

function makePlayer(){
  const spr = add([
    sprite("player-run1"),
    pos(40, height()-120),
    area(), body(),
    { runFrame:0 },
    "player",
  ]);
  spr.onUpdate(() => {
    spr.move(speed,0);
    if(spr.isGrounded()){
      spr.runFrame=Math.floor(time()*10)%3+1;
      spr.use(sprite(`player-run${spr.runFrame}`));
      jumps=0;
    }
  });
  return spr;
}

function handleJump(){
  if(jumps<2){
    get("player")[0].jump(600 - jumps*100);
    play("jump");
    jumps++;
    get("player")[0].use(sprite("player-jump"));
  }
}

function respawn(p){
  play("fall");
  lives--; updateLives();
  if(lives<=0){ gameOver(); return; }
  p.pos = vec2(40,height()-120);
  p.vel = vec2(0,0);
}

function victory(){
  play("victory");
  level++; speed+=10;
  wait(1,() => generateLevel());
}

function gameOver(){
  musicLvl.pause();
  if(score>high){ high=score; localStorage.setItem("high",high); }
  go("menu");
}

let scoreText,lifeUI;
function makeUI(){
  scoreText = add([text("000000",{size:16}),pos(12,12),"score"]);
  lifeUI   = add([pos(width()-116,12),"lives"]);
  updateScore(); updateLives();
}

function updateScore(){ scoreText.text=score.toString().padStart(6,"0"); }
function updateLives(){
  lifeUI.use(clearComp());
  for(let i=0;i<lives;i++){
    lifeUI.add([
      sprite("heart"),
      pos(i*36,0),scale(0.5)
    ]);
  }
}

function generateLevel(){
  destroyAll("level");
  // фон‑градиент
  add([rect(width(),height()), color(rand(0,255),rand(0,255),rand(0,255)),
       pos(0,0),"level"]);
  // платформа‑земля
  add([rect(99999,32),area(),body({isStatic:true}),pos(0,height()-32),
       color(70,40,20),"level","ground"]);
  // препятствия
  loop(3+level,() => {
    add([sprite("block"),pos(rand(200,width()*3),
        height()-64),area(),body({isStatic:true}),
        "block","level"]);
  });
  // монетки
  loop(4+level,() => {
    add([sprite("coin"),pos(rand(180,width()*3),
        rand(height()-300,height()-180)),
        area(),"coin","level"]);
  });
  // финиш
  add([sprite("building"),pos(width()*3+100,height()-160),
       area(),"building","level"]);
}

function scrollWorld(player){
  const cam = camPos();
  if(player.pos.x > cam.x){
    camPos(player.pos);
  }
}

function applyTheme(){
  document.body.style.background = TG?.themeParams?.bg_color || "#000";
}

// --- Старт ------------------------------------------------------------------
go("menu");
