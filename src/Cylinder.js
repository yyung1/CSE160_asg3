class Cylinder {
  constructor() {
    this.type = 'Cylinder';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 24;
    this.textureNum = -2;

    this.vertexBuffer = null;
    this.vertices = null;
    this.indicesCount = 0;
    this.initVertices();
  }

  initVertices() {
    // We will build an array of all triangle vertices for:
    // 1) The top circle (fan),
    // 2) The bottom circle (fan),
    // 3) The cylindrical side (two triangles per segment).
    // Then we’ll do the same for the UVs (optional).
    //
    // If you do not care about UV mapping, you could skip it,
    // or just fill them with dummy values.

    const posArray = []; // position x,y,z
    const uvArray = [];  // u,v
    const seg = this.segments;

    // ------------------ Top Circle (fan) ------------------
    // For each segment i, we create a triangle from center => edge i => edge i+1
    for (let i = 0; i < seg; i++) {
      let theta     = (2 * Math.PI * i) / seg;
      let nextTheta = (2 * Math.PI * (i + 1)) / seg;

      // top center is (0,1,0)
      // edge1 is (cos(theta),1,sin(theta))
      // edge2 is (cos(nextTheta),1,sin(nextTheta))
      let cx = 0.0, cy = 1.0, cz = 0.0;
      let x1 = Math.cos(theta),     y1 = 1.0, z1 = Math.sin(theta);
      let x2 = Math.cos(nextTheta), y2 = 1.0, z2 = Math.sin(nextTheta);

      // push this triangle’s positions
      posArray.push(cx,cy,cz, x1,y1,z1, x2,y2,z2);

      // if you want some top-circle UV mapping, you can do something simple:
      // center => (0.5, 0.5), edge => mapped by angle
      uvArray.push(
        0.5, 0.5,
        0.5 + 0.5 * Math.cos(theta),     0.5 + 0.5 * Math.sin(theta),
        0.5 + 0.5 * Math.cos(nextTheta), 0.5 + 0.5 * Math.sin(nextTheta)
      );
    }

    // ----------------- Bottom Circle (fan) -----------------
    for (let i = 0; i < seg; i++) {
      let theta     = (2 * Math.PI * i) / seg;
      let nextTheta = (2 * Math.PI * (i + 1)) / seg;

      // bottom center is (0,0,0)
      // BUT we’ll do it in the same winding order or the triangles face outward
      // A typical way is center => nextEdge => thisEdge, reversing to keep consistent face direction
      let bx = 0.0, by = 0.0, bz = 0.0;
      let x1 = Math.cos(theta),     y1 = 0.0, z1 = Math.sin(theta);
      let x2 = Math.cos(nextTheta), y2 = 0.0, z2 = Math.sin(nextTheta);

      posArray.push(bx,by,bz, x2,y2,z2, x1,y1,z1);

      // similarly for UV if you want
      uvArray.push(
        0.5, 0.5,
        0.5 + 0.5 * Math.cos(nextTheta), 0.5 + 0.5 * Math.sin(nextTheta),
        0.5 + 0.5 * Math.cos(theta),     0.5 + 0.5 * Math.sin(theta)
      );
    }

    // ------------------ Sides ------------------
    // Each segment is two triangles. We have points:
    // top1 = (cosθ, 1, sinθ),
    // bot1 = (cosθ, 0, sinθ),
    // top2 = (cos nextθ, 1, sin nextθ),
    // bot2 = (cos nextθ, 0, sin nextθ).
    for (let i = 0; i < seg; i++) {
      let theta     = (2 * Math.PI * i) / seg;
      let nextTheta = (2 * Math.PI * (i + 1)) / seg;

      let xT1 = Math.cos(theta),     yT1 = 1.0, zT1 = Math.sin(theta);
      let xB1 = Math.cos(theta),     yB1 = 0.0, zB1 = Math.sin(theta);
      let xT2 = Math.cos(nextTheta), yT2 = 1.0, zT2 = Math.sin(nextTheta);
      let xB2 = Math.cos(nextTheta), yB2 = 0.0, zB2 = Math.sin(nextTheta);

      // Triangle 1: top1 -> bottom1 -> bottom2
      posArray.push(xT1,yT1,zT1, xB1,yB1,zB1, xB2,yB2,zB2);
      // Triangle 2: top1 -> bottom2 -> top2
      posArray.push(xT1,yT1,zT1, xB2,yB2,zB2, xT2,yT2,zT2);

      // UV: We can do a “wrap” around the side (u from 0..1, v from 0..1).
      // e.g. each segment is 1/segments wide in the u direction.
      let u  = i/seg,     u2 = (i+1)/seg;
      // top => v=1, bottom => v=0
      // For the first triangle:
      uvArray.push(
        u,1,   u,0,   u2,0   // (top1 => (u,1), bottom1 => (u,0), bottom2 => (u2,0))
      );
      // second triangle:
      uvArray.push(
        u,1,   u2,0,  u2,1
      );
    }

    // Convert to typed arrays
    const posTyped = new Float32Array(posArray);
    const uvTyped  = new Float32Array(uvArray);

    this.indexCount = posTyped.length / 3; // each vertex has x,y,z => 3 floats

    // ---------- Create GL buffers once ----------
    // 1) Position buffer
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, posTyped, gl.STATIC_DRAW);

    // 2) UV buffer
    this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvTyped, gl.STATIC_DRAW);
  }

  render() {
    // 1) Set the uniform for which texture to use
    gl.uniform1i(u_whichTexture, this.textureNum);

    // 2) Set the main color uniform
    let c = this.color;
    gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);

    // 3) Set the matrix uniform
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // ---------- Position attribute ----------
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // ---------- UV attribute ----------
    // Even if you’re not currently using uv in the shader, setting it to something is good if you plan to do textured cylinders
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    // Finally, draw all triangles at once
    gl.drawArrays(gl.TRIANGLES, 0, this.indexCount);
  }
}
