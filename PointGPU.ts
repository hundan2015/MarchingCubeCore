import { Point, Face } from "./Points";
import { edgeTable, triTable } from "./table.js";
let adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw Error("Could'nt request WebGPU adapter.");
let device = await adapter.requestDevice();

export let marchingCubeGPU = (
    points: Point[],
    size: number,
    isoLevel: number
): Float32Array => {
    let computeShader: string = ``;
    var module = device.createShaderModule({
        code: computeShader,
    });
    var bindGroupLayout = device.createBindGroupLayout({
        entries: [
            //triangle table.
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage",
                },
            },
            // edge table.
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage",
                },
            },
            // point table.
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage",
                },
            },
            // face table.
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage",
                },
            },
        ],
    });
    var pipeline = device.createComputePipeline({
        compute: { module: module, entryPoint: "main" },
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        }),
    });
    // 6 = 3(vector)+3(number)
    let POINT_BUFFER_SIZE = points.length * 6;
    let TRIANGLE_TABLE_BUFFER_SIZE = triTable.length;
    let EDGE_TABLE_BUFFER_SIZE = edgeTable.length;
    let FACE_TABLE_BUFFER_SIZE = size * size * size * 4 * 9;
    var pointTableBuffer = device.createBuffer({
        size: POINT_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    var triangleTableBuffer = device.createBuffer({
        size: TRIANGLE_TABLE_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    var edgeTableBuffer = device.createBuffer({
        size: EDGE_TABLE_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    var faceTableBuffer = device.createBuffer({
        size: FACE_TABLE_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var faceTableStagingBuffer = device.createBuffer({
        size: FACE_TABLE_BUFFER_SIZE,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    var commandEncoder = device.createCommandEncoder();
    var passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.dispatchWorkgroups(1);
    passEncoder.end();
    commandEncoder.copyBufferToBuffer(
        faceTableBuffer,
        0,
        faceTableStagingBuffer,
        0,
        FACE_TABLE_BUFFER_SIZE
    );
    var commands = commandEncoder.finish();
    device.queue.submit([commands]);
    var copyArrayBuffer = faceTableStagingBuffer.getMappedRange(
        0,
        FACE_TABLE_BUFFER_SIZE
    );
    var data = copyArrayBuffer.slice(0, FACE_TABLE_BUFFER_SIZE);
    faceTableStagingBuffer.unmap();
    return new Float32Array(data);
};
