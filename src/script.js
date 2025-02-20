import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


// Scene
const scene = new THREE.Scene()

const params = {};
params.count = 100000;
params.size = 0.01;
params.r = 5;
params.branches = 3;
params.spin = 1;
params.randomness = 0.2;
params.randomnessPower = 3;
params.insideColor = '#ff6030'
params.outsideColor = '#1b3984'

let geometry = null;
let material = null;
let points = null;
const generateGalaxy = () => {

    if (points !== null) {
        geometry.dispose();
        material.dispose();
        scene.remove(points);
    }

    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(params.count * 3);
    const colors = new Float32Array(params.count * 3);

    const colorInside = new THREE.Color(params.insideColor);
    const colorOutside = new THREE.Color(params.outsideColor);


    for (let i = 0; i < params.count; i++) {
        const i3 = i * 3;

        //position
        const r = Math.random() * params.r;
        const spinAngle = r * params.spin
        const branchAngle = (i % params.branches) / params.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

        positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        // color
        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, r / params.r)

        colors[i3 + 0] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    )
    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
    )

    material = new THREE.PointsMaterial(
        {
            size: params.size,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        }
    );

    points = new THREE.Points(geometry, material);
    scene.add(points);

}
generateGalaxy();

gui.add(params, 'count').min(100).max(100000).step(100).onFinishChange(generateGalaxy)
gui.add(params, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
gui.add(params, 'r').min(0.001).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(params, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(params, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
gui.add(params, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(params, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
gui.add(params, 'insideColor').onFinishChange(generateGalaxy)
gui.add(params, 'outsideColor').onFinishChange(generateGalaxy)

// Sizes

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Renderer

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// raycaster render

let N = 0;

document.getElementById('diameter').addEventListener('change', () => {
    N = document.getElementById('diameter').value;
})
document.getElementById('myForm').addEventListener('submit', (e) => {
    e.preventDefault();
});

window.addEventListener("click", (e) => {

    if (!e.target.closest('#myForm')){
        console.log(N)
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const particlePositions = points.geometry.attributes.position;
        const particleColors = points.geometry.attributes.color;

        let closestParticle = null;
        let minDistance = Infinity;

        for (let i = 0; i < particlePositions.count; i++) {
            const pos = new THREE.Vector3(
                particlePositions.getX(i),
                particlePositions.getY(i),
                particlePositions.getZ(i)
            );

            const distance = raycaster.ray.distanceToPoint(pos);

            if (distance < minDistance) {
                minDistance = distance;
                closestParticle = i;
            }
        }

        if (closestParticle !== null) {

            const color = new THREE.Color(Math.random(), Math.random(), Math.random());

            let distances = [];

            for (let i = 0; i < particlePositions.count; i++) {
                if (i === closestParticle) continue; // Пропускаем саму частицу

                const pos = new THREE.Vector3(
                    particlePositions.getX(i),
                    particlePositions.getY(i),
                    particlePositions.getZ(i)
                );

                const distance = pos.distanceTo(
                    new THREE.Vector3(
                        particlePositions.getX(closestParticle),
                        particlePositions.getY(closestParticle),
                        particlePositions.getZ(closestParticle)
                    )
                );

                distances.push({ index: i, distance });
            }
            distances.sort((a, b) => a.distance - b.distance);
            const nearestParticles = distances.slice(0, N);

            particleColors.setXYZ(closestParticle, color.r, color.g, color.b);
            nearestParticles.forEach(({ index }) => {
                particleColors.setXYZ(index, color.r, color.g, color.b);
            });

            particleColors.needsUpdate = true;
        }
    }
});

// Animate

const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()