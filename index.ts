import * as THREE from "./node_modules/three/build/three.module.js";
//import * as THREE from "three";
import * as POINT from "./Points.js";
import * as POINTGPU from "./PointGPU_new.js";
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
console.log("Hi");
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BufferGeometry();
let points = POINT.getTestPoints(50, 60);
//let vertices = POINT.marchingCubeAlgorithum(points, 100, 60);
let promises = [];
for (var i = 0; i < points.length; i += 25000) {
    var tempPromise = POINTGPU.marchingCubeGPU(
        points.slice(i, i + 27500),
        50,
        50,
        11,
        30
    );
    promises.push(tempPromise);
}
Promise.all(promises).then((verticess) => {
    for (var vertices of verticess) {
        console.log("SHIIIIIIIIIIIIIIIIIIIT");
        console.log(vertices);
        if (vertices.length == 0) continue;
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(vertices, 3)
        );
        var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        material.wireframe = true;
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        vertices = undefined;
    }
});

camera.position.z = 70;

function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}
animate();
