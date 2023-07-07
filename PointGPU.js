import { edgeTable, triTable } from "./table.js";
import { computeShader } from "./ComputeShader.js";
let adapter = await navigator.gpu.requestAdapter();
if (!adapter)
    throw Error("Could'nt request WebGPU adapter.");
let device = await adapter.requestDevice();
export let marchingCubeGPU = (points, length, width, height, isoLevel) => {
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
            {
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage",
                },
            },
            {
                binding: 5,
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
    let POINT_BUFFER_SIZE = points.length * 24;
    let TRIANGLE_TABLE_BUFFER_SIZE = triTable.length * 4;
    let EDGE_TABLE_BUFFER_SIZE = edgeTable.length * 4;
    let FACE_TABLE_BUFFER_SIZE = length * length * length * 4 * 9 * 4;
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
    // Setup basic info buffer.
    var isoLevelBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var lengthBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var widthBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var heightBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    // Initialize input buffer data.
    let pointTableData = new ArrayBuffer(POINT_BUFFER_SIZE);
    let pointTableDataview = new DataView(pointTableData);
    for (var i = 0; i < points.length; i++) {
        pointTableDataview.setFloat32(i * 24, points[i].position.x);
        pointTableDataview.setFloat32(i * 24 + 4, points[i].position.y);
        pointTableDataview.setFloat32(i * 24 + 8, points[i].position.z);
        pointTableDataview.setFloat32(i * 24 + 12, points[i].value);
    }
    device.queue.writeBuffer(pointTableBuffer, 0, pointTableData);
    device.queue.writeBuffer(triangleTableBuffer, 0, triTable);
    device.queue.writeBuffer(edgeTableBuffer, 0, triTable);
    let isoLevelData = new ArrayBuffer(4);
    const isoLevelDataview = new DataView(isoLevelData);
    isoLevelDataview.setFloat32(0, isoLevel);
    device.queue.writeBuffer(isoLevelBuffer, 0, isoLevelData);
    //
    let sizeData = new ArrayBuffer(4);
    const sizeDataview = new DataView(sizeData);
    sizeDataview.setUint32(0, length);
    device.queue.writeBuffer(lengthBuffer, 0, sizeData);
    // Create bind group
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: triangleTableBuffer,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: edgeTableBuffer,
                },
            },
            {
                binding: 2,
                resource: {
                    buffer: pointTableBuffer,
                },
            },
            {
                binding: 3,
                resource: {
                    buffer: faceTableBuffer,
                },
            },
            {
                binding: 4,
                resource: {
                    buffer: isoLevelBuffer,
                },
            },
            {
                binding: 5,
                resource: {
                    buffer: lengthBuffer,
                },
            },
        ],
    });
    var commandEncoder = device.createCommandEncoder();
    var passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(1);
    passEncoder.end();
    commandEncoder.copyBufferToBuffer(faceTableBuffer, 0, faceTableStagingBuffer, 0, FACE_TABLE_BUFFER_SIZE);
    var commands = commandEncoder.finish();
    device.queue.submit([commands]);
    var copyArrayBuffer = faceTableStagingBuffer.getMappedRange(0, FACE_TABLE_BUFFER_SIZE);
    var data = copyArrayBuffer.slice(0, FACE_TABLE_BUFFER_SIZE);
    faceTableStagingBuffer.unmap();
    return new Float32Array(data);
};
