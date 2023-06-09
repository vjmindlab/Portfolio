import {
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
  sRGBEncoding,
  ACESFilmicToneMapping,
} from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Three.js helper
 */
export default function useThree() {
  // default conf
  const conf = {
    canvas: null,
    antialias: false,
    alpha: true,
    camera_fov: 50,
    camera_pos: new Vector3(0, 0, 100),
    camera_ctrl: false,
    mouse_move: false,
    mouse_raycast: false,
    window_resize: true,
  };

  // size
  const size = {
    width: 0,
    height: 0,
    wWidth: 0,
    wHeight: 0,
    ratio: 0,
  };

  let afterResizeCallbacks = [];

  // mouse tracking
  const mouse = new Vector2();
  const mouseV3 = new Vector3();
  const mousePlane = new Plane(new Vector3(0, 0, 1), 0);
  const raycaster = new Raycaster();

  // returned object
  const obj = {
    conf,
    renderer: null,
    camera: null,
    cameraCtrl: null,
    size,
    mouse,
    mouseV3,
    init,
    dispose,
    setSize,
    onAfterResize,
  };

  /**
   * init three
   */
  let pixelRatio = window.devicePixelRatio;
  let AA = true;
  if (pixelRatio > 1) {
    AA = false;
  }

  function init(params) {
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        conf[key] = value;
      }
    }

    obj.renderer = new WebGLRenderer({
      canvas: conf.canvas,
      antialias: AA,
      alpha: conf.alpha,
      setClearColor: (0x000000, 0),
      outputEncoding: sRGBEncoding,
      toneMapping: ACESFilmicToneMapping,
      toneMappingExposure: 1.25,
      powerPreference: 'high-performance',
    });

    obj.camera = new PerspectiveCamera(conf.camera_fov);
    obj.camera.position.copy(conf.camera_pos);

    if (conf.camera_ctrl) {
      obj.cameraCtrl = new OrbitControls(
        obj.camera,
        obj.renderer.domElement
      );
      if (conf.camera_ctrl instanceof Object) {
        for (const [key, value] of Object.entries(conf.camera_ctrl)) {
          obj.cameraCtrl[key] = value;
        }
      }
    }

    if (conf.window_resize) {
      onResize();
      window.addEventListener('resize', onResize);
    }

    if (conf.mouse_move) {
      obj.renderer.domElement.addEventListener(
        'mousemove',
        onMousemove
      );
      obj.renderer.domElement.addEventListener(
        'mouseleave',
        onMouseleave
      );
    }

    return obj;
  }

  /**
   * remove listeners
   */
  function dispose() {
    window.removeEventListener('resize', onResize);
    obj.renderer.domElement.removeEventListener(
      'mousemove',
      onMousemove
    );
    obj.renderer.domElement.removeEventListener(
      'mouseleave',
      onMouseleave
    );
  }

  /**
   * add after resize callback
   */
  function onAfterResize(callback) {
    afterResizeCallbacks.push(callback);
  }

  /**
   * mousemove listener
   */
  function onMousemove(e) {
    mouse.x = (e.clientX / size.width) * 2 - 1;
    mouse.y = -(e.clientY / size.height) * 2 + 1;
    updateMouseV3();
  }

  /**
   * mouseleave listener
   */
  function onMouseleave(e) {
    mouse.x = 0;
    mouse.y = 0;
    updateMouseV3();
  }

  /**
   * get 3d mouse position
   */
  function updateMouseV3() {
    if (conf.mouse_raycast) {
      const v3 = new Vector3();
      obj.camera.getWorldDirection(v3);
      mousePlane.normal.copy(v3.normalize());
      raycaster.setFromCamera(mouse, obj.camera);
      raycaster.ray.intersectPlane(mousePlane, mouseV3);
    }
  }

  /**
   * resize listener
   */
  function onResize() {
    setSize(window.innerWidth, window.innerHeight);
    afterResizeCallbacks.forEach((c) => c());
  }

  /**
   * update renderer size and camera
   */
  function setSize(width, height) {
    size.width = width;
    size.height = height;
    size.ratio = width / height;

    obj.renderer.setSize(width, height, false);
    obj.camera.aspect = size.ratio;
    obj.camera.updateProjectionMatrix();

    const wsize = getCameraSize();
    size.wWidth = wsize[0];
    size.wHeight = wsize[1];
  }

  /**
   * calculate camera visible area size
   */
  function getCameraSize() {
    const vFOV = (obj.camera.fov * Math.PI) / 180;
    const h =
      2 * Math.tan(vFOV / 2) * Math.abs(obj.camera.position.z);
    const w = h * obj.camera.aspect;
    return [w, h];
  }

  return obj;
}
