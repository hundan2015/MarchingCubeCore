import { Point, Face } from "./Points";
let adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw Error("Could'nt request WebGPU adapter.");
let device = await adapter.requestDevice();

export let marchingCubeGPU = (): Face[] => {
    let computeShader: string = ``;
    var module = device.createShaderModule({
        code: computeShader,
    });
    var bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage",
                },
            },
        ],
    });

    return [];
};
