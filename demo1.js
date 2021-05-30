//IMPORTS

//import * as THREE from './js/vendors/three.module.js';
import Stats from './js/stats.module.js';
import {
  GUI
} from './build/dat.gui.module.js';
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


var rotationTest = Math.PI/9;

var offsetTest = 0.0;

var myAnimator, myAlphaAnimator;

// TEXTURE

var clock = new THREE.Clock();
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
var intensityMid = -5.0;
var intensityMid2 = 3.0;
var intensityFinal = 7.0;

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


// CONSTRUCTOR FUNCTION - (not looped)

function Tunnel(cell) {
  
  window.cell = cell.children[0];

  // Init the scene and the
  this.init();

  // Create the shape of the tunnel
  this.createMesh();

  this.curveGeo();

  //CylinderGeometry(radiusTop : Float, radiusBottom : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
// const geometry = new THREE.CylinderGeometry( 0.0005, 0.0005, 1.2, 32 );
// const material = new THREE.MeshBasicMaterial( {color: 0x000000} );
// cylinder = new THREE.Mesh( geometry, material );
// cylinder.rotation.x = (90 * Math.PI) / 180;

// this.scene.add( cylinder );

  // Create the shape of the guideRail
  this.createTrackMesh();

  // Mouse events & window resize
  this.handleEvents();

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
	
  this.audioStart();

  // Create a camera and move it along Z axis
  this.camera = new THREE.PerspectiveCamera(15, ww / wh, 0.01, 1000);
  this.camera.position.z = 0.01;

  // Create an empty scene and define a fog for it
  //https://threejsfundamentals.org/threejs/lessons/threejs-fog.html
  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.Fog(0x000000, 0.6, 2.8);

  this.addParticle();

  // set up controls
  //gui(uniforms);

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
    sound.setVolume(10);
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
  // for (var i = 0; i < (isMobile ? 70 : 150); i++) {
  //   var particle = new Particle(this.scene);
  //   this.particles.push(particle);
  //   this.particlesContainer.add(particle.mesh);
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
  this.tubeGeometry = new THREE.TubeGeometry(this.curve, 70, radiusShift, radialSegments, false);
  // Create a mesh based on the tube geometry and its material


  // MOVING TUNNEL

  // MESH STANDARD MATERIAL - HIGH REFLECTIVITY

  var tunnelTexture = new THREE.TextureLoader().load('img/demo1/tunnelSized.jpg');
  myAnimator = new TextureAnimator( tunnelTexture, 1, 23, 45, 55 ); // texture, #horiz, #vert, #total, duration.

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
  this.scene.add(this.tubeReflector)

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

  //this.tubeMaterial.alphaMap.magFilter = THREE.NearestFilter;
  this.tubeMesh.material.alphaMap.wrapS = THREE.RepeatWrapping;
  this.tubeMesh.material.alphaMap.wrapT = THREE.RepeatWrapping;
  //this.tubeMaterial.alphaMap.repeat.set(30, 6);
  //this.tubeMaterial.alphaMap.repeat.y = 1;


  //PointLight( color : Integer, intensity : Float, distance : Number, decay : Float )
  var endOfTunnelLight = new THREE.PointLight(0xffffff, 0.8, 7, 9);
  endOfTunnelLight.position.x = 0;
  endOfTunnelLight.position.y = 0;
  endOfTunnelLight.position.z = 3;

  this.scene.add(endOfTunnelLight);

  this.light();

};

// CREATE TUNNEL

Tunnel.prototype.createTrackMesh = function () {

  // CREATE THE GEOMETRY
  
  //POSSIBLY ADD PERLIN NOISE ALGORITHM TO "PULSE" THE TUNNEL LIKE A HEARTBEAT
  
    // Empty array to store the points along the path
    // var trackPoints = [];
  
    // // Define points along Z axis to create a curve
    // for (var i = 0; i < 5; i += 1) {
    //   trackPoints.push(new THREE.Vector3(0, 0, 1.0 * (i / 4)));
    // }
  
    // // Set custom Y position for the last point
    // trackPoints[4].y = -0.01;
  
    // Create a curve based on the points and define curve type
    this.trackCurve = new THREE.CatmullRomCurve3([
      //new THREE.Vector3( this.particleLight.x, this.particleLight.y, this.particleLight.z ),
      new THREE.Vector3( -0.10, 0, 0.10 ),
      new THREE.Vector3( -0.5, 0.5, 0.5 ),
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( 0.5, -0.5, 0.5 ),
      new THREE.Vector3( 0.10, 0, 0.10 )
    ]);
  
    // Empty geometry
    var trackGeometry = new THREE.Geometry();
    // Create vertices based on the curve
    trackGeometry.vertices = this.trackCurve.getPoints(70);

    // Create a line from the points with a basic line material
    this.trackSplineMesh = new THREE.Line(trackGeometry, new THREE.LineBasicMaterial());
  
    // Create a tube geometry based on the curve
  
    //TubeGeometry(path : Curve, tubularSegments : Integer, radius : Float, radialSegments : Integer, closed : Boolean)
    this.trackTubeGeometry = new THREE.TubeGeometry(this.trackCurve, 70, 0.01, 60, false);
    // Create a mesh based on the tube geometry and its material
  
  
    // MOVING TUNNEL
  
    // MESH STANDARD MATERIAL - HIGH REFLECTIVITY
  
    this.trackMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.2,
      roughness: 0.5,
      color: 0x000000,
      wireframe: false,
      side: THREE.DoubleSide,
    });
  
    this.trackMesh = new THREE.Mesh(this.trackTubeGeometry, this.trackMaterial);

    //PUSH TUBES ONTO SCENE
  
    this.scene.add(this.trackMesh);
  
    // Clone the original tube geometry for the mouse motion
    this.trackTubeGeometry_o = this.trackTubeGeometry.clone();
  
  };

// INITIALISE EVENT HANDLING FUNCTION - (not looped)

Tunnel.prototype.handleEvents = function () {

  // I think what's happening here is that the event is a seperate thing outside the main (noloop)/(loop) structure that conditionally calls the resize and mouse positions after it notices that 
  // https://threejs.org/docs/#api/en/core/EventDispatcher.addEventListener
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
    "spaceBarPressed",
    this.spaceBarPressed,
    false
  )

};

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

// UPDATE THE MOUSE POSITIONS - (looped)

Tunnel.prototype.onMouseMove = function (e) {

  // Save mouse X & Y position
  this.mouse.target.x = (e.clientX - ww2) / ww2;
  this.mouse.target.y = (wh2 - e.clientY) / wh2;

  //console.log("X:" + this.mouse.target.x);
  //console.log("Y:" + this.mouse.target.y);

};

// CHANGE SPACEBAR STATE - (not yet added)

Tunnel.prototype.spaceBarPressed = function (event) {
  var keyCode = event.which;

  // IF SPACEBAR IS PRESSED, EXPLORE
  if (keyCode == 32) {
    this.camera.rotation.x += 0.002 * ( -this.mouse.target.y - this.camera.rotation.x );
    this.camera.rotation.y += 0.002 * ( -this.mouse.target.x - this.camera.rotation.y );
  } 
  
  //
  
  else {
    this.mouse.position.x += (this.mouse.target.x - this.mouse.position.x) / 100;
    this.mouse.position.y += (this.mouse.target.y - this.mouse.position.y) / 100;
  
    // Rotate Z & Y axis
    this.camera.rotation.z = this.mouse.position.x * 0.02;
    this.camera.rotation.y = Math.PI - this.mouse.position.x * 0.006;
  
    // Move a bit the camera horizontally & vertically
    this.camera.position.x = this.mouse.position.x * 0.01;
    this.camera.position.y = -this.mouse.position.y * 0.01;
  }

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

  //IF SPACEBAR PRESSED IS TRUE

  // this.camera.rotation.x += 0.002 * ( -this.mouse.target.y - this.camera.rotation.x );
  // this.camera.rotation.y += 0.002 * ( -this.mouse.target.x - this.camera.rotation.y );

  // const target = new THREE.Vector2();

  // target.x = ( 1 - this.mouse.target.x ) * 0.08;
  // target.y = ( 1 - this.mouse.target.y ) * 0.08;
  
  // this.camera.rotation.x += 0.5 * ( target.y - this.camera.rotation.x );
  // this.camera.rotation.y += 0.5 * ( target.x - this.camera.rotation.y );

};

// UPDATE THE MATERIAL OFFSET - (looped)

Tunnel.prototype.updateMaterialOffset = function () {

  // Update the offset of the material
 // this.tubeMaterial.map.offset.set(offsetTest/2, 0.0);
    //+=  ) this.speed;
  //this.tubeMaterial.alphaMap.offset.set(-offsetTest/2, 0.0);

 // this.tubeMaterial.alphaMap.updateMatrix();

};

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
      5;
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

// UPDATE THE TRACK CURVE ON MOUSE MOTION - (not yet added)

Tunnel.prototype.trackUpdateCurve = function () {

  var trackIndex = 0,
    trackVertice_o = null,
    trackVertice = null;

  // For each vertice of the tube, move it a bit based on the spline
  for (var i = 0, j = this.trackTubeGeometry.vertices.length; i < j; i += 1) {
    // Get the original tube vertice
    trackVertice_o = this.trackTubeGeometry_o.vertices[i];
    // Get the visible tube vertice
    trackVertice = this.trackTubeGeometry.vertices[i];

    this.trackTubeGeometry.vertices[1].z = -0.2; 
    this.trackTubeGeometry.vertices[1].y = -0.004; 
    this.trackTubeGeometry.vertices[1].x = 0; 

    // Calculate index of the vertice based on the Z axis
    // The tube is made of 50 rings of vertices
    trackIndex = Math.floor(i / 70);
    // Update tube vertice
    trackVertice.x +=
      (trackVertice_o.x + this.trackSplineMesh.geometry.vertices[trackIndex].x - trackVertice.x) /
      10;
    trackVertice.y +=
      (trackVertice_o.y + this.trackSplineMesh.geometry.vertices[trackIndex].y - trackVertice.y) /
      5;
  }

  // Warn ThreeJs that the points have changed
  this.trackTubeGeometry.verticesNeedUpdate = true;
  this.trackMesh.material.needsUpdate = true;

  // Update the points along the curve base on mouse position
  this.trackCurve.points[2].x = -this.mouse.position.x * 0.1;
  //this.curve.points[4].x = -this.mouse.position.x * 0.1;
  this.trackCurve.points[2].y = this.mouse.position.y * 0.1;

  // Warn ThreeJs that the spline has changed
  this.trackSplineMesh.geometry.verticesNeedUpdate = true;
  this.trackSplineMesh.geometry.vertices = this.curve.getPoints(70);


};

// MATERIALS UPDATE FUNCTION - (looped)

Tunnel.prototype.setColor = function () {

  this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);
  this.tubeReflector = new THREE.Mesh(this.tubeReflectorGeometry, this.tubeReflectorMaterial);

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
  let intensityShift = (intensityStart + (intensityFinal - intensityStart) / (sectionFive - centerPoint) * ((sectionFive - centerPoint) - dist1));

  this.tubeReflector.material.uniforms.intensity.value = (intensityShift);

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

  }

  //BOX FOUR
  else if (this.mouse.target.x >= -sectionFour && this.mouse.target.x <= sectionFour && this.mouse.target.y >= -sectionFour && this.mouse.target.y <= sectionFour) {

    let xdist = sectionFour - Math.abs(this.mouse.target.x);
    let ydist = sectionFour - Math.abs(this.mouse.target.y);
    let dist = Math.min(xdist, ydist);

    let Hue = (hue32 + (hue4 - hue32) / (sectionFour - sectionThree) * ((sectionFour - sectionThree) - dist));

    let Sat = (sat3 + (sat4 - sat3) / (sectionFour - sectionThree) * ((sectionFour - sectionThree) - dist));

    let Lgt = (light3 + (light4 - light3) / (sectionFour - sectionThree) * ((sectionFour - sectionThree) - dist));

    let backwardsHue = Math.abs(((Hue % 359) + 359) % 359);

    //implement the color shift on the voronoi texture and the main tunnel
    this.tubeReflector.material.uniforms.color.value.setHSL(backwardsHue, 0.5, 0.5);
    this.tubeMesh.material.color.setHSL(backwardsHue, 0.5, 0.5);

  }

  //BOX FIVE
  else if (this.mouse.target.x >= -sectionFive && this.mouse.target.x <= sectionFive && this.mouse.target.y >= -sectionFive && this.mouse.target.y <= sectionFive) {

    // let xdist = sectionFour-Math.abs(this.mouse.target.x);
    // let ydist = sectionFour-Math.abs(this.mouse.target.y);
    // let dist = Math.min(xdist, ydist);   

    // let Hue = (hue4+(hue5-hue4)/(sectionFive-sectionFour)*((sectionFive-sectionFour)-dist));

    // let Sat = (sat4+(sat5-sat4)/(sectionFive-sectionFour)*((sectionFive-sectionFour)-dist));

    // let Lgt = (light4+(light5-light4)/(sectionFive-sectionFour)*((sectionFive-sectionFour)-dist));

    // //implement the color shift on the voronoi texture and the main tunnel
    // this.tubeReflector.material.uniforms.color.value.setHSL(Hue, Sat, Lgt);
    // this.tubeMesh.material.color.setHSL(Hue, Sat, Lgt);

  }

}

// LIGHTS UPDATE FUNCTION - (INITIALISATION - NOT LOOPED, POSITION- Looped)

Tunnel.prototype.light = function () {
  this.particleLight = new THREE.Mesh(
    //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    new THREE.SphereGeometry(0.003, 40, 40),
    new THREE.MeshPhongMaterial({
      color: 0x000FFF,
      specular: 0x666666,
      emissive: 0xffffff,
      shininess: 20,
      opacity: 1,
      //metalness: 0.4,
      //emissiveIntensity : 3,
      map: textures.marble.texture,
      // //bumpMap: textures.stoneBump.texture,
    })
    //new THREE.MeshBasicMaterial( { color: 0xffffff } )
  );

  this.probeHull = new THREE.Mesh(
    //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    new THREE.SphereGeometry(0.004, 32, 32, 0, 2.7, 0, 4),
    new THREE.MeshPhongMaterial({
      color: 0x000000,
      specular: 0x666666,
      shininess: 20,
      opacity: 1,
      //map: textures.marble.texture,
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

// PROBE UPDATE FUNCTION - LOOPED

Tunnel.prototype.probeMotion = function (){

  this.particleLight.position.x = THREE.Math.mapLinear(-this.mouse.target.x, -1, 1, -0.011, 0.011);
  this.particleLight.position.y = THREE.Math.mapLinear(this.mouse.target.y, -1, 1, -0.011, 0.011);
  this.particleLight.position.z = 0.23;

  console.log(this.particleLight.position.y);

  this.probeHull.position.x = THREE.Math.mapLinear(-this.mouse.target.x, -1, 1, -0.011, 0.011);
  this.probeHull.position.y = THREE.Math.mapLinear(this.mouse.target.y, -1, 1, -0.011, 0.011);
  this.probeHull.position.z = 0.23;

  this.particleLight.rotation.x += 0.06;

  this.probeHull.rotation.x += 0.2;
  //probeHull.rotation.x += 0.2;  
  //particleLight.rotation.z += 0.06;

}

Tunnel.prototype.curveGeo = function () {

  // const randomPoints = [];

  // for ( let i = 0; i < 10; i ++ ) {

  //   randomPoints.push( new THREE.Vector3( ( i - 4.5 ) * 50, THREE.MathUtils.randFloat( - 50, 50 ), THREE.MathUtils.randFloat( - 50, 50 ) ) );

  // }

  const randomSpline = new THREE.CatmullRomCurve3( [
    new THREE.Vector3( 1, 1, 1),
    new THREE.Vector3( 0.5, 0.5, 0.5 ),
    new THREE.Vector3( 0, -2, -2 ),
    // new THREE.Vector3( 0, 0.020, - 0.060 ),
    // new THREE.Vector3( 0, - 0.0100,  -0.060 )
  ] );
  //

  const extrudeSettings2 = {
    steps: 90,
    bevelEnabled: false,
    extrudePath: randomSpline
  };


  const pts2 = [], numPts = 5;

  for ( let i = 0; i < numPts * 2; i ++ ) {

    const l = i % 2 == 1 ? 10 : 20;

    const a = i / numPts * Math.PI;

    pts2.push( new THREE.Vector2( Math.cos( a ) * l, Math.sin( a ) * l ) );

  }

  const shape2 = new THREE.Shape( pts2 );

  const geometry2 = new THREE.ExtrudeGeometry( shape2, extrudeSettings2 );

  const material2 = new THREE.MeshLambertMaterial( { color: 0xff8000, wireframe: false } );

  const mesh2 = new THREE.Mesh( geometry2, material2 );

  this.scene.add( mesh2 );
      }

// RENDER FUNCTION - (looped)
Tunnel.prototype.render = function () {

  //SPACEBAR NOT PRESSED - DEFAULT STATE
  // Update material offset
  //this is the thing that makes the walls look like they're moving towards you
  //this.updateMaterialOffset();

// cylinder.position.x = this.particleLight.position.x;
// cylinder.position.y = this.particleLight.position.y;
// cylinder.position.z = -0.4;

	var delta = clock.getDelta(); 

//	myAlphaAnimator.update(-(100 * delta));
	myAnimator.update(200 * delta);

  // Update camera position & rotation
  // This is super necessary because otherwise it does a really weird thing where half the thing is grey
  this.updateCameraPosition();

  // Move the probe and the rotating sphere
  this.probeMotion();

  // Update the color of the tunnel
  this.setColor();

  this.curveGeo();

  // Update the mouse control to change the curve of the tunnel thing
  this.updateCurve();

  // Update the track that connects to the probe
  //this.trackUpdateCurve();

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

// TEXTURE STUFF

var textures = {
  "stone": {
    url: "img/demo1/alphaMap10.png"
  },
  "stoneBump": {
    url: "img/demo1/tunnelSized.jpg"
  },
  "marble": {
    url: "img/demo1/marble2.png"
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

function checkTextures() {
  texturesLoaded++;
  if (texturesLoaded === Object.keys(textures).length) {
    document.body.classList.remove("loading");
    // When all textures are loaded, init the scene
    window.tunnel = new Tunnel();
  }
}

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
  this.color = new THREE.Color("hsl(" + (Math.random() * range - 200) + ","+saturate+"%,"+light+"%)");
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

// Particle.prototype.cube = new THREE.BoxBufferGeometry(1, 1, 1);
// Particle.prototype.sphere = new THREE.SphereBufferGeometry(1, 6, 6);
// Particle.prototype.icosahedron = new THREE.IcosahedronBufferGeometry(1, 0);
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

function init() {

  var loader = new THREE.OBJLoader();
  loader.load(
    'img/demo4/blood_cell.obj',
    function(obj) {
      window.tunnel = new Tunnel(obj);
    }
  );
}

window.onload = init;

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
			texture.offset.y = currentRow / (this.tilesVertical/9);
		}
	};
}		

// INTERACTIVITY MEASURES 

// function gui(uniforms) {
//   var gui = new dat.GUI();

//   for (key in uniforms) {
//     // Skip the time uniform as that is incremented in the render function
//     if (key !== 'time') {
//       if (uniforms[key].type == 'f') {
//         var controller = gui.add(uniforms[key], 'value').name(key);
//       } else if (uniforms[key].type == 'c') {
//         uniforms[key].guivalue = [uniforms[key].value.r * 255, uniforms[key].value.g * 255, uniforms[key].value.b * 255];
//         var controller = gui.addColor(uniforms[key], 'guivalue').name(key);
//         controller.onChange(function (value) {
//           this.object.value.setRGB(value[0] / 255, value[1] / 255, value[2] / 255);
//         });
//       } else if (uniforms[key].type == 'v3') {
//         var controllerx = gui.add(uniforms[key].value, 'x').name(key + ' X');
//         var controllery = gui.add(uniforms[key].value, 'y').name(key + ' Y');
//         var controllerz = gui.add(uniforms[key].value, 'z').name(key + ' Z');
//       }
//     }
//   }
// }
