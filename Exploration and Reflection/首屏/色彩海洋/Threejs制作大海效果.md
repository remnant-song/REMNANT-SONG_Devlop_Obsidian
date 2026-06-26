[使用ThreejsWater组件实现动态波浪海面效果-开发者社区-阿里云](https://developer.aliyun.com/article/1620202)
**简介：** 这篇文章详细介绍了使用Three.js制作大海效果的技术细节，包括创建水面模型、应用波纹纹理以及实现动态波浪效果的方法。

threeJs制作大海效果，实际上是绘制一个平面模型，在平面模型的表面渲染出波浪的效果，因为模型的长和宽要足够的大，有望不到边的效果，如果项目中添加了拖动效果的话，还需要在拖动的Control中添加允许的拖动角度，这样可以防止用户不下心看到了海面的下面就露馅了，哈哈。

好了，下面开始说下怎么实现海面的效果，Threejs官方里包含了组件Water，使用这个组件可以快速绘制大海的效果，包含海面波浪的动态效果，首先我们需要创建一个场景，按照以往的步骤，场景，相机，渲染器等

```kotlin
initScene(){
      scene = new THREE.Scene();
    },
    initCamera(){
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
      this.camera.position.set(100,100,100);
    },
 initRenderer(){
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.container = document.getElementById("container")
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setClearColor('#294f9a', 1.0);
      this.container.appendChild(this.renderer.domElement);
    },
    initControl(){
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      // // 最大角度
      this.controls.maxPolarAngle = Math.PI / 2.2;
    },
    initAnimate() {
      requestAnimationFrame(this.initAnimate);
      this.renderer.render(scene, this.camera);
    },
```

接着创建一个平面模型作为海面，在海面的模型中添加水纹贴图，通过threejs提供的组件绘制出波浪效果，

```javascript
 initWater(){
      const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
      this.water = new Water(
          waterGeometry,
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('/static/images/waternormals.jpg', function (texture) {
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x294f9a,
            distortionScale: 3.7,
          }
      );
      this.water.rotation.x = - Math.PI / 2;
      scene.add(this.water)
}
```

需要注意的是大海的颜色和initRendeder中this.renderer.setClearColor('#294f9a', 1.0);设置的颜色有关，大家可以根据需要设置不同的大海颜色。下面提供了波浪的贴图。放到对应的位置。

![](https://ucc.alicdn.com/n2hw5ih7a4hss/developer-article1620202/20241011/e674f8929a964fe1bf67a672ba37fd48.jpeg?x-oss-process=image/resize,w_1400/format,webp)

然后将这个模型加入到场景中，因为水需要有波浪的动态效果，所以需要在渲染的时候不断更新波浪的动态效果

```kotlin
initAnimate() {
      this.water.material.uniforms["time"].value += 1.0 / 60.0;
      requestAnimationFrame(this.initAnimate);
      this.renderer.render(scene, this.camera);
    },
```

完整的代码如下

```xml
<template>
  <div id="container"></div>
</template>

<script>
import * as THREE from 'three'
import {OrbitControls} from "three/addons/controls/OrbitControls";
import { Water } from 'three/examples/jsm/objects/Water.js';

let scene;
export default {
  name: "sea-page",
  data() {
    return{
      camera:null,
      water:undefined,
    }
  },
  methods:{
    initScene(){
      scene = new THREE.Scene();
    },
    initCamera(){
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
      this.camera.position.set(100,100,100);
    },
    initWater(){
      const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
      this.water = new Water(
          waterGeometry,
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('/static/images/waternormals.jpg', function (texture) {
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x294f9a,
            distortionScale: 3.7,
          }
      );
      this.water.rotation.x = - Math.PI / 2;
      scene.add(this.water)
    },
    initRenderer(){
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.container = document.getElementById("container")
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setClearColor('#294f9a', 1.0);
      this.container.appendChild(this.renderer.domElement);
    },
    initControl(){
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      // // 最大角度
      this.controls.maxPolarAngle = Math.PI / 2.2;
    },
    initAnimate() {
      this.water.material.uniforms["time"].value += 1.0 / 60.0;
      requestAnimationFrame(this.initAnimate);
      this.renderer.render(scene, this.camera);
    },
    initPage(){
      this.initScene();
      this.initCamera();
      this.initRenderer();
      this.initControl();
      this.initWater();
      this.initAnimate();
    }
  },
  mounted() {
    this.initPage()
  }
}
</script>

<style scoped>
#container{
  position: absolute;
  width:100%;
  height:100%;
  overflow: hidden;
}

</style>
```

![[Pasted image 20260626153632.png]]