[三木的创意空间 - 3D交互体验展示](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7)

先看效果：![](https://threejs3d.com/_next/static/media/2026-02-28-Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7-1.73bbcff2.png)

![](https://threejs3d.com/_next/static/media/Kapture%202026-02-28%20at%2021.03.33.737badf7.gif)这是纯浏览器渲染，Three.js + GLSL Shader，没有用任何贴图，所有细节——波浪、光斑、泡沫、大气雾——全部实时计算生成。

下面拆解它是怎么做的。

---

### 为什么普通海面看起来像塑料？[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E4%B8%BA%E4%BB%80%E4%B9%88%E6%99%AE%E9%80%9A%E6%B5%B7%E9%9D%A2%E7%9C%8B%E8%B5%B7%E6%9D%A5%E5%83%8F%E5%A1%91%E6%96%99)

网上大多数 Three.js 海面 demo 都有一个共同问题：**太规则、太光滑、太"数学"**。

原因很简单：只用了正弦波叠加，法线是几何法线，没有微观扰动。海水的真实感来自**无数尺度的随机性同时存在**——大涌浪、中等波纹、毛细波、泡沫，每一层都在动，相互叠加。

这份代码解决这个问题用了两个核心手段：**Gerstner 波 + 多层噪声法线扰动**。

---

### 第一步：Gerstner 波——让波形物理正确[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E7%AC%AC%E4%B8%80%E6%AD%A5gerstner-%E6%B3%A2%E8%AE%A9%E6%B3%A2%E5%BD%A2%E7%89%A9%E7%90%86%E6%AD%A3%E7%A1%AE)

普通正弦波只在 Y 轴上下运动。真实的海浪，水面颗粒走的是**椭圆轨迹**，波峰尖、波谷平，这就是 Gerstner 波的特征。

```
vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {  float steepness = wave.z;   // 陡度：0=平缓，1=破碎  float wavelength = wave.w;  // 波长  float k = 2.0 * PI / wavelength;  float c = sqrt(GRAVITY / k); // 相速度，基于真实物理  vec2  d = normalize(wave.xy); // 传播方向  float f = k * (dot(d, p.xz) - c * uTime);  float a = steepness / k;      // 振幅   // XZ 水平位移（产生波峰尖锐感）  return vec3(    d.x * a * cos(f),    a * sin(f),        // Y 垂直位移    d.y * a * cos(f)  );}
```

代码里叠加了 **12 条 Gerstner 波**，分三组：

- **大涌浪**（波长 70~140）：主要起伏，决定整体海况
- **交叉涌浪**（波长 28~48）：不同方向的波互相干涉，破坏对称感
- **中短波**（波长 16~24）：增加波峰锯齿感

12 条叠完，波形已经很自然了。但还不够——Gerstner 波本质上是周期函数，放大看仍然有规律感。

所以在几何层还叠加了一层 **FBM 值噪声**扰动，专门打破这种规律性：

```
// 垂直方向噪声：增加随机起伏vec3 nc1 = position * 0.015 + vec3(uTime * 0.35, 0.0, uTime * 0.22);float heightNoise = (vfbm(nc1) - 0.5) * 2.0;totalDisp.y += heightNoise * 2.2; // 水平方向噪声：产生有机感的横向扭动vec3 nc2 = position * 0.01 + vec3(-uTime * 0.12, 0.0, uTime * 0.08);totalDisp.x += (vfbm(nc2) - 0.5) * 0.9;totalDisp.z += (vfbm(nc2 + vec3(4.7, 1.3, 6.1)) - 0.5) * 0.9;
```

最后用 `tanh` 压缩波峰，防止噪声叠加导致尖刺穿帮：

```
// tanh 把超出范围的波峰柔和地压回去float softFactor = 3.5;totalDisp.y = tanh(totalDisp.y / softFactor) * softFactor;
```

---

### 第二步：5 层法线扰动——消灭塑料感的关键[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E7%AC%AC%E4%BA%8C%E6%AD%A55-%E5%B1%82%E6%B3%95%E7%BA%BF%E6%89%B0%E5%8A%A8%E6%B6%88%E7%81%AD%E5%A1%91%E6%96%99%E6%84%9F%E7%9A%84%E5%85%B3%E9%94%AE)

几何形状做好了，但看起来还是会发亮发光，像塑料。

原因是**法线太平滑**。真实海面的法线在微观上是混乱的，风吹过去会产生毛细波，每一层都在以不同速度、不同方向移动。

Fragment Shader 里叠加了 **5 层法线扰动**，从中波纹到毛细波：

```
// 先做域扭曲（Domain Warp）：用噪声扭曲采样坐标，避免直线感vec3 warp = vec3(  snoise(vWorldPosition * 0.02 + vec3(wt, 0.0, wt * 0.7)),  0.0,  snoise(vWorldPosition * 0.02 + vec3(0.0, wt, -wt * 0.5))) * 3.0; // Layer 1: 中等波纹（沿主风向）vec3 p1 = vWorldPosition * 0.07 + warp * 0.3 + vec3(t1, 0.0, t1 * 0.65);float r1x = fbm(p1); // Layer 3: 微波纹（高频）vec3 p3 = vWorldPosition * 0.45 + vec3(t3 * 0.4, 0.0, -t3 * 0.25);float r3x = snoise(p3) * 0.35; // Layer 5: 超细节（消除任何残留平滑感）vec3 p5 = vWorldPosition * 1.8 + vec3(t5 * 0.15, 0.0, -t5 * 0.1);float r5x = snoise(p5) * 0.15; // 所有层合并，以 45% 权重混入几何法线vec3 noiseNormal = normalize(noiseOffset);N = normalize(mix(N, noiseNormal, 0.45));
```

频率越高的层，振幅越小。**域扭曲**（Domain Warp）是这里最关键的一步——它让噪声坐标本身也在变形，产生那种有机的、非线性的流动感，这是直接采样噪声做不到的。

---

### 第三步：Fresnel + 天空反射——海面的"灵魂"[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E7%AC%AC%E4%B8%89%E6%AD%A5fresnel--%E5%A4%A9%E7%A9%BA%E5%8F%8D%E5%B0%84%E6%B5%B7%E9%9D%A2%E7%9A%84%E7%81%B5%E9%AD%82)

有了正确的法线，下一步是让光照对了。

海面最标志性的视觉特征是**随视角变化的反射率**：正对着看，能看透水下；斜着看，几乎全是天空的反射。这就是 Fresnel 效应。

```
// Schlick 近似公式，F0=0.02 对应水的折射率float fresnel = fresnelSchlick(NdotV, 0.02); // 天空颜色：从 CubeCamera 实时渲染的环境贴图采样vec3 reflectDir = reflect(-viewDir, N);vec3 envColor = textureCube(uEnvMap, reflectDir).rgb; // 水体颜色：深水深色、浅角度浅色vec3 waterColor = mix(uDeepColor, uShallowColor, depthFactor); // 用 Fresnel 混合两者vec3 color = mix(waterColor, envColor, fresnel);
```

主程序里用 `CubeCamera` 把天空实时渲染进一张 CubeMap，海面反射的就是真实的天空颜色，随太阳位置变化。

太阳光斑用了**三瓣高光叠加**，模拟光斑在微波纹里散射的效果：

```
float specSharp  = pow(NdotH, 512.0) * 4.0;  // 紧凑的太阳圆盘float specMedium = pow(NdotH, 128.0) * 0.6;  // 中等散射float specBroad  = pow(NdotH, 32.0)  * 0.15; // 宽泛光晕vec3 specular = uSunColor * (specSharp + specMedium + specBroad);
```

单一高光只有一个光斑，三瓣叠加才能模拟那种在细碎波纹里散开的太阳倒影。

---

### 第四步：各向异性泡沫——白帽浪的秘密[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E7%AC%AC%E5%9B%9B%E6%AD%A5%E5%90%84%E5%90%91%E5%BC%82%E6%80%A7%E6%B3%A1%E6%B2%AB%E7%99%BD%E5%B8%BD%E6%B5%AA%E7%9A%84%E7%A7%98%E5%AF%86)

泡沫是最难做对的部分，也是这份代码最用心的地方。

真实的海面泡沫不是圆形的，而是**沿风向拉伸的条带**，颗粒感明显，边缘模糊。代码里用了 **4 层各向异性噪声**叠加：

```
// 把世界坐标投影到风向和垂直风向，制造拉伸效果vec2 windDir  = normalize(vec2(0.85, 0.35));vec2 windPerp = vec2(-windDir.y, windDir.x); // 风向拉伸 6 倍，垂直方向压缩——泡沫条带就来自这里vec2 stretchA = vec2(  dot(worldXZ, windDir) * 0.06,   // 沿风向，坐标密度低 → 拉伸  dot(worldXZ, windPerp) * 0.22   // 垂直风向，坐标密度高 → 压缩); // 第 1 层：主条带float streak = snoise(vec3(stretchA + uTime * vec2(0.035, 0.015), uTime * 0.04));streak = smoothstep(0.30, 0.75, streak); // 第 3 层：蜂窝纹理，让泡沫有透气感（不是实心色块）float cell1 = abs(snoise(vec3(worldXZ * 0.5, uTime * 0.08)));float cell2 = abs(snoise(vec3(worldXZ * 1.0 + 5.3, uTime * 0.12)));float cellular = smoothstep(0.03, 0.20, cell1 * cell2); // 软梯度，非二值 // 最终：波峰因子 × 条带 × 蜂窝 → 泡沫只在波峰出现，且有有机纹理float foamBase = vFoamFactor * streak * cellular * 0.8;
```

`vFoamFactor` 来自 Vertex Shader，根据波高计算——只有波峰超过阈值才会出现泡沫，这和真实物理一致。

---

### 整体架构[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E6%95%B4%E4%BD%93%E6%9E%B6%E6%9E%84)

```
PlaneGeometry(4000×4000, 512×512 细分)    │    ├── Vertex Shader    │     ├── 12 条 Gerstner 波叠加    │     ├── FBM 噪声扰动（打破规律感）    │     └── tanh 波峰压缩    │    └── Fragment Shader          ├── 5 层多尺度法线扰动（域扭曲）          ├── Fresnel 反射          ├── 天空 CubeMap 反射          ├── 次表面散射（SSS）          ├── 三瓣太阳高光          ├── 4 层各向异性泡沫          └── 距离雾后处理：UnrealBloom（threshold=0.9，只让高光泛光）
```

---

### 直接跑起来[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E7%9B%B4%E6%8E%A5%E8%B7%91%E8%B5%B7%E6%9D%A5)

代码已整理，复制到 HTML 文件直接运行（依赖 CDN，无需安装）：

**在线预览**：jsfiddle.net/gz76849v

本地运行直接新建一个 `index.html`，把 HTML 部分贴进去，把 JS 部分放在 `<script type="module">` 标签内，浏览器打开即可。

---

### 几个可以直接调的参数[](https://threejs3d.com/concepts/shader/Three.js%E5%AE%9E%E7%8E%B0%E7%9C%9F%E5%AE%9E%E6%B5%B7%E9%9D%A2%E6%95%88%E6%9E%9C%E6%A0%B8%E5%BF%83%E5%B0%B1%E8%BF%99%E5%87%A0%E4%B8%AAShader%E6%8A%80%E5%B7%A7#%E5%87%A0%E4%B8%AA%E5%8F%AF%E4%BB%A5%E7%9B%B4%E6%8E%A5%E8%B0%83%E7%9A%84%E5%8F%82%E6%95%B0)

想改成自己想要的海况，只需要动这几个地方：

```
// 海面颜色const COLORS = {  deep:    new THREE.Color(0.0, 0.025, 0.08),  // 深水色  shallow: new THREE.Color(0.02, 0.18, 0.25),  // 浅水/透明色  fog:     new THREE.Color(0.55, 0.62, 0.72),  // 大气雾色}; // 太阳位置const SUN_CONFIG = {  elevation: 15,  // 0=地平线，90=正午  azimuth:   160, // 旋转角度}; // Bloom 后处理const bloomPass = new UnrealBloomPass(  size, 0.25, 0.5, 0.90 // strength, radius, threshold);
```

把 `elevation` 改到 5，就是黄昏；`deep` 颜色改成墨绿，就是热带浅海。

这份代码最值得学习的地方不是某一个技术点，而是**渲染分层的思路**：每一层单独看都很简单，但叠加起来就有了照片级的复杂度。这也是写好 Shader 的核心方法。