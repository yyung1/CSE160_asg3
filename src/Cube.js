class Cube {
    constructor() {
        this.type = 'Cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        // The model transform for this cube
        this.matrix = new Matrix4();
        // Texture selector: -2 for flat color, 0 for fur, 1 for grass, 2 for dirt, etc.
        this.textureNum = -2;

        // Ensure that the static buffers are initialized.
        Cube.initBuffers(gl);
    }

    // Create static buffers for each face if not already created.
    static initBuffers(gl) {
        if (Cube.faceBuffers) return;  // Already initialized

        // Define vertices for each face of a unit cube (0 to 1)
        const faceData = {
            front: {
                vertices: [
                    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0
                ],
                uvs: [
                    0.0, 0.0, 1.0, 1.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0, 1.0, 1.0
                ]
            },
            back: {
                vertices: [
                    0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0,
                    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0
                ],
                uvs: [
                    0.0, 0.0, 1.0, 1.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0, 1.0, 1.0
                ]
            },
            left: {
                vertices: [
                    0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
                    0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0
                ],
                uvs: [
                    0.0, 0.0, 1.0, 1.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0, 1.0, 1.0
                ]
            },
            right: {
                vertices: [
                    1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0,
                    1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0
                ],
                uvs: [
                    0.0, 0.0, 1.0, 1.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0, 1.0, 1.0
                ]
            },
            top: {
                vertices: [
                    0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0,
                    0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0
                ],
                uvs: [
                    0.0, 0.0, 1.0, 1.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0, 1.0, 1.0
                ]
            },
            bottom: {
                vertices: [
                    0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0
                ],
                uvs: [
                    0.0, 0.0, 1.0, 1.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0, 1.0, 1.0
                ]
            }
        };

        Cube.faceData = faceData;

        Cube.faceBuffers = {};
        for (let face in faceData) {
            let data = faceData[face];
            // Create vertex buffer for this face.
            let vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

            // Create UV buffer for this face.
            let uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.uvs), gl.STATIC_DRAW);

            Cube.faceBuffers[face] = {
                vertexBuffer: vertexBuffer,
                uvBuffer: uvBuffer,
                nVertices: data.vertices.length / 3
            };
        }
    }

    // Render the full cube (all faces) by default.
    render() {
        gl.uniform1i(u_whichTexture, this.textureNum);
        const rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw every face.
        for (let face in Cube.faceBuffers) {
            let fb = Cube.faceBuffers[face];
            gl.bindBuffer(gl.ARRAY_BUFFER, fb.vertexBuffer);
            gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_Position);

            gl.bindBuffer(gl.ARRAY_BUFFER, fb.uvBuffer);
            gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_UV);

            gl.drawArrays(gl.TRIANGLES, 0, fb.nVertices);
        }
    }

    // Render only one face, specified by a string: "top", "bottom", "left", "right", "front", or "back".
    renderFace(face) {
        Cube.initBuffers(gl);
        gl.uniform1i(u_whichTexture, this.textureNum);
        const rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let fb = Cube.faceBuffers[face];
        if (!fb) {
            console.warn("Unknown face: " + face);
            return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, fb.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, fb.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.drawArrays(gl.TRIANGLES, 0, fb.nVertices);
    }
}
