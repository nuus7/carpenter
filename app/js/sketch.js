const myRec = new p5.SpeechRec('PL', parseResult);
myRec.continuous = true;
myRec.interimResults = true;

const _windowWidth = window.innerWidth;
const _windowHeight = window.innerHeight;
const backgroundColor = 23;


//array of blocks that are the main objects on the scene
let blocks = [];
//object that is currently being built by the carpenter
let carpenterBlock;

//current frame
let frame = 0;

//array of available colors
let colors;

//players
let carpenter;
let narrator;

//stages
let stages = [];

let gravity;

//player one - narrator
//he is the one that stimulates the scene by speaking
function Narrator(name) {
  this.name = name;
  this.force = 2;

  //function used to move blocks with voice
  this.moveBlocks = (command) => {
    if (this.commands.left.has(command)) {
      blocks.filter(block => !block.stable)
        .forEach(block => {
          block.velocity.y = 0;
          block.velocity.x = -this.force;
        });
    } else if (this.commands.right.has(command)) {
      blocks.filter(block => !block.stable)
        .forEach(block => {
          block.velocity.y = 0;
          block.velocity.x = this.force;
        });
    } else if (this.commands.up.has(command)) {
      blocks.filter(block => !block.stable)
        .forEach(block => {
          block.velocity.x = 0;
          block.velocity.y = -this.force;
        });
    } else if (this.commands.down.has(command)) {
      blocks.filter(block => !block.stable)
        .forEach(block => {
          block.velocity.x = 0;
          block.velocity.y = this.force;
        });
    }
  }

  //these are the input values (the words you say to move objects on the screen)
  this.commands = {
    left: new Set(["lewo", "zlewo", "lewa", "lego"]),
    right: new Set(["prawo", "rawo", "wrawo"]),
    up: new Set(["góra", "tura"]),
    down: new Set(["dół", "du", "do"]),
    next: new Set(["następne", "następna", "następnie", "następny"])
  }
}

//player two - carpenter
//he is the one that stimulates the scene by drawing
function Carpenter(name) {
  this.name = name;
  this.drawingMode = 'rectangle';

  this.sketchingTimer = 1000
  this.canSketch = true;

  this.minSketchSize = 1000;
  this.maxSketchSize = 40000;
  this.maxWidth = 300;
  this.maxHeight = 300;
  this.isRightSize = () => {
    let size = Math.abs(carpenterBlock.width) * Math.abs(carpenterBlock.height);
    if (size >= this.minSketchSize && size <= this.maxSketchSize && Math.abs(carpenterBlock.width) <= this.maxWidth && Math.abs(carpenterBlock.height) <= this.maxHeight) {
      console.log(size);
      return true;
    } else {
      console.log(size);
      return false;
    }
  }

  //carpenter building objects
  this.sketch = () => {
    if (this.drawingMode == 'rectangle') {
      let mousePosition = createVector(mouseX, mouseY);
      carpenterBlock = new Block(1, 0, 0, mousePosition, colors.transparent);
    }
  }

  //finalize the sketch. time to build object
  this.build = () => {
    if (this.drawingMode == 'rectangle') {
      if (this.isRightSize()) {
        if (carpenterBlock.width < 0) {
          carpenterBlock.width = -1*carpenterBlock.width;
          carpenterBlock.position.x -= carpenterBlock.width;
        }
        if (carpenterBlock.height < 0) {
          carpenterBlock.height = -1*carpenterBlock.height;
          carpenterBlock.position.y -= carpenterBlock.height;
        }
        carpenterBlock.stable = false;
        //push the carpenter block to the standard blocks array
        blocks.push(new Block(
          carpenterBlock.density,
          carpenterBlock.width,
          carpenterBlock.height,
          carpenterBlock.position,
          getRandomColor()
        ));
        carpenterBlock = null;
      } else {
        carpenterBlock = null;
        return;
      }
    }

    this.canSketch = false;
    setTimeout(()=>{
      this.canSketch = true;
    }, this.sketchingTimer);
  }
}

function getRandomColor() {
  //all colors excluding white and transparent from the colors array
  let size = Object.keys(colors).length - 2;
  let index = floor(random(size));
  let count = 0;
  for (randomColor in colors) {
    if (count == index) {
      return colors[randomColor];
    }
    count++;
  }
}

function mousePressed() {
  //carpenter start sketching
  if(carpenter.canSketch) {
    carpenter.sketch();
  }
}

function mouseReleased() {
  //carpenter finishes sketch and builds the object
  if(carpenter.canSketch) {
    carpenter.build();
  }
}

function setup() {


  //create players
  narrator = new Narrator('rabal');
  carpenter = new Carpenter('poe');

  //all available colors
  colors = {
    red: color(211, 76, 61),
    green: color(47, 183, 70),
    blue: color(53, 109, 198),
    orange: color(239, 150, 33),
    yellow: color(242, 242, 75),
    seledin: color(87, 214, 176),
    violet: color(136, 97, 181),
    pink: color(242, 140, 225),
    transparent: color(0, 0, 0, 0),
    white: color(200, 200, 200)
  };

  createCanvas(_windowWidth, _windowHeight);
  background(backgroundColor);

  //whenever the engine hears the voice, parse the result
  myRec.onResult = parseResult;
  myRec.start(); //start engine

  // stages[0] = new Array();
  // stages[0].push(new Block(1));
  // stages[0][0].stable=true;
  blocks.push(new Block(1));
  blocks[0].stable=true;
  blocks[0].color=colors.white;
}
let pause = false;

function draw() {
  if (!pause) {
    background(backgroundColor);
    fill(colors.white);
    text("góra, dół, lewo, prawo", 20, 20);
    if (!carpenter.canSketch) {
      text("sketching cooldown", 20, 40);
    }

    //if carpenter is sketching
    if (carpenterBlock) {
      //draw the carpenter block
      carpenterBlock.sketching(mouseX - pmouseX, mouseY - pmouseY);
      if (!carpenter.isRightSize()) {
        console.log('wrong');
        carpenterBlock.color = color(255, 50, 80, 100);
      } else {
        console.log('right');
        carpenterBlock.color = colors.transparent;
      }
      carpenterBlock.draw();
    }

    blocks.forEach(block => {
      if (!block.stable) {
        if(!block.collisionDetection()) {
          block.resetAcceleration();
          block.applyForce(createVector(0, 150));
          block.updateVelocity();
          block.updatePosition();
        }
      }
      block.draw();
    });
    frame++;
  }
}
function parseResult() {
  // recognition system will often append words into phrases.
  // so hack here is to only use the last word:
  var mostrecentword = myRec.resultString.split(' ').pop();
  narrator.moveBlocks(mostrecentword.toLowerCase(), 2);
  console.log(mostrecentword);
}


function Block(density,
  width = random(100)+100,
  height = random(100)+100,
  position=createVector(
    random(0.8)*_windowWidth+0.1*_windowWidth,
    random(0.8)*_windowHeight+0.1*_windowHeight),
  color = colors.orange,
  stable = false) {

  //if stable is true, the narrator doesn't have control over it
  this.stable = stable;
  this.density = density;
  this.position = position;
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(0, 0);
  this.width = width;
  this.height = height;
  // this.mass = this.width * this.height * this.density;
  this.mass = 10000;
  this.color = color;

  //when carpenter is currently sketching the block
  this.sketching = (xOffset, yOffset) => {
    this.width += xOffset;
    this.height += yOffset;
  }

  this.resetAcceleration = () => {
    this.acceleration.mult(0);
  }

  this.applyForce = (force) => {
    this.acceleration.add(force.div(this.mass));
  }

  this.updateVelocity = () => {
    this.velocity.add(this.acceleration);
  }

  this.updatePosition = () => {
    this.position.add(this.velocity);
  }

  this.draw = () => {
    push();
    fill(this.color);
    stroke(colors.white);
    strokeWeight(3);
    rect(this.position.x, this.position.y, this.width, this.height);
    pop();
  }

  this.collisionDetection = () => {
    blocks.filter(block => block.stable)
    .forEach(collider => {
      if (
        this.position.x + this.width >= collider.position.x
        && this.position.x <= collider.position.x + collider.width
        && this.position.y +this.height >= collider.position.y
        && this.position.y <= collider.position.y + collider.height
      ) {
        console.log('kolizja');
        this.stable = true;
        this.color = colors.white;
        return true;
      }
    });
  }
}
