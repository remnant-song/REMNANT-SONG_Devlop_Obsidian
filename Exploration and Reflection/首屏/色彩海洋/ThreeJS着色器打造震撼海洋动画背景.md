[ThreeJS着色器打造震撼海洋动画背景 - 知乎](https://zhuanlan.zhihu.com/p/54898150)
高颜值的网页往往能够吸引更多的用户，随着用户审美的提高，普通的图片拼凑的网站已经很难引起用户的兴趣，将一些动画用在网页中往往更能吸引眼球。下面介绍如何使用WebGL渲染器实现震撼的动画效果。

## 1. 选择着色器

[shadertoy](https://link.zhihu.com/?target=https%3A//www.shadertoy.com/)是一个着色器分享交流的网站，网站有很多附带源码的着色器，我们可以选择自己喜欢的着色器，实现酷炫的动画背景。我以一款[大海效果的着色器](https://link.zhihu.com/?target=https%3A//www.shadertoy.com/view/Ms2SD1)作为示例，源码如下：

```text
/*
 * "Seascape" by Alexander Alekseev aka TDM - 2014
 * License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Contact: tdmaav@gmail.com
 */

const int NUM_STEPS = 8;
const float PI      = 3.141592;
const float EPSILON = 1e-3;
#define EPSILON_NRM (0.1 / iResolution.x)

// sea
const int ITER_GEOMETRY = 3;
const int ITER_FRAGMENT = 5;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.1,0.19,0.22);
const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6);
#define SEA_TIME (1.0 + iTime * SEA_SPEED)
const mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

// math
mat3 fromEuler(vec3 ang) {
    vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
    m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
    m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
    return m;
}
float hash( vec2 p ) {
    float h = dot(p,vec2(127.1,311.7)); 
    return fract(sin(h)*43758.5453123);
}
float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );    
    vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// lighting
float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}
float specular(vec3 n,vec3 l,vec3 e,float s) {    
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = max(e.y,0.0);
    return vec3(pow(1.0-e.y,2.0), 1.0-e.y, 0.6+(1.0-e.y)*0.4);
}

// sea
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);        
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;

    float d, h = 0.0;    
    for(int i = 0; i < ITER_GEOMETRY; i++) {        
        d = sea_octave((uv+SEA_TIME)*freq,choppy);
        d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
        uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;

    float d, h = 0.0;    
    for(int i = 0; i < ITER_FRAGMENT; i++) {        
        d = sea_octave((uv+SEA_TIME)*freq,choppy);
        d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
        uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
    float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
    fresnel = pow(fresnel,3.0) * 0.65;

    vec3 reflected = getSkyColor(reflect(eye,n));    
    vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.12; 

    vec3 color = mix(refracted,reflected,fresnel);

    float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;

    color += vec3(specular(n,l,eye,60.0));

    return color;
}

// tracing
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);    
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  
    float tm = 0.0;
    float tx = 1000.0;    
    float hx = map(ori + dir * tx);
    if(hx > 0.0) return tx;   
    float hm = map(ori + dir * tm);    
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm,tx, hm/(hm-hx));                   
        p = ori + dir * tmid;                   
        float hmid = map(p);
        if(hmid < 0.0) {
            tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}

// main
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;    
    float time = iTime * 0.3 + iMouse.x*0.01;

    // ray
    vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);    
    vec3 ori = vec3(0.0,3.5,time*5.0);
    vec3 dir = normalize(vec3(uv.xy,-2.0)); dir.z += length(uv) * 0.15;
    dir = normalize(dir) * fromEuler(ang);

    // tracing
    vec3 p;
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8)); 

    // color
    vec3 color = mix(
        getSkyColor(dir),
        getSeaColor(p,n,light,dir,dist),
        pow(smoothstep(0.0,-0.05,dir.y),0.3));

    // post
    fragColor = vec4(pow(color,vec3(0.75)), 1.0);
}
```

## 2. 根据GLSL语法调整着色器代码

由于shadertoy上用的语言和GLSL有些区别，下载下来的源码是不能直接当片元着色器来使用的，还需要进行一下改动。

## 1) 入口函数

- 入口函数由mainImage改为main
- 由于GLSL有内置输出变量gl_FragColor和内置输入变量gl_FragCoord，去掉入口函数的参数fragColor 和 fragCoord

```text
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  ...
}
```

改为

```text
void main() {
  ...
}
```

## 2) fragCoord 替换为内置输入变量 gl_FragCoord

```text
vec2 uv = fragCoord.xy / iResolution.xy;
```

改为

```text
vec2 uv = gl_FragCoord.xy / iResolution.xy;
```

## 3) fragCoord 替换为内置输出变量 gl_FragColor

```text
fragColor = vec4(pow(color,vec3(0.75)), 1.0);
```

改为

```text
gl_FragColor = vec4(pow(color,vec3(0.75)), 1.0);
```

## 4) 定义着色器需要的uniform变量

- uniform变量是全局且只读的,在整个shader执行完毕前其值不会改变,他可以和任意基本类型变量组合
- 一般我们使用uniform变量来放置外部程序传递来的环境数据(如点光源位置,模型的变换矩阵等等)

```text
// 时间
uniform float iTime;
// 分辨率
uniform vec2 iResolution;
// 鼠标位置
uniform vec2 iMouse;
```

  

ThreeJS在创建[THREE.ShaderMaterial](https://zhida.zhihu.com/search?content_id=100329331&content_type=Article&match_order=1&q=THREE.ShaderMaterial&zhida_source=entity)对象时传入uniform变量，示例：

```js
var material = new THREE.ShaderMaterial( {
  uniforms: {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(300.0, 200.0) }
  },
  ...
});
```

## 3. 将着色器代码作为片元着色器脚本添加到网页

```text
<script id="fragmentShader" type="x-shader/x-fragment">
// 时间
uniform float iTime;
// 分辨率
uniform vec2 iResolution;
// 鼠标位置
uniform vec2 iMouse;

const int NUM_STEPS = 8;
const float PI      = 3.141592;
const float EPSILON = 1e-3;
#define EPSILON_NRM (0.1 / iResolution.x)

...

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    ...
    // post
    gl_FragColor = vec4(pow(color,vec3(0.75)), 1.0);
}
</script>
```

## 4. 顶点着色器脚本添加到网页

```text
<script id="vertexShader" type="x-shader/x-vertex">
void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
</script>
```

## 5. 添加JS脚本

利用three.js实现效果

```js
<script type="text/javascript">
var width = window.innerWidth; // 画布的宽度
var height = window.innerHeight; // 画布的高度

// 渲染器
var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(width, height);
// 将canvas添加到指定元素
var element = document.getElementById('seaBackground');
element.appendChild(renderer.domElement);

// 场景
var scene = new THREE.Scene();
// 摄像机
var camera = new THREE.PerspectiveCamera(45, width/height, 1, 2000);
camera.position.set(0,0,360);
scene.add(camera);

// 传递给着色器的uniform参数
var uniforms = {
    iTime: { value: 1.0 },
    iResolution: { value: new THREE.Vector2(width * 1.0, height * 1.0)},
    iMouse: { value: new THREE.Vector2(0.0, 0.0) }
}
// 材质
var material = new THREE.ShaderMaterial( {
    // 着色器 uniform 参数
    uniforms: uniforms,
    // 顶点着色器文本内容
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    // 片元着色器文本内容
    fragmentShader: document.getElementById('fragmentShader').textContent
});
// 平面几何体
var geom = new THREE.PlaneBufferGeometry(width, height);
// 网格对象
var mesh = new THREE.Mesh( geom, material );
scene.add(mesh);


/* 利用requestAnimationFrame实现动画 */
var clock = new THREE.Clock(); // 时钟
(function animate() {
    requestAnimationFrame( animate );

    var delta = clock.getDelta(); // 获取本次和上次的时间间隔
    uniforms.iTime.value += delta; // 设置着色器使用的 iTime 参数
    renderer.render( scene, camera ); // 重新渲染
})();

/* 监听鼠标移动，并改变着色器使用的 iMouse 参数 */
var mouseStartPosition = null; // 鼠标起始位置
window.addEventListener("mousemove", function (event) {
    if (!mouseStartPosition) {
        mouseStartPosition = {x: event.clientX, y: event.clientY}
    } else {
        uniforms.iMouse.value.x = event.clientX - mouseStartPosition.x;
        uniforms.iMouse.value.y = event.clientY - mouseStartPosition.y;
    }
})
</script>
```

## 6. 调整着色器效果

将动画添加到页面会发现转动速度太快，让人有晕眩感，这时可以修改着色器的代码调整动画效果。

```text
float time = iTime * 0.3 + iMouse.x * 0.01;
```

改为

```text
float time = iTime * 0.1 + iMouse.x * 0.001;
```

## 7. 示例页面

![](https://pic3.zhimg.com/v2-10caae99056b1426d86e0203fb43cb72_1440w.jpg)

[查看示例](https://link.zhihu.com/?target=https%3A//liulinsp.github.io/ocean.html)