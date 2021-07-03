//IMPORTS

//import * as THREE from './js/vendors/three.module.js';
//import Stats from './js/stats.module.js';
//import {
//  GUI
//} from './build/dat.gui.module.js';
//import { OrbitControls } from './js/OrbitControls.js';
// import { HDRCubeTextureLoader } from './js/HDRCubeTextureLoader.js';
// import { RGBMLoader } from './js/RGBMLoader.js';
// import { DebugEnvironment } from './js/DebugEnvironment.js';

//DIMENSION VARIABLES

// Get window dimension
var ww = document.documentElement.clientWidth || document.body.clientWidth;
var wh = window.innerHeight;
var ww2 = ww * 0.5,
  wh2 = wh * 0.5; // Save half window dimension

var delta;

var myAnimator;

// TEXTURE

var clock = new THREE.Clock();
var myTime = clock.getElapsedTime();
var time = 0;

// TUNNEL VARIABLES

var radialSegments = 70;
var radiusShift = 0.02;

// MOUSE TRACK DIVISIONS

let centerPoint = 0;
let centerBoxBoundary = 0.2;
let sectionTwo = 0.4;
let sectionThree = 0.6;
let sectionFour = 0.8;
let sectionFive = 1;

// INTENSITY

var intensityStart = -30.0;
var intensityMid = 3.0;
//var intensityMid2 = 3.0;
var intensityFinal = 5.0;

//COLOR VARIABLES - hue values are out of 360

//Green - Center hsl(129, 36, 17) 
var hue0 = 0.3583333;
var sat0 = 0.36;
var light0 = 0.17;

//Yellow - box one hsl(42, 65%, 52%)
var hue1 = 0.1166666667;
var sat1 = 0.646;
var light1 = 0.524;

//Orange - box two hsl(25, 62.4%, 35.5%)
var hue2 = 0.069444444;
var sat2 = 0.624;
var light2 = 0.355;

//Pink - box three hsl(6, 48%, 33.3%)
var hue32 = 0.908333333
var sat32 = 0.553;
var light32 = 0.333;

//Pink - box three hsl(327, 55.3%, 33.3%)
//var hue3 = 0.908333333;
var hue3 = -0.091666666; //-33 this needs to be like this to go backwards in HSL
var sat3 = -0.447;
var light3 = -0.666;

//Violet - box four hsl(260, 52.9%, 36.7%)
var hue4 = 0.722222222;
var sat4 = 0.529;
var light4 = 0.367;

//VISUAL NOISE SHIFT
var noiseX0 = 4.0;
var noiseY0 = 4.0;
var noiseZ0 = 2.0;

var noiseX5 = 1.0;
var noiseY5 = 1.0;
var noiseZ5 = 0.2;

//AUDIO SHIFT
var startFrequency = 100;
var endFrequency = 768;

//AMBIANCE
var numberOfParticles = 50;
let cell;

var cylinder;

//STENT STUFF

var stentAnimationFlag = 0;

var segments = 3;
var latheRadius = 0.009;
var minimumOculus = 0.009;
var blockageSegments = 16;
var blockageRadius = 0.021;
var blockageCounter = 0;
var rectangleFlag = 1;
var mouseFlag = 0;
var doneFlag = 0;
var latheFlag = 0;
var clickFlag = 0;
var textRemoveFlag = 0;

// LOAD TEXTURES 
// (Leads to checkTextures();)
var textures = {
  "stone": {
    url: "img/demo1/alphaMapTunnel.png"
  },
  "stoneBump": {
    url: "img/demo1/tunnelSized.jpg"
  },
  "marble": {
    url: "img/demo1/marbleTexture.png"
  }
};

// Create a new loader
var loader = new THREE.TextureLoader();
// Prevent crossorigin issue
loader.crossOrigin = "Anonymous";
// Load all textures
for (var name in textures) {
  (function (name) {
    loader.load(textures[name].url, function (texture) {
      textures[name].texture = texture;
      checkTextures();
    });
  })(name)
}
var texturesLoaded = 0;

// Checks if textures are done loading 
// (leads to Tunnel(cell);)
function checkTextures() {
  texturesLoaded++;
  if (texturesLoaded === Object.keys(textures).length) {
    document.body.classList.remove("loading");
    // When all textures are loaded, init the scene
    window.tunnel = new Tunnel();
  }
};

// CONSTRUCTOR FUNCTION - (not looped)
// (leads to init(), )
function Tunnel(cell) {

  // Init the scene and the
  this.init();

  // Create the shape of the tunnel
  this.createMesh();

 // this.popUpStent();

  //CylinderGeometry(radiusTop : Float, radiusBottom : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
  const geometry = new THREE.CylinderGeometry( 0.0005, 0.0005, 0.08, 32, 15, false, 0, Math.PI*2 );
  const material = new THREE.MeshBasicMaterial( {color: 0x000000} );
  
  cylinder = new THREE.Mesh( geometry, material );

  cylinder.rotation.x = (90*Math.PI)/180;
  cylinder.position.z = 0.23;

  //PointLight( color : Integer, intensity : Float, distance : Number, decay : Float )

  var backLight = new THREE.PointLight(0xffffff, 0.6, 2, 9);
  backLight.position.x = 0;
  backLight.position.y = 0;
  backLight.position.z = 0.3;

  var backLight2 = new THREE.PointLight(0xffffff, 0.2, 2, 9);
  backLight2.position.x = 0;
  backLight2.position.y = 0;
  backLight2.position.z = 1;

  this.scene.add(backLight2);
  this.scene.add(backLight);

  // Mouse events & window resize
  this.handleEvents();

  //this.latheCreate();

  // Start loop animation - necessary to kick it off
  window.requestAnimationFrame(this.render.bind(this));

}

// INITIALISER FUNCTION - (not looped)

Tunnel.prototype.init = function () {

  // Define the speed of the tunnel
  this.speed = 0.0003;

  // Store the position of the mouse
  // Default is center of the screen
  this.mouse = {
    position: new THREE.Vector2(0, 0),
    target: new THREE.Vector2(0, 0)
  };

  // Create a WebGL renderer
  this.renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector("#scene"),
    alpha: true
  });
  // Set size of the renderer and its background color
  this.renderer.setSize(ww, wh);
  this.renderer.setClearColor(0x222222);

  // Create a camera and move it along Z axis
  this.camera = new THREE.PerspectiveCamera(15, ww / wh, 0.01, 1000);
  this.camera.position.z = 0.01;

  this.audioStart();

  // Create an empty scene and define a fog for it
  //https://threejsfundamentals.org/threejs/lessons/threejs-fog.html
  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.Fog(0x000000, 0.6, 2.8);

  this.addParticle();

};

// AUDIO FUNCTIONS - (not looped)

Tunnel.prototype.audioStart = function () {

  var analyser;
  const listener = new THREE.AudioListener();
  this.camera.add(listener);

  const audioLoader = new THREE.AudioLoader();

  this.frequencyShift = new THREE.PositionalAudio(listener);
  
  this.oscillator = listener.context.createOscillator();
  this.oscillator.type = 'sine';
  this.oscillator.frequency.setValueAtTime(200, this.frequencyShift.context.currentTime);
  this.oscillator.start(0);
  
  this.frequencyShift.setNodeSource(this.oscillator);
  this.frequencyShift.setRefDistance(20);
  this.frequencyShift.setVolume(0.2);

  const sound = new THREE.Audio(listener);

  audioLoader.load('sounds/X3Loud2.mp3', function (buffer) {

    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(8);
    sound.play();

  });

  this.camera.add(this.frequencyShift);

}

// ADD BLOOD PARTICLES - (not looped)

Tunnel.prototype.addParticle = function() {
  this.particles = [];
  this.particlesContainer = new THREE.Object3D();
  this.scene.add(this.particlesContainer);
  for (var i = 0; i < (numberOfParticles); i++) {
    var particle = new Particle(this.scene);
    this.particles.push(particle);
    this.particlesContainer.add(particle.mesh);
  }
};

// MESH CREATOR FUNCTION - (not looped)

Tunnel.prototype.createMesh = function () {

// CREATE THE GEOMETRY

//POSSIBLY ADD PERLIN NOISE ALGORITHM TO "PULSE" THE TUNNEL LIKE A HEARTBEAT

  // Empty array to store the points along the path
  var points = [];

  // Define points along Z axis to create a curve
  for (var i = 0; i < 5; i += 1) {
    points.push(new THREE.Vector3(0, 0, 2.5 * (i / 4)));
  }

  // Set custom Y position for the last point
  points[4].y = -0.06;

  // Create a curve based on the points and define curve type
  this.curve = new THREE.CatmullRomCurve3(points);

  // Empty geometry
  var geometry = new THREE.Geometry();
  // Create vertices based on the curve
  geometry.vertices = this.curve.getPoints(70);
  // Create a line from the points with a basic line material
  this.splineMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial());

  // Create a tube geometry based on the curve

  //TubeGeometry(path : Curve, tubularSegments : Integer, radius : Float, radialSegments : Integer, closed : Boolean)
  this.tubeGeometry = new THREE.TubeGeometry(this.curve, 70, 0.02, 50, false);
  
  // Create a mesh based on the tube geometry and its material


  // MOVING TUNNEL

  // MESH STANDARD MATERIAL - HIGH REFLECTIVITY

  var tunnelTexture = new THREE.TextureLoader().load('img/demo1/marbleTexture.png');
  myAnimator = new TextureAnimator( tunnelTexture, 1, 10, 45, 20 ); // texture, #horiz, #vert, #total, duration.


  this.tubeMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.2,
    roughness: 0.5,
    color: new THREE.Color("hsl(129, 36%, 17%)"),
    wireframe: false,
    side: THREE.DoubleSide,
    //alphaTest: 0.5,
    transparent: true,  //this gives the hazy effect when it hits the greys
    map: tunnelTexture,
    alphaMap: textures.stone.texture,
  });

  this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);

  // ADD AUDIO
  this.tubeMesh.add(this.sound);

  // TEXTURE TUNNEL

  var uniforms = {
    color: {
      type: "c",
      value: new THREE.Color("hsl(129, 36%, 17%)"),
    },
    noiseScale: {
      type: "v3",
      value: new THREE.Vector3(4.0, 4.0, 2.0)
    },
    speed: {
      type: "f",
      value: -0.1
    },
    time: {
      type: "f",
      value: 0.0
    },
    intensity: {
      type: "f",
      value: 4.0
    }
  };

  var vertexShader = document.getElementById('tunnelVertexShader').text;
  var fragmentShader = document.getElementById('tunnelFragmentShader').text;

  this.tubeReflectorMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    opacity: 1,
    side: THREE.BackSide
  });

  // CylinderBufferGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
  this.tubeReflectorGeometry = new THREE.CylinderBufferGeometry(0.044, 0.05, 20, 23, 11, false);

  //this.tubeReflectorGeometry = new THREE.CylinderBufferGeometry(0.003, 0.003, 0.05, 23, 11, true);

  this.tubeReflector = new THREE.Mesh(this.tubeReflectorGeometry, this.tubeReflectorMaterial);
  this.tubeReflector.rotation.x = (90 * Math.PI) / 180;
  //this.tubeReflector.position.z = 0.2;

  //PUSH TUBES ONTO SCENE

  this.scene.add(this.tubeMesh);
  this.scene.add(this.tubeReflector);

  // Clone the original tube geometry for the mouse motion
  this.tubeGeometry_o = this.tubeGeometry.clone();

  //LIGHTS

  // Add two lights in the scene
  // An hemisphere light, to add different light from sky and ground
  var light = new THREE.HemisphereLight(0x002626, 0x002626, 0.9);
  this.scene.add( light );

  // Add a directional light for the bump
  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  this.scene.add(directionalLight);

  // Repeat the pattern
  this.tubeMaterial.map.wrapS = THREE.RepeatWrapping;
  this.tubeMaterial.map.wrapT = THREE.RepeatWrapping;
  // //(firstNumber:number of divisions in depth, secondNumber:ring divisions)
   //this.tubeMaterial.map.repeat.set(10, 1);

  //PointLight( color : Integer, intensity : Float, distance : Number, decay : Float )
  var endOfTunnelLight = new THREE.PointLight(0xffffff, 0.8, 7, 9);
  endOfTunnelLight.position.x = 0;
  endOfTunnelLight.position.y = 0;
  endOfTunnelLight.position.z = 3;

  this.scene.add(endOfTunnelLight);

  this.light();

};

function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{	
	// note: texture passed by reference, will be updated by the update function.
		
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet. 
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

	// how long should each image be displayed?
	this.tileDisplayDuration = tileDispDuration;

	// how long has the current image been displayed?
	this.currentDisplayTime = 0;

	// which image is currently being displayed?
	this.currentTile = 0;
		
	this.update = function( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			texture.offset.x = currentColumn / (this.tilesHorizontal/8);
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			texture.offset.y += 0.01; //currentRow / (this.tilesVertical/9);
      //console.log("updating");
		}
	};

	// this.noUpdate = function( milliSec )
	// {
	// 	this.currentDisplayTime += milliSec;
	// 	while (this.currentDisplayTime > this.tileDisplayDuration)
	// 	{
	// 		this.currentDisplayTime -= this.tileDisplayDuration;
	// 		this.currentTile = 0;
	// 		if (this.currentTile == this.numberOfTiles)
	// 			this.currentTile = 0;
	// 		var currentColumn = this.currentTile % this.tilesHorizontal;
	// 		texture.offset.x = currentColumn / (this.tilesHorizontal/8);
	// 		var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
	// 		texture.offset.y += 0.01; //currentRow / (this.tilesVertical/9);
  //     console.log("not updating");
	// 	}
	// };

}		

// LIGHTS UPDATE FUNCTION - (INITIALISATION - NOT LOOPED, POSITION- Looped)

Tunnel.prototype.light = function () {
  this.particleLight = new THREE.Mesh(
    //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    new THREE.SphereGeometry(0.003, 40, 40),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
     // specular: 0xffffff,
      emissive: 0xffffff,
      shininess: 20,
      opacity: 1,
      //metalness: 0.4,
      emissiveIntensity : 3,
      //map: textures.marble.texture,
      // //bumpMap: textures.stoneBump.texture,
    })
    //new THREE.MeshBasicMaterial( { color: 0xffffff } )
  );

  this.probeHull = new THREE.Mesh(
    //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    new THREE.SphereGeometry(0.004, 32, 32, 0, 2.7, 0, 4),
    new THREE.MeshPhongMaterial({
      color: 0xfff000,
      specular: 0x666666,
      shininess: 20,
      opacity: 0.5,
      transparent: true,
      map: textures.marble.texture,
      //bumpMap: textures.stoneBump.texture,
    })
    //new THREE.MeshBasicMaterial( { color: 0xffffff } )
  );

  //this.probeHull.rotation.z = (90 * Math.PI) / 180;

  this.scene.add(this.particleLight);
  this.scene.add(this.probeHull);

  //PointLight( color : Integer, intensity : Float, distance : Number, decay : Float )

  this.flashLight = new THREE.PointLight(0xffffff, 1.0, 0.3, 6)

  //particleLight.add( new THREE.DirectionalLight (0xffffff, 0.5))
  this.particleLight.add(this.flashLight);

  //   const targetObject = new THREE.Object3D();
  // scene.add(targetObject);

  // light.target = targetObject;

}

//DRAW THE INITIAL LATHES - (not looped)

Tunnel.prototype.drawStent = function (segments, phiStart, phiLength, latheRadius) {

  const lathePoints = [];

  for ( let i = 0; i < 10; i ++ ) {

    //x, y
    //when i = 9, you want the argument of the sine to be PI/2
    //Math.sin( i * width) * shift + ( the place where the oculus opens ), 
    //( i - ? ) * squatness of the shape) );

    lathePoints.push( new THREE.Vector2( Math.sin( i * ((Math.PI/2) / 9) ) * 0.18 + latheRadius, ( i - 5 ) * 0.007 ) );
  }

  //LatheGeometry(points : Array, segments : Integer, phiStart : Float, phiLength : Float)

  this.latheGeometry = new THREE.LatheGeometry( lathePoints, segments, phiStart, phiLength );

  this.latheDepthGeometry = new THREE.LatheGeometry( lathePoints, segments, phiStart, phiLength );


  //console.log(latheVertices);

  var tunnelTexture2 = new THREE.TextureLoader().load('img/demo1/marbleTexture.png');
  //myAnimator = new TextureAnimator( tunnelTexture2, 1, 10, 45, 20 ); // texture, #horiz, #vert, #total, duration.

  this.latheMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.2,
    roughness: 0.5,
    color: new THREE.Color("hsl(129, 36%, 17%)"),
    wireframe: false,
    side: THREE.DoubleSide,
    alphaTest: 0.2,
    transparent: true,  //this gives the hazy effect when it hits the greys
    map: tunnelTexture2,
    //alphaMap: textures.stone.texture,
  });

  //const latheMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
  this.lathe = new THREE.Mesh( this.latheGeometry, this.latheMaterial );

  this.depthLathe = new THREE.Mesh( this.latheDepthGeometry, this.latheMaterial );


// the position stuff
 this.lathe.position.x = 0;
 this.lathe.position.y = 0;
 this.lathe.position.z = 0.42;

 this.lathe.rotation.x = -(90 * Math.PI) / 180;

 this.depthLathe.position.x = 0;
 this.depthLathe.position.y = 0;
 this.depthLathe.position.z = 0.39;

 this.depthLathe.rotation.x = -(90 * Math.PI) / 180;


 //add everything to the scene
  //this.scene.add( this.lathe );
  this.scene.add( this.depthLathe );
}

// INITIALISE EVENT HANDLING FUNCTION - (not looped)

Tunnel.prototype.handleEvents = function () {

  // I think what's happening here is that the event is a seperate thing outside the main (noloop)/(loop) structure that conditionally calls the resize and mouse positions after it notices that 
  // https://threejs.org/docs/#api/en/core/EventDispatcher.addEventListener

  //.addEventListener ( type : String, listener : Function ) : null
    //type - The type of event to listen to.
    //listener - The function that gets called when the event is fired.


  // When user resize window
  window.addEventListener("resize", this.onResize.bind(this), false);

  // TESTED: what this does is actually read the fact that the mouse is moving
  document.body.addEventListener(
    "mousemove",
    //in this case the "this" keyword is referring to the resized screen, therefore resizing mouse positions
    this.onMouseMove.bind(this),
    false
  );

  document.body.addEventListener( 
    'mousedown', 
    this.onDocumentMouseDown.bind(this), 
    false 
    );

  // document.getElementById('startButton').addEventListener("buttonPress", function() {
  //   console.log("hi"); 
  // });​

}

// RESIZE TO FIT SCREEN FUNCTION - (looped)

Tunnel.prototype.onResize = function () {

  // On resize, get new width & height of window
  ww = document.documentElement.clientWidth || document.body.clientWidth;
  wh = window.innerHeight;
  ww2 = ww * 0.5;
  wh2 = wh * 0.5;

  // Update camera aspect
  this.camera.aspect = ww / wh;
  // Reset aspect of the camera
  this.camera.updateProjectionMatrix();
  // Update size of the canvas
  this.renderer.setSize(ww, wh);
};

//The function that allows for the stent interaction - (looped)
//insert stent redraw command

Tunnel.prototype.onDocumentMouseDown = function (event){

  //INTERACTION INTRODUCTION
      //1. Add a "click to remove" statement
      //2. Remove the existing stents
      //3. Increase the segments and radii
      //4. Redraw the stent with the new parameters

     // this.audioStart();


if (clickFlag == 1 && mouseFlag == 1){

console.log("Hi, mouseFlag I'm here");

if (textRemoveFlag == 0) {

//this.stentInstructionsText = document.querySelector('#stentInstructions');
//this.stentInstructionsText.remove();
this.stentInstructionsText.style.opacity = "0.0";
textRemoveFlag = 1;

}

    this.scene.remove(this.plane);
   // this.scene.remove(this.depthLathe);

  if (blockageRadius<0.02){
   // myAnimator.noUpdate();
    this.tubeReflector.material.uniforms.speed.value = 0;

    this.scene.remove( this.depthLathe );

    blockageSegments += 1;
    blockageRadius += 0.0009;

    this.drawStent(blockageSegments, 0, 6.3, blockageRadius);

  //RESUME COMMANDS:
      //1. Get rid of lathes so they don't pop up randomly on the edges
      //2. Resume conveyor belt animation

    //console.log(latheRadius);

  }else if (blockageRadius > 0.02) {
   // this.scene.remove( this.lathe );
    this.scene.remove(this.depthLathe);
    this.tubeReflector.material.uniforms.speed.value = -0.1;
    myAnimator.update();
    doneFlag = 1;

    //Reset the animated beginning and the pop up for the next round
   // segments = 16;
   // latheRadius = 0.021;

   blockageSegments = 16;
   blockageRadius = 0.021;
   blockageCounter = 0;
   clickFlag = 0;

  }

}

}

// UPDATE THE MOUSE POSITIONS - (looped)

Tunnel.prototype.onMouseMove = function (e) {

  // Save mouse X & Y position
  this.mouse.target.x = (e.clientX - ww2) / ww2;
  this.mouse.target.y = (wh2 - e.clientY) / wh2;

  //this.setColor();

};

function Particle(scene, burst) {
        var radius = Math.random() * 0.003 + 0.0003;
      
        var changeRad = Math.random()*0.9;
        var changeWidthSeg = Math.floor(Math.random()*20);
      
        //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
        var geom = new THREE.SphereGeometry(changeRad, changeWidthSeg, 32, 0, 6.3, 0, 3.1);
        //var geom = cell.geometry;
        var range = 234;   //range of colours allowed
        var offset = burst ? 200 : 350;
        var saturate = Math.floor(Math.random()*20 + 65);
        var light = burst ? 20 : 56;
        this.color = new THREE.Color("hsl(" + (Math.abs(Math.random() * range - 200)) + ","+saturate+"%,"+light+"%)");
        var mat = new THREE.MeshPhongMaterial({
          color: this.color,
          map: textures.marble.texture
          // shading: THREE.FlatShading
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.scale.set(radius, radius, radius);
        //this.mesh.radius = (Math.random()*0.4);
        //this.mesh.widthSegments = (Math.random)*6;
        this.mesh.scale.z += (Math.random()-0.5)*0.001;
        this.mesh.position.set(0, 0, 1.5);
        this.percent = burst ? 0.2 : Math.random();
        this.burst = burst ? true : false;
        this.offset = new THREE.Vector3((Math.random() - 0.5) * 0.025, (Math.random() - 0.5) * 0.025, 0);
      
        //This multiplied number determines the max value for speed
        this.speed = Math.random() * 9; // + 0.0002;
        if (this.burst) {
          this.speed += 0.003;
          this.mesh.scale.x *= 1.4;
          this.mesh.scale.y *= 1.4;
          this.mesh.scale.z *= 1.4;
        }
        this.rotate = new THREE.Vector3(-Math.random() * 0.1 + 0.01, 0, Math.random() * 0.01);
      
        this.pos = new THREE.Vector3(0, 0, 0);
};

Particle.prototype.update = function(tunnel) {
      
        this.percent += this.speed * (this.burst ? 1 : tunnel.speed);
      
        this.pos = tunnel.curve.getPoint(1 - (this.percent % 1)).add(this.offset);
        this.mesh.position.x = this.pos.x;
        this.mesh.position.y = this.pos.y;
        this.mesh.position.z = this.pos.z;
        this.mesh.rotation.x += this.rotate.x;
        this.mesh.rotation.y += this.rotate.y;
        this.mesh.rotation.z += this.rotate.z;
      
        this.mesh.position.z -= 0.02;
      
};

// RENDER FUNCTION - (looped)
Tunnel.prototype.render = function () {

  //SPACEBAR NOT PRESSED - DEFAULT STATE
  // Update material offset
  //this is the thing that makes the walls look like they're moving towards you
  //this.updateMaterialOffset();

 // let stentFlag = 1;

// if ((THREE.Clock() - clock) > 10){
 //}

  //this will get changed when the animation changes
  delta = clock.getDelta();

	//var delta = clock.getDelta(); 

 // console.log(clock.elapsedTime);

//	myAlphaAnimator.update(-(100 * delta));
	myAnimator.update(200 * delta);

  //this.animateLathe();

  //console.log(clock.getElapsedTime() - myTime);
 //console.log(myTime);
 //console.log(clock.getElapsedTime());


  if (clock.getElapsedTime() - myTime > 23){
    //console.log("I'm in!")

    if (latheFlag == 0){

      this.scene.remove(this.depthLathe);
      this.drawStent(blockageSegments, 0, 6.3, blockageRadius);

      latheFlag = 1;            //this is to avoid redrawing every time it loops
      blockageCounter += 1;     //adds time
      blockageSegments -= 1;    //adds segments
      blockageRadius -= 0.0009; //subtracts radius
    }
    
    if (clock.getElapsedTime() - myTime > 23 + blockageCounter){
      if (blockageSegments>2){
      latheFlag = 0;
      }
    }

    if (blockageSegments == 2  && rectangleFlag == 1){

      this.tubeReflector.material.uniforms.speed.value = 0;

      //The Dark Plane

      this.planeGeometry = new THREE.PlaneGeometry( 1, 1, 2, 2 );
      this.planeMaterial = new THREE.MeshBasicMaterial( {
        color: 0x000000,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      } );

      this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );
     
      this.plane.position.z = 0.03;
      this.plane.position.x = 0;
      this.plane.rotateZ( Math.PI / 2);
     
      this.scene.add(this.plane);

      //INSERT TEXT HERE
      this.stentInstructionsText = document.getElementById("stentInstructions");
      //this.instructionPopUp.add(),
      this.stentInstructionsText.style.opacity = "1.0";

      mouseFlag = 1;
      doneFlag = 1;
      latheFlag = 0;
      rectangleFlag = 1;
      clickFlag = 1;


    }

    //THIS IS WHERE THE CODE REFERENCES THE DONE FLAG SECTION
    
    if (doneFlag == 1){
      //clock = clock;
      myTime = clock.getElapsedTime();
      textRemoveFlag = 0;
      doneFlag = 0;
    }

  }

  

  //console.log(clock.getElapsedTime() - myTime);

  // Update camera position & rotation
  // This is super necessary because otherwise it does a really weird thing where half the thing is grey
  this.updateCameraPosition();

  // Move the probe and the rotating sphere
  this.probeMotion();

  // Update the color of the tunnel
  this.setColor();

  // Update the mouse control to change the curve of the tunnel thing
  this.updateCurve();

  for (var i = 0; i < this.particles.length; i++) {
    this.particles[i].update(this);
    if (this.particles[i].burst && this.particles[i].percent > 1) {
      this.particlesContainer.remove(this.particles[i].mesh);
      this.particles.splice(i, 1);
      i--;
    }
  }

  this.tubeReflectorMaterial.uniforms.time.value = clock.getElapsedTime();

  // render the scene
  this.renderer.render(this.scene, this.camera);

  // Animation loop
  window.requestAnimationFrame(this.render.bind(this));

};

// UPDATE THE CAMERA POSITION - (looped)

Tunnel.prototype.updateCameraPosition = function () {

  //THE BLOCK OF CODE THAT MOVES THE CURVE BASED ON MOUSE

  // Update the mouse position with some lerp
  // This is the thing that makes the camera swish around - the number at the end is the speed/jerkiness of the change
  this.mouse.position.x += (this.mouse.target.x - this.mouse.position.x) / 100;
  this.mouse.position.y += (this.mouse.target.y - this.mouse.position.y) / 100;

  // Rotate Z & Y axis
  this.camera.rotation.z = this.mouse.position.x * 0.02;
  this.camera.rotation.y = Math.PI - this.mouse.position.x * 0.006;

  // Move a bit the camera horizontally & vertically
  this.camera.position.x = this.mouse.position.x * 0.01;
  this.camera.position.y = -this.mouse.position.y * 0.01;

  //console.log(this.camera.position.y);

  //IF SPACEBAR PRESSED IS TRUE

  // this.camera.rotation.x += 0.002 * ( -this.mouse.target.y - this.camera.rotation.x );
  // this.camera.rotation.y += 0.002 * ( -this.mouse.target.x - this.camera.rotation.y );

  // const target = new THREE.Vector2();

  // target.x = ( 1 - this.mouse.target.x ) * 0.08;
  // target.y = ( 1 - this.mouse.target.y ) * 0.08;
  
  // this.camera.rotation.x += 0.5 * ( target.y - this.camera.rotation.x );
  // this.camera.rotation.y += 0.5 * ( target.x - this.camera.rotation.y );

};

// PROBE UPDATE FUNCTION - LOOPED

Tunnel.prototype.probeMotion = function (){

  this.particleLight.position.x = THREE.Math.mapLinear(-this.mouse.target.x, -1, 1, -0.011, 0.011);
  this.particleLight.position.y = THREE.Math.mapLinear(this.mouse.target.y, -1, 1, -0.011, 0.011);
  this.particleLight.position.z = 0.23;

  //console.log(this.particleLight.position.y);

  this.probeHull.position.x = THREE.Math.mapLinear(-this.mouse.target.x, -1, 1, -0.011, 0.011);
  this.probeHull.position.y = THREE.Math.mapLinear(this.mouse.target.y, -1, 1, -0.011, 0.011);
  this.probeHull.position.z = 0.23;

  this.particleLight.rotation.y += 0.06;

  this.probeHull.rotation.z += 0.2;
  this.probeHull.rotation.x += 0.002;  
  //particleLight.rotation.z += 0.06;

  //console.log(this.probeHull.rotation.x);

}

// MATERIALS UPDATE FUNCTION - (looped)

Tunnel.prototype.setColor = function () {

  this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);
  this.tubeReflector = new THREE.Mesh(this.tubeReflectorGeometry, this.tubeReflectorMaterial);
  this.lathe = new THREE.Mesh( this.latheGeometry, this.latheMaterial );

  //MOUSE MOVE

  let xdist1 = sectionFive - Math.abs(this.mouse.target.x);
  let ydist1 = sectionFive - Math.abs(this.mouse.target.y);
  let dist1 = Math.min(xdist1, ydist1);

  //NOISESCALE SHIFT

  let noiseX = (noiseX0 + (noiseX5 - noiseX0) / (sectionFive - centerPoint) * ((sectionFour - centerPoint) - dist1));

  let noiseY = (noiseY0 + (noiseY5 - noiseY0) / (sectionFive - centerPoint) * ((sectionFive - centerPoint) - dist1));

  let noiseZ = (noiseZ0 + (noiseZ5 - noiseZ0) / (sectionFive - centerPoint) * ((sectionFive - centerPoint) - dist1));

  //implement noisescale shift
  this.tubeReflector.material.uniforms.noiseScale.value = new THREE.Vector3(noiseX, noiseY, noiseZ);

  // FREQUENCY SHIFT

  let frequency = (startFrequency + (endFrequency - startFrequency) / (sectionFive - centerPoint) * ((sectionFive - centerPoint) - dist1));

  this.oscillator.frequency.setValueAtTime(frequency, this.frequencyShift.context.currentTime);

  //INTENSITY SHIFT

  if (this.mouse.target.x >= -centerBoxBoundary && this.mouse.target.x <= centerBoxBoundary && this.mouse.target.y >= -centerBoxBoundary && this.mouse.target.y <= centerBoxBoundary) {

    let xdist = centerBoxBoundary - Math.abs(this.mouse.target.x);
    let ydist = centerBoxBoundary - Math.abs(this.mouse.target.y);
    let dist = Math.min(xdist, ydist);

  let intensityShiftInner = (intensityStart + (intensityMid - intensityStart) / (centerBoxBoundary - centerPoint) * ((centerBoxBoundary - centerPoint) - dist1));

  this.tubeReflector.material.uniforms.intensity.value = (intensityShiftInner);

  } else {

    let xdist1 = sectionFive - Math.abs(this.mouse.target.x);
    let ydist1 = sectionFive - Math.abs(this.mouse.target.y);
    let dist1 = Math.min(xdist1, ydist1);

    let intensityShiftOuter = (intensityMid + (intensityFinal - intensityMid) / (sectionFive - centerBoxBoundary) * ((sectionFive - centerBoxBoundary) - dist1));

    this.tubeReflector.material.uniforms.intensity.value = (intensityShiftOuter);

  }

  // CENTER BOX

  if (this.mouse.target.x >= -centerBoxBoundary && this.mouse.target.x <= centerBoxBoundary && this.mouse.target.y >= -centerBoxBoundary && this.mouse.target.y <= centerBoxBoundary) {

    let xdist = centerBoxBoundary - Math.abs(this.mouse.target.x);
    let ydist = centerBoxBoundary - Math.abs(this.mouse.target.y);
    let dist = Math.min(xdist, ydist);

    //ColorGradient calculated on mouse distance to each box boundary

    let Hue = (hue0 + (hue1 - hue0) / (centerBoxBoundary - centerPoint) * ((centerBoxBoundary - centerPoint) - dist));

    let Sat = (sat0 + (sat1 - sat0) / (centerBoxBoundary - centerPoint) * ((centerBoxBoundary - centerPoint) - dist));

    let Lgt = (light0 + (light1 - light0) / (centerBoxBoundary - centerPoint) * ((centerBoxBoundary - centerPoint) - dist));

    //implement the color shift on the voronoi texture and the main tunnel
    this.tubeReflector.material.uniforms.color.value.setHSL(Hue, Sat, Lgt);
    this.tubeMesh.material.color.setHSL(Hue, Sat, Lgt);
    this.lathe.material.color.setHSL(Hue, Sat, Lgt);

  }

  //BOX TWO
  else if (this.mouse.target.x >= -sectionTwo && this.mouse.target.x <= sectionTwo && this.mouse.target.y >= -sectionTwo && this.mouse.target.y <= sectionTwo) {

    let xdist = sectionTwo - Math.abs(this.mouse.target.x);
    let ydist = sectionTwo - Math.abs(this.mouse.target.y);
    let dist = Math.min(xdist, ydist);

    //ColorGradient calculated on mouse distance to each box boundary

    let Hue = (hue1 + (hue2 - hue1) / (sectionTwo - centerBoxBoundary) * ((sectionTwo - centerBoxBoundary) - dist));

    let Sat = (sat1 + (sat2 - sat1) / (sectionTwo - centerBoxBoundary) * ((sectionTwo - centerBoxBoundary) - dist));

    let Lgt = (light1 + (light2 - light1) / (sectionTwo - centerBoxBoundary) * ((sectionTwo - centerBoxBoundary) - dist));

    //implement the color shift on the voronoi texture and the main tunnel
    this.tubeReflector.material.uniforms.color.value.setHSL(Hue, Sat, Lgt);
    this.tubeMesh.material.color.setHSL(Hue, Sat, Lgt);
    this.lathe.material.color.setHSL(Hue, Sat, Lgt);

  }

  //BOX THREE
  else if (this.mouse.target.x >= -sectionThree && this.mouse.target.x <= sectionThree && this.mouse.target.y >= -sectionThree && this.mouse.target.y <= sectionThree) {

    let xdist = sectionThree - Math.abs(this.mouse.target.x);
    let ydist = sectionThree - Math.abs(this.mouse.target.y);
    let dist = Math.min(xdist, ydist);

    let Hue = (hue2 + (hue3 - hue2) / (sectionThree - sectionTwo) * ((sectionThree - sectionTwo) - dist));

    let Sat = (sat2 + (sat3 - sat2) / (sectionThree - sectionTwo) * ((sectionThree - sectionTwo) - dist));

    let Lgt = (light2 + (light3 - light2) / (sectionThree - sectionTwo) * ((sectionThree - sectionTwo) - dist));

    //HSL backwards travelling
    let backwardsHue = Math.abs(((Hue % 359) + 359) % 359);

    //implement the color shift on the voronoi texture and the main tunnel
    this.tubeReflector.material.uniforms.color.value.setHSL(backwardsHue, .5, .5);
    this.tubeMesh.material.color.setHSL(backwardsHue, 0.5, 0.5);
    this.lathe.material.color.setHSL(backwardsHue, 0.5, 0.5);

  }

  //BOX FOUR
  else if (this.mouse.target.x >= -sectionFour && this.mouse.target.x <= sectionFour && this.mouse.target.y >= -sectionFour && this.mouse.target.y <= sectionFour) {

    let xdist = sectionFour - Math.abs(this.mouse.target.x);
    let ydist = sectionFour - Math.abs(this.mouse.target.y);
    let dist = Math.min(xdist, ydist);

    let Hue = Math.abs((hue32 + (hue4 - hue32) / (sectionFour - sectionThree) * ((sectionFour - sectionThree) - dist)));

    let Sat = (sat3 + (sat4 - sat3) / (sectionFour - sectionThree) * ((sectionFour - sectionThree) - dist));

    let Lgt = (light3 + (light4 - light3) / (sectionFour - sectionThree) * ((sectionFour - sectionThree) - dist));

    let backwardsHue = Math.abs(((Hue % 359) + 359) % 359);

    //implement the color shift on the voronoi texture and the main tunnel
    this.tubeReflector.material.uniforms.color.value.setHSL(backwardsHue, 0.5, 0.5);
    this.tubeMesh.material.color.setHSL(backwardsHue, 0.5, 0.5);
    this.lathe.material.color.setHSL(backwardsHue, 0.5, 0.5);

  }
}

// UPDATE THE CURVE ON MOUSE MOTION - (looped)

Tunnel.prototype.updateCurve = function () {

  var index = 0,
    vertice_o = null,
    vertice = null;

  // For each vertice of the tube, move it a bit based on the spline
  for (var i = 0, j = this.tubeGeometry.vertices.length; i < j; i += 1) {
    // Get the original tube vertice
    vertice_o = this.tubeGeometry_o.vertices[i];
    // Get the visible tube vertice
    vertice = this.tubeGeometry.vertices[i];
    // Calculate index of the vertice based on the Z axis
    // The tube is made of 50 rings of vertices
    index = Math.floor(i / radialSegments);
    // Update tube vertice
    vertice.x +=
      (vertice_o.x + this.splineMesh.geometry.vertices[index].x - vertice.x) /
      10;
    vertice.y +=
      (vertice_o.y + this.splineMesh.geometry.vertices[index].y - vertice.y) /
      100;
  }

  // Warn ThreeJs that the points have changed
  this.tubeGeometry.verticesNeedUpdate = true;
  this.tubeMesh.material.needsUpdate = true;

  // Update the points along the curve base on mouse position
  this.curve.points[2].x = -this.mouse.position.x * 0.1;
  //this.curve.points[4].x = -this.mouse.position.x * 0.1;
  this.curve.points[2].y = this.mouse.position.y * 0.1;

  // Warn ThreeJs that the spline has changed
  this.splineMesh.geometry.verticesNeedUpdate = true;
  this.splineMesh.geometry.vertices = this.curve.getPoints(70);


};
