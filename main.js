import {
  AmbientLight,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Scene,
  SphereGeometry,
  SpotLight,
  Vector3,
  WebGLCubeRenderTarget,
  CubeCamera,
  HalfFloatType,
  MeshStandardMaterial,
  Sphere,
} from 'three';

import useThree from './useThree';
import chroma from 'chroma-js';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
// import Stats from 'three/examples/jsm/libs/stats.module.js';
import { initializeApp } from 'firebase/app';

gsap.registerPlugin(Flip);
const firebaseConfig = {
  apiKey: 'AIzaSyAhnPK78zwc0Nr03VLo6tnYMCAl9Qw744M',
  authDomain: 'frank-pascal.firebaseapp.com',
  projectId: 'frank-pascal',
  storageBucket: 'frank-pascal.appspot.com',
  messagingSenderId: '357033532344',
  appId: '1:357033532344:web:891b4f71c11d38c83b0d4d',
  measurementId: 'G-7L55Z9ZM5X',
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

const { randFloat: rnd, randFloatSpread: rndFS } = MathUtils;
var distance = 25;
const isPhone = window.matchMedia('(max-width: 768px)');

let animat;
let sphere;
let iMesh;

const handleResize = (e) => {
  if (e.matches) {
    distance = 40;
  } else {
    distance = 25;
  }
};
handleResize(isPhone);

App();
function App() {
  let three;
  let scene;
  // let sphere;
  let cannon;
  // let iMesh;
  let light;
  // let animat;
  let cubeCamera;
  let cubeRenderTarget;
  const target = new Vector3();

  init();
  function init() {
    // stats = new Stats();
    // document.body.appendChild(stats.dom);
    three = useThree().init({
      canvas: document.getElementById('canvas'),
      camera_fov: 50,
      camera_pos: new Vector3(0, 0, distance),
      camera_ctrl: {
        enableDamping: true,
        dampingFactor: 0.05,
        enablePan: false,
        enableZoom: false,
        autoRotate: false,
      },
      mouse_move: true,
      mouse_raycast: true,
    });
    three.renderer.shadowMap.enabled = true;

    cubeRenderTarget = new WebGLCubeRenderTarget(64);
    cubeRenderTarget.texture.type = HalfFloatType;

    cubeCamera = new CubeCamera(1, 100, cubeRenderTarget);

    cannon = useCannon();

    initScene();
    animate();
  }

  function initScene() {
    scene = new Scene();
    scene.add(new AmbientLight(0x808080));

    light = new SpotLight(0xffffff, 0.5, 0, Math.PI / 8, 0.1);
    light.position.set(0, 50, 50);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);
    scene.add(light.target);

    animat = new MeshStandardMaterial({
      envMap: cubeRenderTarget.texture,
      color: 0x8a9afd,
      roughness: 0.3,
      metalness: 0.4,
    });
    sphere = new Mesh(new SphereGeometry(4, 24, 24), animat);
    sphere.scale.set(0, 0, 0);
    sphere.receiveShadow = true;
    scene.add(sphere);
    cannon.addMesh(sphere);

    initInstancedMesh();
  }

  function initInstancedMesh() {
    const geometry = new SphereGeometry(1, 16, 16);
    const material = new MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: true,
    });
    iMesh = new InstancedMesh(geometry, material, 100);
    iMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    iMesh.mass = 0.07;
    iMesh.castShadow = true;
    iMesh.receiveShadow = true;

    // instance matrix
    const dummy = new Object3D();
    iMesh.scales = new Float32Array(iMesh.count);
    for (let i = 0; i < iMesh.count; i++) {
      dummy.position.set(rndFS(100), rndFS(100), rndFS(100));
      dummy.updateMatrix();
      iMesh.setMatrixAt(i, dummy.matrix);
      iMesh.scales[i] = rnd(0.25, 1);
    }

    // colors
    const cscale = chroma.scale([0x6ffd58, 0x91a3d2, 0x856aa1]);
    iMesh.cscale = cscale;
    const colors = [];
    for (let i = 0; i < iMesh.count; i++) {
      const color = new Color(cscale(rnd(0, 1)).hex());
      colors.push(color.r, color.g, color.b);
    }
    iMesh.geometry.setAttribute(
      'color',
      new InstancedBufferAttribute(new Float32Array(colors), 3)
    );
    scene.add(iMesh);
    cannon.addMesh(iMesh);

    // custom gravity
    const v = new Vector3();
    iMesh.bodies.forEach((body) => {
      body.preStep = () => {
        v.copy(target)
          .sub(body.position)
          .normalize()
          .multiplyScalar(0.5);
        v.clampScalar(-0.5, 0.5);
        body.force.copy(v);
      };
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    target.copy(three.mouseV3);
    cannon.step();
    // stats.update();
    render();
  }

  function render() {
    const { renderer, camera, cameraCtrl } = three;
    if (cameraCtrl) cameraCtrl.update();
    cubeCamera.update(renderer, scene);
    renderer.render(scene, camera);
  }

  let tl1 = gsap.timeline({});
  window.addEventListener('load', () => {
    tl1.to(sphere.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.5,
      ease: 'bounce',
      onComplete: () => {
        sphere.matrixAutoUpdate = false;
      },
    }),
      tl1.fromTo(
        '.title',
        { y: 300, scale: 0.1 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power1.inOut',
        },
        '-=1.5'
      ),
      tl1.fromTo(
        '.menu1, .menu2, .menu3, .contact',
        { y: -300, scale: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          stagger: 0.3,
          duration: 1,
          ease: 'power1.inOut',
        },
        '-=1.5'
      );
  });
}

/**
 * From https://github.com/mrdoob/three.js/blob/master/examples/jsm/physics/CannonPhysics.js
 */
function useCannon() {
  const world = new CANNON.World();
  world.gravity.set(0, 0, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 20;

  const meshes = [];

  const obj = {
    world,
    addMesh,
    step,
  };

  function addMesh(mesh) {
    const shape = getShape(mesh.geometry);
    if (shape) {
      if (mesh.isInstancedMesh) {
        handleInstancedMesh(mesh, shape);
      } else if (mesh.isMesh) {
        handleMesh(mesh, shape);
      }
    }
  }

  function step(mesh) {
    world.step(1 / 60);
    for (let i = 0, l = meshes.length; i < l; i++) {
      const mesh = meshes[i];
      if (mesh.isInstancedMesh) {
        const iMatrix = mesh.instanceMatrix.array;
        const bodies = mesh.bodies;
        for (let j = 0; j < bodies.length; j++) {
          const body = bodies[j];
          compose(
            body.position,
            body.quaternion,
            mesh.scales[j],
            iMatrix,
            j * 16
          );
        }
        mesh.instanceMatrix.needsUpdate = true;
      } else if (mesh.isMesh) {
        mesh.position.copy(mesh.body.position);
        mesh.quaternion.copy(mesh.body.quaternion);
      }
    }
  }

  function getShape(geometry) {
    const parameters = geometry.parameters;
    switch (geometry.type) {
      case 'BoxBufferGeometry':
        const boxParams = new CANNON.Vec3();
        boxParams.x = parameters.width / 2;
        boxParams.y = parameters.height / 2;
        boxParams.z = parameters.depth / 2;
        return new CANNON.Box(boxParams);

      case 'PlaneBufferGeometry':
        return new CANNON.Plane();

      case 'SphereGeometry':
        return new CANNON.Sphere(parameters.radius);

      case 'CylinderBufferGeometry':
        return new CANNON.Cylinder(
          parameters.radiusTop,
          parameters.radiusBottom,
          parameters.height,
          parameters.radialSegments
        );
    }
    return null;
  }

  function handleMesh(mesh, shape) {
    const position = new CANNON.Vec3();
    position.copy(mesh.position);

    const quaternion = new CANNON.Quaternion();
    quaternion.copy(mesh.quaternion);

    const body = new CANNON.Body({
      position,
      quaternion,
      mass: mesh.mass,
      shape,
    });
    world.addBody(body);

    if (mesh.mass > 0) {
      mesh.body = body;
      meshes.push(mesh);
    }
  }

  function handleInstancedMesh(mesh, shape) {
    const iMatrix = mesh.instanceMatrix.array;
    const bodies = [];
    for (let i = 0; i < mesh.count; i++) {
      const index = i * 16;

      const position = new CANNON.Vec3();
      position.set(
        iMatrix[index + 12],
        iMatrix[index + 13],
        iMatrix[index + 14]
      );

      // handle instance scale
      const scale = mesh.scales[i];
      const geoParams = mesh.geometry.parameters;
      if (mesh.geometry.type === 'SphereGeometry') {
        shape = new CANNON.Sphere(scale * geoParams.radius);
      } else if (mesh.geometry.type === 'BoxBufferGeometry') {
        shape = new CANNON.Box(
          new CANNON.Vec3(
            (scale * geoParams.width) / 2,
            (scale * geoParams.height) / 2,
            (scale * geoParams.depth) / 2
          )
        );
      }
      const mass = scale * mesh.mass;
      const damping = 0.1; // mass * 0.1;
      const body = new CANNON.Body({
        position,
        mass,
        shape,
        linearDamping: damping,
        angularDamping: damping,
      });

      world.addBody(body);
      bodies.push(body);
    }

    if (mesh.mass > 0) {
      mesh.bodies = bodies;
      meshes.push(mesh);
    }
  }

  function compose(position, quaternion, scale, iMatrix, index) {
    const x = quaternion.x,
      y = quaternion.y,
      z = quaternion.z,
      w = quaternion.w;
    const x2 = x + x,
      y2 = y + y,
      z2 = z + z;
    const xx = x * x2,
      xy = x * y2,
      xz = x * z2;
    const yy = y * y2,
      yz = y * z2,
      zz = z * z2;
    const wx = w * x2,
      wy = w * y2,
      wz = w * z2;

    iMatrix[index + 0] = (1 - (yy + zz)) * scale;
    iMatrix[index + 1] = (xy + wz) * scale;
    iMatrix[index + 2] = (xz - wy) * scale;
    iMatrix[index + 3] = 0;

    iMatrix[index + 4] = (xy - wz) * scale;
    iMatrix[index + 5] = (1 - (xx + zz)) * scale;
    iMatrix[index + 6] = (yz + wx) * scale;
    iMatrix[index + 7] = 0;

    iMatrix[index + 8] = (xz + wy) * scale;
    iMatrix[index + 9] = (yz - wx) * scale;
    iMatrix[index + 10] = (1 - (xx + yy)) * scale;
    iMatrix[index + 11] = 0;

    iMatrix[index + 12] = position.x;
    iMatrix[index + 13] = position.y;
    iMatrix[index + 14] = position.z;
    iMatrix[index + 15] = 1;
  }

  return obj;
}

const title = document.querySelector('.title');
const h1 = document.querySelector('h1');
const h2 = document.querySelector('h2');
const container = document.querySelector('.container');
const center1 = document.querySelector('.center1');
const center2 = document.querySelector('.center2');
const center3 = document.querySelector('.center3');
const button1 = document.querySelector('.button1');
const button2 = document.querySelector('.button2');
const button3 = document.querySelector('.button3');
const contact = document.querySelector('.contact');
const expt1s = document.querySelectorAll('.expt1');
const text1s = document.querySelectorAll('.text1');
const svgwork = document.querySelector('.svgwork');
const squaregrid = document.querySelector('.squarecontainer');
const cards = document.querySelectorAll('.square');

var center1on = 0;
var center2on = 0;
var center3on = 0;

document.querySelector('.button1').addEventListener('click', () => {
  if (
    (center1on == '1' || center1on == '0') &
    (center2on == '0') &
    (center3on == '0')
  ) {
    var maincenter = '1a';
  }

  if ((center1on == '0') & (center2on == '1') & (center3on == '0')) {
    var maincenter = '2a';
  }

  if ((center1on == '0') & (center2on == '0') & (center3on == '1')) {
    var maincenter = '3a';
  }

  switch (maincenter) {
    case '1a':
      centera();
      break;

    case '2a':
      centerb();
      centera();
      break;

    case '3a':
      centerc();
      centera();
      break;

    default:
      console.log("I don't own a pet");
      break;
  }
});

document.querySelector('.button2').addEventListener('click', () => {
  if (
    (center1on == '0') &
    (center2on == '1' || center2on == '0') &
    (center3on == '0')
  ) {
    var maincenter = '1b';
  }

  if ((center1on == '1') & (center2on == '0') & (center3on == '0')) {
    var maincenter = '2b';
  }

  if ((center1on == '0') & (center2on == '0') & (center3on == '1')) {
    var maincenter = '3b';
  }

  switch (maincenter) {
    case '1b':
      centerb();
      break;

    case '2b':
      centera();
      centerb();
      break;

    case '3b':
      centerc();
      centerb();
      break;

    default:
      console.log("I don't own a pet");
      break;
  }
});

document.querySelector('.button3').addEventListener('click', () => {
  if (
    (center1on == '0') &
    (center2on == '0') &
    (center3on == '0' || center3on == '1')
  ) {
    var maincenter = '1c';
  }

  if ((center1on == '1') & (center2on == '0') & (center3on == '0')) {
    var maincenter = '2c';
  }

  if ((center1on == '0') & (center2on == '1') & (center3on == '0')) {
    var maincenter = '3c';
  }

  switch (maincenter) {
    case '1c':
      centerc();
      break;

    case '2c':
      centera();
      centerc();
      break;

    case '3c':
      centerb();
      centerc();
      break;

    default:
      console.log('something is wrong');
      break;
  }
});

function centera() {
  const state = Flip.getState(
    '.title, h1, h2, .container, .center1, .contact, .expt1',
    {
      props:
        'marginBottom, display, padding, paddingLeft, paddingRight, paddingTop, paddingBottom, fontSize, gridTemplateRows, gridTemplateColumns, gridTemplateAreas, opacity, backgroundImage, textDecoration',
    }
  );

  const state1 = Flip.getState('.text1', { props: 'opacity' });

  title.classList.toggle('titleup');
  h1.classList.toggle('h1up');
  h2.classList.toggle('h2up');
  container.classList.toggle('containerup');
  center1.classList.toggle('center1up');
  contact.classList.toggle('contactup');
  expt1s.forEach((expt1) => {
    expt1.classList.toggle('expt1up');
  });
  text1s.forEach((text1) => {
    text1.classList.toggle('text1up');
  });

  Flip.from(state, {
    absolute:
      '.title, h1, h2, .container, .center1, .contact, .expt1',
    duration: 1,
    targets: '.title, h1, h2, .container, .center1, .contact, .expt1',
    ease: 'power1.inOut',
    onComplete: () => {
      button1.classList.toggle('button1up');
      var op = window
        .getComputedStyle(center1)
        .getPropertyValue('opacity');
      if (op == '1') {
        center1on = '1';
      } else if (op == '0') {
        center1on = '0';
      }
    },
    onStart: () => {
      expt1s.forEach((expt1) => {
        expt1.classList.toggle('expt1up2');
      });
      let tl = gsap.timeline({});
      tl.to(iMesh.rotation, {
        duration: 1,
        z: Math.PI * 2,
        ease: 'power1.inOut',
      });

      tl.set(iMesh.rotation, {
        z: 0,
      });
    },
  });

  Flip.from(state1, {
    absolute: true,
    duration: 1,
    targets: '.text1',
    ease: 'power1.inOut',
  });
}

function centerb() {
  const state = Flip.getState(
    '.title, h1, h2, .container, .center2, .contact, .svgwork',
    {
      props:
        'marginBottom, display, padding, paddingLeft, paddingRight, paddingTop, paddingBottom, fontSize, gridTemplateRows, gridTemplateColumns, gridTemplateAreas, opacity, backgroundImage, textDecoration',
    }
  );

  title.classList.toggle('titleup');
  h1.classList.toggle('h1up');
  h2.classList.toggle('h2up');
  container.classList.toggle('containerup');
  center2.classList.toggle('center2up');
  contact.classList.toggle('contactup');
  svgwork.classList.toggle('svgworkup');

  Flip.from(state, {
    absolute:
      '.title, h1, h2, .container, .center2, .contact, .svgwork',
    duration: 1,
    targets:
      '.title, h1, h2, .container, .center2, .contact, .svgwork',
    ease: 'power1.inOut',
    onComplete: () => {
      button2.classList.toggle('button2up');
      var op = window
        .getComputedStyle(center2)
        .getPropertyValue('opacity');
      if (op == '1') {
        center2on = '1';
      } else if (op == '0') {
        center2on = '0';
      }
    },
    onStart: () => {
      let tl = gsap.timeline({});
      tl.to(iMesh.rotation, {
        duration: 1,
        y: Math.PI * 2,
        ease: 'power1.inOut',
      });

      tl.set(iMesh.rotation, {
        y: 0,
      });
    },
  });
}

function centerc() {
  const state = Flip.getState(
    '.title, h1, h2, .container, .center3, .contact, .squarecontainer, .square',
    {
      props:
        'marginBottom, display, padding, paddingLeft, paddingRight, paddingTop, paddingBottom, fontSize, gridTemplateRows, gridTemplateColumns, gridTemplateAreas, opacity, backgroundImage, textDecoration',
    }
  );

  title.classList.toggle('titleup');
  h1.classList.toggle('h1up');
  h2.classList.toggle('h2up');
  container.classList.toggle('containerup');
  center3.classList.toggle('center3up');
  contact.classList.toggle('contactup');
  squaregrid.classList.toggle('squarecontainerup');
  cards.forEach((card) => {
    card.classList.toggle('squareup');
  });

  Flip.from(state, {
    absolute:
      '.title, h1, h2, .container, .center3, .contact, .squarecontainer, .square',
    duration: 1,
    targets:
      '.title, h1, h2, .container, .center3, .contact, .squarecontainer, .square',
    ease: 'power1.inOut',
    onComplete: () => {
      button3.classList.toggle('button3up');
      var op = window
        .getComputedStyle(center3)
        .getPropertyValue('opacity');
      if (op == '1') {
        center3on = '1';
      } else if (op == '0') {
        center3on = '0';
      }
      squaregrid.classList.remove('squarecontaineropen');
      center3.classList.remove('center3open');
      cards.forEach((card) => {
        card.classList.remove(activeClass);
        card.classList.remove(inactiveClass);
      });
    },
    onStart: () => {
      // center3.classList.remove('center3up');
      let tl = gsap.timeline({});
      tl.to(iMesh.rotation, {
        duration: 1,
        x: Math.PI * 2,
        ease: 'power1.inOut',
      });

      tl.set(iMesh.rotation, {
        x: 0,
      });
    },
  });
}

document.querySelector('.uiover1').addEventListener('click', () => {
  if (window.matchMedia('(pointer: coarse)').matches) {
    const uiover1 = document.querySelector('.uiover1');
    const bundcont = document.querySelector('.bundconta');
    uiover1.classList.toggle('uioverh');
    bundcont.classList.toggle('bundconth');
  }
});

document.querySelector('.uiover2').addEventListener('click', () => {
  if (window.matchMedia('(pointer: coarse)').matches) {
    const uiover2 = document.querySelector('.uiover2');
    const bundcont = document.querySelector('.bundcont');
    uiover2.classList.toggle('uioverh');
    bundcont.classList.toggle('bundconth');
  }
});

document.querySelector('.uiover3').addEventListener('click', () => {
  if (window.matchMedia('(pointer: coarse)').matches) {
    const uiover3 = document.querySelector('.uiover3');
    const bundcont = document.querySelector('.bundcontaa');
    uiover3.classList.toggle('uioverh');
    bundcont.classList.toggle('bundconth');
  }
});

const activeClass = 'is-active';
const inactiveClass = 'is-inactive';

cards.forEach((card, idx) => {
  card.addEventListener('click', () => {
    const state = Flip.getState(cards, squaregrid, center3, {
      props:
        'aspect-ratio, grid-column,  box-shadow, backdrop-filter',
    });
    const isCardActive = card.classList.contains(activeClass);

    cards.forEach((otherCard, otherIdx) => {
      otherCard.classList.remove(activeClass);
      otherCard.classList.remove(inactiveClass);
      squaregrid.classList.remove('squarecontaineropen');
      center3.classList.remove('center3open');
      if (!isCardActive && idx !== otherIdx)
        otherCard.classList.add(inactiveClass);
    });

    if (!isCardActive) {
      card.classList.add(activeClass);
      squaregrid.classList.add('squarecontaineropen');
      center3.classList.add('center3open');
    }

    Flip.from(state, {
      duration: 1,
      ease: 'power1.inOut',
      absolute: true,
      onComplete: () => {
        let tl = gsap.timeline({});
        tl.fromTo(
          '.figtext p',
          { opacity: 0 },
          { opacity: 1, duration: 1, ease: 'power1.inOut' }
        ),
          tl.fromTo(
            '.gosee',
            { opacity: 0 },
            { opacity: 1, duration: 1, ease: 'power1.inOut' }
          );
      },
      onUpdate: () => {
        gsap.set('.figtext p', { opacity: 0 });
        gsap.set('.gosee', { opacity: 0 });
      },
    });
  });
});

const links = document.querySelectorAll('.prolink');
links.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.stopPropagation();
  });
});
