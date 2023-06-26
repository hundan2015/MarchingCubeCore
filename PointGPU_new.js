import { edgeTable, triTable } from "./table.js";
import { computeShader } from "./ComputeShader.js";
let adapter = await navigator.gpu.requestAdapter();
if (!adapter)
    throw Error("Could'nt request WebGPU adapter.");
let device = await adapter.requestDevice();
export let marchingCubeGPU = async (points, size, isoLevel) => {
    var module = device.createShaderModule({
        code: computeShader,
    });
    // Create bind group layout.
    var bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" },
            },
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" },
            },
            {
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" },
            },
            {
                binding: 5,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" },
            },
            //test
            {
                binding: 6,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" },
            },
        ],
    });
    var pipeline = device.createComputePipeline({
        compute: { module: module, entryPoint: "main" },
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        }),
    });
    // Create buffer.
    const RESULT_BUFFER_SIZE = points.length * 4 * 3 * 12;
    const POINTS_BUFFER_SIZE = 16 * points.length;
    const EDGE_TABLE_BUFFER_SIZE = 4 * edgeTable.length;
    const TRI_TABLE_BUFFER_SIZE = 4 * triTable.length;
    var triTableBuffer = device.createBuffer({
        size: TRI_TABLE_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var edgeTableBuffer = device.createBuffer({
        size: EDGE_TABLE_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var pointsBuffer = device.createBuffer({
        size: POINTS_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var resultsBuffer = device.createBuffer({
        size: RESULT_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    var isoBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    var sizeBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    //test buffer
    var testTriangleIndexBuffer = device.createBuffer({
        size: points.length * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    // Write to buffer.
    device.queue.writeBuffer(triTableBuffer, 0, triTable);
    device.queue.writeBuffer(edgeTableBuffer, 0, edgeTable);
    device.queue.writeBuffer(isoBuffer, 0, new Float32Array([isoLevel]));
    device.queue.writeBuffer(sizeBuffer, 0, new Uint32Array([size]));
    let pointTableData = new ArrayBuffer(16 * points.length);
    let pointTableDataview = new DataView(pointTableData);
    for (var i = 0; i < points.length; i++) {
        pointTableDataview.setFloat32(i * 16, points[i].position.x, true);
        pointTableDataview.setFloat32(i * 16 + 4, points[i].position.y, true);
        pointTableDataview.setFloat32(i * 16 + 8, points[i].position.z, true);
        pointTableDataview.setFloat32(i * 16 + 12, points[i].value, true);
    }
    //console.log(new Float32Array(pointTableData));
    device.queue.writeBuffer(pointsBuffer, 0, pointTableData);
    // Create staging buffer.
    var stagingBuffer = device.createBuffer({
        size: points.length * 4 * 3 * 12,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    // Create bind group.
    var bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: triTableBuffer },
            },
            {
                binding: 1,
                resource: { buffer: edgeTableBuffer },
            },
            {
                binding: 2,
                resource: { buffer: pointsBuffer },
            },
            {
                binding: 3,
                resource: { buffer: resultsBuffer },
            },
            {
                binding: 4,
                resource: { buffer: isoBuffer },
            },
            {
                binding: 5,
                resource: { buffer: sizeBuffer },
            },
            // tests
            {
                binding: 6,
                resource: { buffer: testTriangleIndexBuffer },
            },
        ],
    });
    var commandEncoder = device.createCommandEncoder();
    var passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(256, 256, 256);
    passEncoder.end();
    commandEncoder.copyBufferToBuffer(resultsBuffer, 0, stagingBuffer, 0, RESULT_BUFFER_SIZE);
    var commands = commandEncoder.finish();
    device.queue.submit([commands]);
    await stagingBuffer.mapAsync(GPUMapMode.READ, 0, RESULT_BUFFER_SIZE);
    var copyArrayBuffer = stagingBuffer.getMappedRange(0, RESULT_BUFFER_SIZE);
    var data = copyArrayBuffer.slice(0, RESULT_BUFFER_SIZE);
    stagingBuffer.unmap();
    let temp = new Float32Array(data);
    var count = 0;
    let temp2 = new Float32Array(temp.length);
    for (var i = 0; i < temp.length; i += 9) {
        let isGood = false;
        for (var j = 0; j < 9; j++) {
            temp2[count + j] = temp[i + j];
            if (temp[i + j] != 0) {
                isGood = true;
                //break;
            }
        }
        if (isGood)
            count += 9;
    }
    temp = new Float32Array(temp2.slice(0, count));
    for (var i = 0; i < temp.length; i++) {
        temp[i] -= size / 2;
    }
    console.log(temp);
    return temp;
};
