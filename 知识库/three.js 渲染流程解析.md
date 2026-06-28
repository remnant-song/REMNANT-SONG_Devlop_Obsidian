https://juejin.cn/post/7194014644288094268  
### 背景

ThreeJS 是目前应用比较多的轻量级、跨端的通用 3D渲染库。开发者们使用这个渲染库，可以很轻易的上手并完成一些3D渲染的任务。但是去做一些比较麻烦的任务时（例如千万点云渲染），会感受到 ThreeJS 的局限和不足。可能是 ThreeJS 本身设计上的问题，也可能是开发者（我）使用的不对。

带着这个目的，我花了一些时间去研究了一下源码。主要是为了搞清楚 ThreeJS 帮开发者做了什么优化，以及 ThreeJS 中 scene、renderer 等概念又是怎么实现的。本文会简单带过 ThreeJS 中的一些概念以及 WebGL 中的一些基本概念。

因为文章的本意是解析 ThreeJS 的运转的，所以会出现较多的源码解读以及我的个人理解。这里会从基本概念的源码实现、渲染主流程的源码实现，两个角度切入。

### 为什么需要 ThreeJS

在开始之前，先用一个流程图介绍一下简单的概念。在 ThreeJS 中，3D物体由几何体（Geometry）和材料（Material）组成。场景（Scene）是一个容器，代表当前场景内需要渲染哪些物体，可以添加3D物体、灯光、阴影等子元素。相机（Camera）则表示当前场景是以哪种视角投影的。最后由渲染引擎（WebGLRenderer）用[WebGL](https://link.juejin.cn?target=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FWebGL "https://en.wikipedia.org/wiki/WebGL")渲染出你精心制作的场景。

![Untitled-2022-12-16-1521.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1f7467f866d444e48de1b91853008eb5~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

Talk is sheap，我们来看一下代码吧。看看在 ThreeJS 里面是怎么渲染一个立方几何体的。

js

 代码解读

复制代码

`import * as THREE from 'three'; ​ const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 ); camera.position.z = 1; ​ const scene = new THREE.Scene(); ​ const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 ); const material = new THREE.MeshNormalMaterial(); ​ const mesh = new THREE.Mesh( geometry, material ); scene.add( mesh ); ​ const renderer = new THREE.WebGLRenderer( { antialias: true } ); renderer.setSize( window.innerWidth, window.innerHeight ); renderer.setAnimationLoop( animation ); document.body.appendChild( renderer.domElement ); ​ function animation( time ) { ​   mesh.rotation.x = time / 2000;   mesh.rotation.y = time / 1000; ​   renderer.render( scene, camera ); ​ }`

总结下上面的样例做了哪些事情

1. 初始化投影相机、场景、几何体、材料、网格
2. 初始化渲染器
3. 添加渲染器绑定的canva节点
4. setAnimationLoop开始逐帧渲染动画

根据这个真实的例子，我们再介绍下相机、场景、物体、渲染器这几个概念，以加深理解。

- 相机，用来表示3D影像是以哪种方式投影的。以透视相机（**PerspectiveCamera**）为例，这一投影模式被用来模拟人眼所看到的景象，它是3D场景的渲染中使用得最普遍的投影模式。
- 场景（Scene）是你放置物体、灯光和摄像机的地方。换句话说，你想要渲染的所有物体，都需要添加在场景中。
- 物体，ThreeJS中提供了 **Geometry** 基类，开发者只要传入参数就可新建一个几何体实例，不需要过于专注 shader program、缓冲区数据绑定等 WebGL 相关的内容。例子中的 **BoxGeometry** 立方几何体就是，只需要传入宽、高、深度就可以构建出一个立方几何体。
- 渲染器，接受场景和相机。将场景中的3D物体、纹理、阴影等以当前相机的投影模式渲染出来。

最终在浏览器页面里，我们会得到下面的3D动画

![202212011044872.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/27e98a55ff6140b4814915c32aff2d7f~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

ThreeJs 本质上还是调用的 WebGL 实现的渲染。类似的渲染任务用WebGL 是这么实现的: [立方几何体的渲染](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FWebGL_API%2FTutorial%2FCreating_3D_objects_using_WebGL "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL") 。总结一下步骤

0. 定义立方体顶点位置
1. 定义顶点颜色
2. 定义元素（三角形）数组
3. 编写定点着色器和片段着色器，给顶点、片段着色
4. 渲染立方体

比较一下可以发现，使用 ThreeJS 做渲染任务，会为开发者屏蔽了很多内容（着色器、着色器变量的定义与绑定等），从代码量和开发的心智模型上，比写原生的 WebGL 代码会简单很多。这也是一些前端项目选择使用 ThreeJS 去做3D渲染的一部分原因。

### ThreeJs 的魔法

在查看渲染流程的源码之前，需要先看下场景、相机等概念在 **ThreeJS** 源码是怎么实现的。根据源码，相机、场景、物体这些对象都继承了 **Object3D** 这个基类。

![Untitled-2023-01-10-1710](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9389978292464e1e81e4389047c6ec07~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp)

![Untitled-2023-01-10-1710](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7bf45d7c868f4ba9b289d3cd3424eeba~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp)

#### Object3D

我们先看一下 **Object3D** 这个基类的实现，然后再接着介绍相机、场景两个概念的实现。官方介绍在这里[Object3D](https://link.juejin.cn?target=https%3A%2F%2Fthreejs.org%2Fdocs%2Findex.html%3Fq%3DObject3D%23api%2Fzh%2Fcore%2FObject3D "https://threejs.org/docs/index.html?q=Object3D#api/zh/core/Object3D")。

![202211181106544.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/48aa7ea5485c494293990254bfc02a3d~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

从构造函数看这个基类主要承担了以下几个职责

- 申明了该对象的id、name、type属性。
    
    - 唯一id，但是在实际应用中，真的很少用到这个id。
    - name基本没有用到过，作为基类，这个属性暂时想不到它的用处。
    - type标记类型。新创建一个实例，都会为这个属性分配内存；此外开发者可以暴力修改。通过原型来表达类型可能是更合适的。
- 初始化3D相关的数据对象
    
    - 3D对象的局部位置，通过三维向量表示。表示物体中心点的位置。
    - 缩放信息，通过三维向量表示，表示，x，y，z三个轴方向下的缩放参数。
    - 欧拉角和四元素，表示3D物体旋转的。因为都是表示旋转，所以欧拉角、四元素依赖变换。在构造方法里就做了onChange监听。
    - 对象的全局或世界变换矩阵，即物体相对于世界坐标下的变换矩阵。局部变换矩阵，即相对于父级的变换矩阵，如果没有父级，那么就等同于世界变换矩阵。简单说，通过变换矩阵可以计算得出不同坐标系下的物体的位置。
- 挂载了一些功能标志位，应用在 ThreeJS 渲染流程中。
    
    - 可见性、是否渲染到阴影贴图、材质是否接受阴影。置为false时，就不会渲染。
    - 是否在相机的视椎体，不在的话也就不会渲染。相机的视椎体，可以简单的理解为在视椎体内部的物体，是相机可以看到的，也就是应该被渲染出来的。
- 提供了树结点的能力。
    
    - 父指针、孩子数组。

再看基类提供的方法，根据职责主要分为3D数据相关和树结构相关。（因为篇幅所限，就不贴图了。）

- 修改、更新世界矩阵、局部矩阵的方法
- 修改欧拉角、缩放、位移（x、y、z，3个轴方向）的数值的方法
- 渲染前处理、后处理的回调方法
- 查询父子节点的方法

以上就是 ThreeJS 提供的3D对象 **Object3D** 基类所抽象的内容。基类中一些标志位以及userData这种自定义内容，使的这个基类有点臃肿，应该可以有更好的代码设计，去完成这部分职责。

##### 相机

我们的例子里面使用的是 **PerspectiveCamera** 透视相机，继承于**Camera**类。**Camera**类又继承了**Object3D**。所以本质上相机也是一个3D对象。这里就介绍下透视相机的实现。

对于一个相机而言，有以下几个概念（不同相机的计算不完全一致）

- 内参，包括焦距、缩放等相机变量
- 外参，简单说就是旋转矩阵、平移矩阵，用来表示物体从世界坐标系到相机坐标系的转换。
- 投影矩阵，用来表示该相机坐标系下某个点对应到二维平面映射关系。简单公式：投影矩阵*三维点 = 二维平面点。

![202211181105204.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/55c3ad1fe58c4d51b933ecdbb16b1d9f~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?) **PerspectiveCamera** 类在继承的基础上，增加透视相机的相应的内参属性以及这些内参的计算方法。

![202301111642804.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/650640f6c9ae4365ba4075bd5465132e~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

**PerspectiveCamera** 类 的 **updateProjectionMatrix**方法，根据相机的内参，计算得出透视相机的投影矩阵。这里引用了数学库 **Matrix4** 的 **makePerspective** 方法，该方法表示了透视相机的投影矩阵的数学计算过程。**makePerspective** 方法作为透视相机的静态方法，直接挂在 **PerspectiveCamera** 类上可能会更优雅一些。

![202211181449418.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b836a26a0ff94395b17a4bf3b71e1445~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

##### 场景

跟文章开头的例子一样，在实际开发中，开发者们一般会先创建 **Scene** 实例，然后再去添加想要渲染的物体、灯光，同时配置场景的材料、背景等，最后再把 **Scene** 实例交给渲染器去渲染。

**Scene** 类也是继承于**Object3D**基类。在平时开发的过程中，开发者使用的新增物体的能力，其实是 **Object3D** 提供的。**Scene** 类本身只是提供了默认的背景、雾、纹理贴图、覆盖材料的能力。结合后续的渲染器代码的解析，在树根节点的背景、纹理的设置也会影响到孩子节点的背景、纹理的渲染。

![202211181458629.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2eb5356bac81442fa028cb1a8b1f9c3b~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?) **Scene** 类的源码其实比较简单，并没有特别繁杂的地方，和渲染流程并不完全相关，只是提供了渲染物体的容器。从实现上看起来，所有继承了 **Object3D** 的对象都可以被用作渲染器的场景入参，只需要在我们自定义的类内增加 **isScene** 和 **type** 两个标志位。

到这里我们也可以发现 ThreeJS 里面很多对象类型的判断，是通过类似 **isScene** 和 **type** 这样的标志位来做。这种设计会带来以下风险

- 导致对象的封闭性会差很多，开发者可以较为轻易且暴力的破坏这种封闭性，
- 此外在渲染物体较多的情况下，会造成内存的浪费。极端的千万点不分片的场景。
- 在渲染器代码里面会有很多类似的判断，如果有新的物体能力增加，需要在所有流程中都补上isNewObject的判断。

如果这里使用多态和组合的方式，会解决部分麻烦。

### 深入浅出[ThreeJs 的渲染流程](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fmrdoob%2FThreeJS%2Fblob%2Fmaster%2Fsrc%2Frenderers%2FWebGLRenderer.js "https://github.com/mrdoob/ThreeJS/blob/master/src/renderers/WebGLRenderer.js")

经历了上文的铺垫，现在可以正式开始对渲染流程的解析了。ThreeJS里面提供了很多的渲染器，2D、3D、XR等等。这里我们主要解析支持 WebGL2 的 **WebGLRenderer** 的渲染流程，WebGL2 基于 OpenGL ES 3.0的api。在不支持 WebGL2 的浏览器上，ThreeJS 还是会以 WebGL + extensions 的形式为开发者提供服务。

渲染器做的事情非常繁杂。这里从它的 **render** 方法作为切入口去学习一下。这里用一张流程图概括下执行一次 **render** 做了哪些事情。

![render-stages.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f390f63339c94b29b75eae890ae08623~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?) **WebGLRenderer** 把渲染流程分为三个部分。下面的源码已经精简过，并带上了一些注释, 可以参考流程图试着去走一遍流程。

- 前处理，
- 剪辑、阴影、物体渲染，
- 后处理

js

 代码解读

复制代码

`this.render = function (scene, camera) {    if (_isContextLost === true) return; // update scene graph    if (scene.autoUpdate === true) scene.updateMatrixWorld(); // update camera matrices and frustum    if (camera.parent === null) camera.updateMatrixWorld();    if (scene.isScene === true) scene.onBeforeRender(_this, scene, camera, _currentRenderTarget);    // 1、 init currentRenderState         // 2、 init internum variabilis: _projScreenMatrix,_frustum,_localClippingEnabled         // 3、 init currentRenderList ​    // 4、project objects    projectObject(scene, camera, 0, _this.sortObjects);    currentRenderList.finish();       // 5、sort renderList    if (_this.sortObjects === true) {       currentRenderList.sort(_opaqueSort, _transparentSort);    }          // start render    // 1、render clipping    if (_clippingEnabled === true) clipping.beginShadows();    const shadowsArray = currentRenderState.state.shadowsArray;    shadowMap.render(shadowsArray, scene, camera);    if (_clippingEnabled === true) clipping.endShadows(); //         // 2、update performance data    if (this.info.autoReset === true) this.info.reset(); //      // 3. render background    background.render(currentRenderList, scene); // render scene      // 4. setup lights    currentRenderState.setupLights(_this.physicallyCorrectLights);      // 5. render 3D object in scene    if (camera.isArrayCamera) {       const cameras = camera.cameras; ​       for (let i = 0, l = cameras.length; i < l; i++) {          const camera2 = cameras[i];          renderScene(currentRenderList, scene, camera2, camera2.viewport);       }    } else {       renderScene(currentRenderList, scene, camera);    }     if (scene.isScene === true) scene.onAfterRender(_this, scene, camera); // _gl.finish();    // post processing    // ...    };`

#### 前处理

1. 初始化currentRenderState
2. 初始化currentRenderList
3. projectObject 预处理场景内添加的物体。

##### 字典对象

阅读源码时，可以发现在整个渲染流程中，贯穿着一些对象。它们承担了一部分的渲染职责，帮助渲染器完成渲染任务。这里取两个比较重要的实例解释一下。

- currentRenderList：在预处理中，对该次渲染流程中需要渲染物体进行处理分类。主要存储不透明物体、透明物体、透射物体三个物体数组以及包含所有物体的数组。渲染时，直接按照处理好的分类。对这些数组进行处理。
- currentRenderState: 在预处理中，对该次渲染流程中存在的光线、阴影进行存储。在渲染时，直接通过该对象获取要渲染的光线、阴影。

这两个实例存储在各自对应的Weakmap中，每次渲染开始去初始化，渲染结束清理。它们的职责贯穿在整个渲染流程中。Weakmap实例又挂载在类上面，这里给这些类生成的实例一个称呼**字典对象**。

这里截取currentRenderList的对象字典 **WebGLRenderLists** 的源码帮助理解。

![202301121044915.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c85f388c29924df48dfb54172c4d27e1~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

对于大部分渲染任务来说，为了达到60fps的渲染帧数，每帧都会去执行一次render方法，这样执行的频率是非常高的。在整个渲染流程中，各种各样的中间对象需要管理，整个流程中的内存泄漏也是非常致命的。**WebGLRenderer** 通过这些**字典对象**去存储并缓存这些中间对象，进行性能调优。**字典对象**大都可以在 **initGLContext** 方法中找到对应初始化，在渲染流程的解析中先不做详细扩展。

##### projectObject 预处理对象

**projectObject**接收scene实例作为第一个object的入参。在阅读**Scene**的源码中可以知道，Scene是一个**Object3D**对象，可以作为树的根节点组成一颗渲染树。**projectObject**方法，就是深度遍历传入的scene实例，并根据遍历中3D对象的不同类型去进行不同的预处理。（当然这里已经说过这种实现的问题了。用多态去实现会更合理）

![202212151857032.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/45aa8f59e5964f7c9b1def3c05ac885f~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

图片中圈出来的步骤表明，渲染器也是在这一步，将 **Scene** 中的物体分别添加到不同的对象字典中去。为后续的渲染流程做准备。

#### 开始渲染啦

这里跳过阴影和背景的渲染解析，因为我们的例子中并没有添加阴影和背景，主要去查看物体的渲染。

##### renderScene渲染物体

在 **projectObject** 步骤时，会把 **Scene** 中需要渲染的物体根据材料的特性，分为不透明物体（opaque）、透明物体(transissive)、透射物体(transparent)，并添加到 currentRenderList 实例挂载的三个数组内。在进行 **renderScene** 步骤时，渲染器会从 currentRenderList 中取出这三个数组属性，去分别进行渲染。

![202211231706869.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a68713c2465f4675aa4f3ce4d25078cb~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

物体的渲染，最终会走到 **renderObjects** 这个方法。**renderObjects** 方法比较简单，这里就不贴 **renderObjects** 的源码了。它的职责是对3D对象数组的遍历渲染，当3D对象与相机处在同一图层时，再去渲染对象。在数组遍历的过程中，渲染的单元方法**renderBufferDirect**。

![renderScene.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2da93f2b3b73449187566f5325289df9~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

##### renderBufferDirect

根据流程图，真正执行渲染的方法 **renderBufferDirect** ，这里分成了一下几个步骤

1. 检查渲染流程是否合法，不合法退出渲染。
2. 绑定目标对象的缓冲数据，主要包括顶点属性的 Buffer和元素索引的 Buffer，参考[bindBuffer](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FAPI%2FWebGLRenderingContext%2FbindBuffer "https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bindBuffer")。或者更新缓冲数据的起始范围，参考[bufferData](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FAPI%2FWebGLRenderingContext%2FbufferData "https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData")
3. 计算渲染点数的开始位置和数量。最后提供给WebGL的原生api [drawArrays](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FWebGLRenderingContext%2FdrawArrays "https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays") 和 [drawArraysInstanced](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FWebGL2RenderingContext%2FdrawArraysInstanced "https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced")使用。
4. 绑定步骤3中的两个api的另外一个参数mode，告诉gpu需要渲染什么类型的3D图形。
5. 调用原生api渲染物体或者物体数组。

js

 代码解读

复制代码

`this.renderBufferDirect = function (camera, scene, geometry, material, object, group) {    // a.Check to determine whether the rendering can continue       // b.Bind geometry     bindingStates.setup(object, material, program, geometry, index);    let attribute;    let renderer = bufferRenderer; ​    if (index !== null) {       attribute = attributes.get(index);       renderer = indexedBufferRenderer;       renderer.setIndex(attribute);    } // ​    // c. Calculate drawCount, drawStart and drawEnd     const drawStart = Math.max(rangeStart, groupStart);     const drawEnd = Math.min(dataCount, rangeStart + rangeCount, groupStart + groupCount) - 1;     const drawCount = Math.max(0, drawEnd - drawStart + 1);      // d. bind mode    if (object.isMesh) {       if (material.wireframe === true) {          state.setLineWidth(material.wireframeLinewidth * getTargetPixelRatio());          renderer.setMode(_gl.LINES);       } else {          renderer.setMode(_gl.TRIANGLES);       }    } else if (object.isLine) {      // the same with above    } else if (object.isPoints) {       renderer.setMode(_gl.POINTS);    } else if (object.isSprite) {       renderer.setMode(_gl.TRIANGLES);    }      // f. draw element or arrays with gl    if (object.isInstancedMesh) {       renderer.renderInstances(drawStart, drawCount, object.count);    } else if (geometry.isInstancedBufferGeometry) {       const instanceCount = Math.min(geometry.instanceCount, geometry._maxInstanceCount);       renderer.renderInstances(drawStart, drawCount, instanceCount);    } else {       renderer.render(drawStart, drawCount);    } }; // Compile`

这里的 render 对象是 **WebGLBufferRenderer** 的实例，作为全局对象一直常驻在内存中。在每次物体的渲染中，负责调用 **WebGL2RenderingContext** 的api [drawArraysInstanced](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FWebGL2RenderingContext%2FdrawArraysInstanced "https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced") 和 [drawArrays](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FWebGLRenderingContext%2FdrawArrays "https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays") 去真正渲染物体，同时也对 [drawArraysInstanced](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FWebGL2RenderingContext%2FdrawArraysInstanced "https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced") api做了兼容处理（WebGL2 和 WebGL）

#### 后处理

参看前文的整体渲染流程图，主要分为以下三个步骤。因为比较简单，相信各位看官应该可以理解。

1. 清理过程变量
2. 清理 currentRenderState
3. 清理 currentRenderList

### 结语

到这里我们已经把示例中的整个渲染流程大致过了一遍，参照 [WebGL源码](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fmdn%2Fdom-examples%2Fblob%2Fmain%2FWebGL-examples%2Ftutorial%2Fsample4%2FWebGL-demo.js "https://github.com/mdn/dom-examples/blob/main/WebGL-examples/tutorial/sample4/WebGL-demo.js")，也在 ThreeJs 的源码中或多或少的发现了着色器、着色器变量的影子。但是篇幅所限，下次再具体学习溜。

  


