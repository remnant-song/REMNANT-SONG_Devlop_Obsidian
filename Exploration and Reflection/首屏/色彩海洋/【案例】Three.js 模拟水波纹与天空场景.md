[【案例】Three.js 模拟水波纹与天空场景（附案例代码） - 技术栈](https://jishuzhan.net/article/1963423620665491458)
Three.js 自带的`Sky` 类（天空着色器），**模拟了 真实大气光散射效果**，能渲染出比较自然的蓝天、黄昏、日出等天空氛围，而不是单纯的背景颜色。

Three.js 自带的`Water` 类的作用是用来**创建可动的水面效果**，通常用于海洋、湖泊、池塘等场景。它不仅是一个几何平面，还封装了 物理感的波动、反射、折射和高光效果。

最终实现效果：  
![](https://i-blog.csdnimg.cn/direct/53122a9d6f8a43c9bcd17126e0f07509.gif)

### 1. 水波纹

1. 使用`PlaneGeometry` 创建一个平面作为水面载体，贴在地面水平位置。
2. `Water` 材质是**官方写好的着色器** ：  
    `waterNormals`：法线贴图，制造波浪凹凸感。  
    `distortionScale`：水面扭曲强度，也是波纹的起伏程度。  
    `sunDirection / sunColor`：影响反射效果。 `waterColor`：整体海水颜色。

javascript复制代码

```javascript
  // 加载水面法线贴图
  const textureLoader = new THREE.TextureLoader();
  const waterNormals = textureLoader.load(
    "/image/waternormals.jpg",//图片地址：https://github.com/mrdoob/three.js/blob/dev/examples/textures/waternormals.jpg
    function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 让法线贴图可以重复
    }
  );

  // 创建水面
  const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
  // 使用Water 材质
  const water = new Water(waterGeometry, {
    textureWidth: 512, // 生成的反射/折射纹理宽度
    textureHeight: 512, // 生成的反射/折射纹理高度
    waterNormals: waterNormals, // 法线贴图
    alpha: 1.0, // 水面的透明度
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff, // "太阳光"颜色
    waterColor: 0x9ee7f7, // 水体颜色
    distortionScale: 3.7, // 失真程度，决定波纹起伏的大小
    fog: scene.fog !== undefined, // 是否结合场景雾效
  });
  water.rotation.x = -Math.PI / 2; //让水面水平
  scene.add(water);// 将水面添加进场景
```

添加水波纹动画：

javascript复制代码

```javascript
  // 添加动画
  function animate() {
    // 让水面波纹动起来，内部水面材质会根据 time 进行偏移
    water.material.uniforms["time"].value += 1.0 / 60.0;
    renderer.render(scene, camera);
  }
```

### 2. 模拟真实天空

`Sky` 对象 是一个巨大的球体，内贴着天空着色器。通过 Sky 着色器渲染的天空，可以经由 `PMREMGenerator` 转换成环境贴图，让场景中的物体反射真实的天空光照。  
![](https://i-blog.csdnimg.cn/direct/140a211f360640ee9ce0ba5212473268.gif)

javascript复制代码

```javascript
// 添加天空
  sky = new Sky();
  sky.scale.setScalar(10000); //设置天空大小
  scene.add(sky);
  // 设置大气效果
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10; //（浑浊度）→ 决定天空雾化
  skyUniforms["rayleigh"].value = 2; //瑞利散射→ 控制蓝色强度
  skyUniforms["mieCoefficient"].value = 0.005; //米氏散射→ 影响光晕
  skyUniforms["mieDirectionalG"].value = 0.8; //散射方向→太阳光扩散角度

  // 太阳
  sun = new THREE.Vector3();

  // 添加环境光照
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  let renderTarget;

  // 太阳位置改变时，天空颜色和水面反射也同步更新
  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - 2); //太阳相对于天顶的角度
    const theta = THREE.MathUtils.degToRad(180); //太阳绕场景水平旋转的角度。

    sun.setFromSphericalCoords(1, phi, theta); //转成笛卡尔坐标

    sky.material.uniforms["sunPosition"].value.copy(sun); //更新天/空材质
    water.material.uniforms["sunDirection"].value.copy(sun).normalize(); //更新水面材质
    if (renderTarget !== undefined) renderTarget.dispose();

    sceneEnv.add(sky); // 创建一个场景，放入天空
    renderTarget = pmremGenerator.fromScene(sceneEnv);//生成环境贴图
    scene.add(sky);// 设置到主场景

    scene.environment = renderTarget.texture;//
  }

  updateSun();
```

### 3. 添加上下浮动的小方块

javascript复制代码

```javascript
  // 添加方块
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshStandardMaterial({ roughness: 0 });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  // 添加动画
  function animate() {
    const time = performance.now() * 0.001; //performance.now()返回从页面加载开始到现在的毫秒数
    /**
     * Math.sin(time) 会生成一个周期性波动（-1 到 1）。
     * 20 放大振幅 → 上下浮动幅度 ±20。
     * 5 调整基准高度 → mesh 不会落到 y=0。
     */
    mesh.position.y = Math.sin(time) * 20 + 5; // 让方块上下移动
    mesh.rotation.x = time * 0.5; // 让方块旋转
    mesh.rotation.z = time * 0.51; // 让方块旋转

    // 让水面波纹动起来，内部水面材质会根据 time 进行偏移
    water.material.uniforms["time"].value += 1.0 / 60.0;

    renderer.render(scene, camera);
  }
```

### 4. 完整代码

html复制代码

```html
<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { onMounted, ref, onBeforeUnmount } from "vue";
import VContainer from "@/components/v-container/Container.vue";

const threeRef = ref();
let renderer = null;
let scene = null;
let controls = null;
let camera = null;
let sky, sun;

const init = () => {
  // 场景
  scene = new THREE.Scene();
  // 相机
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(30, 30, 100);
  scene.add(camera);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate); // 自动动画刷新
  renderer.toneMapping = THREE.ACESFilmicToneMapping; //色彩映射，电影色调映射
  renderer.toneMappingExposure = 1.5; //让色彩不过曝或欠曝
  threeRef.value.appendChild(renderer.domElement);

  // 加载水面法线贴图
  const textureLoader = new THREE.TextureLoader();
  const waterNormals = textureLoader.load(
    "/image/waternormals.jpg",
    function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 让法线贴图可以重复
    }
  );

  // 创建水面
  const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
  // 使用Water 材质
  const water = new Water(waterGeometry, {
    textureWidth: 512, // 生成的反射/折射纹理宽度
    textureHeight: 512, // 生成的反射/折射纹理高度
    waterNormals: waterNormals, // 法线贴图
    alpha: 1.0, // 水面的透明度
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff, // "太阳光"颜色
    waterColor: 0x9ee7f7, // 水体颜色
    distortionScale: 3.7, // 失真程度，决定波纹起伏的大小
    fog: scene.fog !== undefined, // 是否结合场景雾效
  });
  water.rotation.x = -Math.PI / 2; //让水面水平
  scene.add(water);//

  // 添加天空
  sky = new Sky();
  sky.scale.setScalar(10000); //设置天空大小
  scene.add(sky);
  // 设置大气效果
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10; //（浑浊度）→ 决定天空雾化
  skyUniforms["rayleigh"].value = 2; //瑞利散射→ 控制蓝色强度
  skyUniforms["mieCoefficient"].value = 0.005; //米氏散射→ 影响光晕
  skyUniforms["mieDirectionalG"].value = 0.8; //散射方向→太阳光扩散角度

  // 太阳
  sun = new THREE.Vector3();

  // 添加环境光照
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  let renderTarget;

  // 太阳位置改变时，天空颜色和水面反射也同步更新
  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - 2); //太阳相对于天顶的角度
    const theta = THREE.MathUtils.degToRad(180); //太阳绕场景水平旋转的角度。

    sun.setFromSphericalCoords(1, phi, theta); //转成笛卡尔坐标

    sky.material.uniforms["sunPosition"].value.copy(sun); //更新天/空材质
    water.material.uniforms["sunDirection"].value.copy(sun).normalize(); //更新水面材质
    if (renderTarget !== undefined) renderTarget.dispose();

    sceneEnv.add(sky); // 创建一个场景，放入天空
    renderTarget = pmremGenerator.fromScene(sceneEnv);//生成环境贴图
    scene.add(sky);// 设置到主场景

    scene.environment = renderTarget.texture;//
  }

  updateSun();

  // 添加方块
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshStandardMaterial({ roughness: 0 });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 添加动画
  function animate() {
    const time = performance.now() * 0.001; //performance.now()返回从页面加载开始到现在的毫秒数
    /**
     * Math.sin(time) 会生成一个周期性波动（-1 到 1）。
     * 20 放大振幅 → 上下浮动幅度 ±20。
     * 5 调整基准高度 → mesh 不会落到 y=0。
     */
    mesh.position.y = Math.sin(time) * 20 + 5; // 让方块上下移动
    mesh.rotation.x = time * 0.5; // 让方块旋转
    mesh.rotation.z = time * 0.51; // 让方块旋转

    // 让水面波纹动起来，内部水面材质会根据 time 进行偏移
    water.material.uniforms["time"].value += 1.0 / 60.0;

    renderer.render(scene, camera);
  }

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.update();

  // 窗口自适应
  window.onresize = function () {
    camera.aspect = window.innerWidth / window.innerHeight; // 更新相机纵横比
    camera.updateProjectionMatrix(); // 更新纵横比
    renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器的大小
  };
};
onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  controls?.dispose();
  renderer?.dispose();
  scene?.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry.dispose();
    }
  });
  window.onresize = null;
});
</script>
<template>
      <div ref="threeRef" class="three-wrapper"></div>
</template>
<style scoped>
.three-wrapper {
  width: 100%;
  height: calc(100vh);
  overflow: hidden;
}
</style>
```

相关系列文章：  
[🔍【基础】Three.js的零基础入门篇（附案例代码）](https://blog.csdn.net/qq_52395343/article/details/133772669)  
[🔍【基础】Three.js中添加操作面板，GUI可视化调试（附案例代码）](https://blog.csdn.net/qq_52395343/article/details/141644095)  
[🔍【基础】Three.js加载纹理贴图、加载外部gltf格式文件](https://blog.csdn.net/qq_52395343/article/details/141820799)  
[🔍【基础】Three.js中如何添加阴影（附案例代码）](https://blog.csdn.net/qq_52395343/article/details/150418540?spm=1001.2014.3001.5501)  
[🔍【基础】Three.js中的粒子系统 （附案例代码）](https://blog.csdn.net/qq_52395343/article/details/151049291?spm=1001.2014.3001.5501)  
[🔍【案例】Three.js 半球光与雪花降落场景（附案例代码）](https://blog.csdn.net/qq_52395343/article/details/151041651?spm=1001.2014.3001.5501)

本文是转载文章，点击查看原文

如有侵权，请联系 [xyy@jishuzhan.net](mailto:xyy@jishuzhan.net?subject=%E8%AF%B7%E5%88%A0%E9%99%A4%E2%80%9C%E3%80%90%E6%A1%88%E4%BE%8B%E3%80%91Three.js%20%E6%A8%A1%E6%8B%9F%E6%B0%B4%E6%B3%A2%E7%BA%B9%E4%B8%8E%E5%A4%A9%E7%A9%BA%E5%9C%BA%E6%99%AF%EF%BC%88%E9%99%84%E6%A1%88%E4%BE%8B%E4%BB%A3%E7%A0%81%EF%BC%89%E2%80%9D%E6%96%87%E7%AB%A0%EF%BC%8C%E8%BF%99%E7%AF%87%E6%96%87%E7%AB%A0%E4%BE%B5%E6%9D%83%E4%BA%86%E6%88%91%E7%9A%84%E6%9D%83%E7%9B%8A&body=%E6%96%87%E7%AB%A0%E9%93%BE%E6%8E%A5:https://jishuzhan.net/article/1963423620665491458%EF%BC%8C%E8%AF%B7%E8%AF%81%E6%98%8E%E8%BF%99%E7%AF%87%E6%96%87%E7%AB%A0%E6%98%AF%E4%BD%A0%E7%9A%84) 删除

[](https://jishuzhan.net/tag/14)[](https://jishuzhan.net/tag/15)[](https://jishuzhan.net/tag/36)[](https://jishuzhan.net/tag/159)

[上一篇：2025年主流的CRM厂商评测](https://jishuzhan.net/article/1963423229936713730)

[下一篇：Azure MCP Server：连接AI与Azure服务的智能桥梁](https://jishuzhan.net/article/1963423796025147394)

相关推荐

[

hunterandroid

5 小时前

Compose 状态管理：remember、rememberSaveable 与状态提升

前端

](https://jishuzhan.net/article/2070331370760663041)[

星栈

6 小时前

Dioxus 接数据库最容易写歪的 3 个地方：sqlx + SQLite 怎么接才顺

前端·rust·前端框架

](https://jishuzhan.net/article/2070328195857084418)[

晴虹

6 小时前

vue3-scroll-more：横向滚动条-元素或页签过多滚动显示处理的组件

前端·vue.js

](https://jishuzhan.net/article/2070327834995945474)[

代码搬运媛

6 小时前

Claude 全栈开发专用 Rules 配置

前端

](https://jishuzhan.net/article/2070327357558321153)[

PedroQue99

6 小时前

uni-router v1.7.0重磅更新：守卫重定向自由掌控

前端·uni-app

](https://jishuzhan.net/article/2070326387969454081)[

Forever7_

6 小时前

尤雨溪转发：Vue-tui 0.1 发布！Vue 终于杀进终端！

vue.js

](https://jishuzhan.net/article/2070326358592548865)[

逸铭

6 小时前

Day 4：登录与 Token——桌面端怎么存密钥

前端·客户端

](https://jishuzhan.net/article/2070326237624627202)[

默_笙

6 小时前

🍞 我用 CSS 画了一个会转的 3D 立方体，同事以为我学了 Three.js(这节课真的很神奇，我很喜欢)

javascript

](https://jishuzhan.net/article/2070326191483088898)[

dkbnull

6 小时前

Vue 虚拟 DOM Diff 算法与 key 机制原理

vue.js

](https://jishuzhan.net/article/2070326065662357506)[

溯朢

6 小时前

TokUI 流式渲染的 SSE 全链路拆解

前端

](https://jishuzhan.net/article/2070324853659496450)

热门推荐

[012026年6月AI大模型全景报告：GPT-5.6、Claude Opus 4.8、Gemini 3.5，中美AI三足鼎立谁主沉浮？](https://jishuzhan.net/article/2066017811457208321)[022026年6月AI行业全景：从百模大战到Agent元年，这30天发生了什么？](https://jishuzhan.net/article/2063102512902778882)[032026 年 AI 编程工具终极横评：Cursor vs Claude Code vs Copilot vs Windsurf](https://jishuzhan.net/article/2059845661620817922)[04【AI】2026 年具身智能模型和世界模型总结](https://jishuzhan.net/article/2048254266264059906)[05Claude Code、Codex、Cursor三分天下：2026年AI编程Agent生态全景剖析](https://jishuzhan.net/article/2061776727671648258)[06飞书长连接_事件订阅（接收消息，审批任务状态变更）](https://jishuzhan.net/article/2055121356715036674)[07【AI总结】2026年6月 主流国内外大模型总结](https://jishuzhan.net/article/2067459354982445058)[08GitHub 镜像站点](https://jishuzhan.net/article/1965957555249266689)[09Trae国际版与国内版深度测评：AI原生IDE的双生花](https://jishuzhan.net/article/2018179437742309377)[10AI科技热点日报 | 2026年6月1日](https://jishuzhan.net/article/2062129711651827713)