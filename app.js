// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------

// Create an empty scene
var scene = new THREE.Scene();

// Set scene background to stars
scene.background = new THREE.CubeTextureLoader()
  .setPath( 'textures/stars/' )
  .load( [ 'stars.jpg', 'stars.jpg', 'stars.jpg', 'stars.jpg', 'stars.jpg', 'stars.jpg' ] );

// Create a basic perspective camera
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 50000 );

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true});


var cameraControls = new THREE.OrbitControls ( 
    camera, renderer.domElement
);

function handleCameraChange(){
    cameraControls.addEventListener("change",
        function(){
            camera.updateProjectionMatrix();
            render();
        }
    );  
}

// Configure renderer clear color
renderer.setClearColor("#000000");

// Configure renderer size
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );

// Append Renderer to DOM
document.body.appendChild( renderer.domElement );

window.onresize = function(){
  console.log("Window size: "+window.innerWidth+"x"+window.innerHeight+"px");
  renderer.setSize(window.innerWidth,window.innerHeight);
  var aspectRatio = window.innerWidth/window.innerHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
}

// GUI setup
var guiObject = {};
var guiController = new dat.GUI();

// Stats
stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );

// ------------------------------------------------
// Scene Setup
// ------------------------------------------------

var earthSize = 5,
    moonSize = earthSize * .25,
    sunSize = earthSize * 3,
    initEarthSunDistance = sunSize*3.75,
    currDistance = initEarthSunDistance;

// camera.position.x = sunSize*2
camera.position.y = sunSize*5
camera.position.z = sunSize*8;
camera.lookAt(scene.position);


// Create a Sun
var radius = sunSize, segments = 30, rings = 30;
var geometry = new THREE.SphereBufferGeometry(radius, segments, rings);
// create the sun's material uniforms
var uniforms = {
    map: {
        type: "t", // a Sampler2D
        value: new THREE.TextureLoader().load("sun-map-reg.jpg",function(texture){render();}) 
    },
    bumpmap: {
        type: "t", // a Sampler2D
        value: new THREE.TextureLoader().load("sun-map-bump.jpg",function(texture){render();}) 
    },
}

// create the sun's material
var material = new THREE.RawShaderMaterial({
    uniforms:       uniforms,
    vertexShader:   document.getElementById('sunVertexShader' ).textContent,
    fragmentShader: document.getElementById( 'sunFragShader' ).textContent 
});
var sun = new THREE.Mesh( geometry, material );

// Add sun to Scene
scene.add( sun );

// Create Earth
radius = earthSize;
geometry = new THREE.SphereBufferGeometry(radius, segments, rings);
var earth = new THREE.Mesh( geometry, material );
var lDirect = new THREE.Vector3();

// Add earth to Scene
scene.add( earth );

// create the earth's material uniforms
uniforms = {
    lightDirection: { 
        type: 'vec3', 
        value: earth.position,
    },
    intensity: { 
        type: 'vec3', 
        value: new THREE.Vector3(1, 1, 1)
    },
    percentDistance: { 
        type: 'f', 
        value: 1,
    },
    map: {
        type: "t", // a Sampler2D
        value: new THREE.TextureLoader().load("earth-map-reg.jpg",function(texture){render();}) 
    },
    bumpmap: {
        type: "t", // a Sampler2D
        value: new THREE.TextureLoader().load("earth-map-bump.jpg",function(texture){render();}) 
    },
}
console.log(uniforms);

// create the earth's material
material = new THREE.RawShaderMaterial({
    uniforms:       uniforms,
    vertexShader:   document.getElementById('earthVertexShader' ).textContent,
    fragmentShader: document.getElementById( 'earthFragShader' ).textContent 
});
earth.material = material;

var earthAxis = new THREE.Vector3(0.5,0.5,0);
var rotationSpeed = 1;

// Create Earth Orbit
var orbit = new THREE.EllipseCurve(
    0,  0,            // ax, aY
    initEarthSunDistance*1.06, initEarthSunDistance,           // xRadius, yRadius
    0,  2 * Math.PI,  // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
);
var orbitSpeed = 1;

// Add earth GUI
guiObject.earth = {
  rotationSpeed: rotationSpeed,
  orbitSpeed: orbitSpeed,
  distance: 1
};
var earthFolder = guiController.addFolder("Earth");
earthFolder.add(guiObject.earth,"rotationSpeed") 
  .min(0).max(3).step(.01)
  .name("Rotation Speed")
  .onChange(function(val){
    rotationSpeed = val;
  });
earthFolder.add(guiObject.earth,"orbitSpeed") 
  .min(0).max(3).step(.01)
  .name("Orbit Speed")
  .onChange(function(val){
    orbitSpeed = val;
  });
earthFolder.add(guiObject.earth,"distance") 
  .min(0).max(2).step(.01)
  .name("Distance from Sun")
  .onChange(function(val){
    orbit.xRadius = initEarthSunDistance*1.06*val;
    orbit.yRadius = initEarthSunDistance*val;
    currDistance = initEarthSunDistance*val;
    console.log((initEarthSunDistance-currDistance)/initEarthSunDistance);
  });




// function updateCamera() {
//   camera.position.x = earth.position.x + 4;
//   camera.position.y = earth.position.y + .75;
//   camera.position.z = earth.position.z + 1.25;
//   camera.lookAt(earth.position);
// }

// updateCamera();




// ------------------------------------------------
// Render
// ------------------------------------------------

// Render Loop
var orbitPosition = 0;
var clock = new THREE.Clock();
var delta = 0;
var daySpeed = 1/365;

var render = function () {
  requestAnimationFrame( render );
  stats.update();

  delta = clock.getDelta() * 30;

  // Move Earth around orbit
  orbitPosition = (orbitPosition + (delta * daySpeed * orbitSpeed)) % 1
  let orbitPoint = orbit.getPoint(orbitPosition)
  earth.position.x = orbitPoint.x
  earth.position.z = orbitPoint.y
  earth.material.uniforms.lightDirection.value = earth.position;

  // Rotate Earth
  earth.rotation.y += (delta * daySpeed * orbitSpeed * rotationSpeed)*24;

  // Rotate Sun
  sun.rotation.y += (delta * daySpeed * orbitSpeed * rotationSpeed);

  // Update Color 
  earth.material.uniforms.percentDistance.value = (initEarthSunDistance-(earth.position.distanceTo(sun.position)))/initEarthSunDistance*-1.0;

  // Render the scene
  renderer.render(scene, camera);
};

render();