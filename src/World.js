let distanceFromCamera = 0;

class World {
  constructor(sizeX, sizeY, sizeZ, chunkSize = 4, glinfo) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.chunkSize = chunkSize;
    this.blocks = new Map();
    this.chunks = new Map();
    this.gl = glinfo;
    this.transparencyEnabled = true;

    //this.loadSavedWorld();
  }

  getChunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  generateTerrain() {
    // Prevent re-generating
    if (this.blocks.size > 0) return;

    for (let x = -this.sizeX / 2; x < this.sizeX / 2; x++) {
      for (let z = -this.sizeZ / 2; z < this.sizeZ / 2; z++) {
        for (let layer = 0; layer < this.sizeY; layer++) {
          if (layer === 0) {
            // top layer
            this.addBlock("GRASS", [x, -1 - layer, z]);
            if (Math.random() < 0.01 && this.canPlaceTree(x, z, g_treePos)) {
              let tree = new Tree([x, 0, z]);
              tree.generate(this);
              g_treePos.push([x, z]);
            }
          } else {
            // subsequent layers
            this.addBlock("DIRT", [x, -1 - layer, z]);
          }
        }
      }
    }
  }

  addBlock(type, position) {
    const key = position.join(",");
    if (this.blocks.has(key)) return;

    let block = new Block(type, position);
    this.blocks.set(key, block);

    // Compute chunk coordinates.
    let cx = Math.floor(position[0] / this.chunkSize);
    let cz = Math.floor(position[2] / this.chunkSize);
    let chunkKey = this.getChunkKey(cx, cz);

    if (!this.chunks.has(chunkKey)) {
      this.chunks.set(chunkKey, []);
    }
    this.chunks.get(chunkKey).push(block);
  }

  removeBlock(position) {
    const key = position.join(",");
    if (!this.blocks.has(key)) return;

    let block = this.blocks.get(key);

    // Remove the entire tree
    if (block.type === "LOG") {
      new Tree(position).removeTree(this, position);
      return;
    }

    this.blocks.delete(key);

    let cx = Math.floor(position[0] / this.chunkSize);
    let cz = Math.floor(position[2] / this.chunkSize);
    let chunkKey = this.getChunkKey(cx, cz);

    if (this.chunks.has(chunkKey)) {
      let chunkBlocks = this.chunks.get(chunkKey);
      this.chunks.set(chunkKey, chunkBlocks.filter(block => block.position.join(",") !== key));
    }
  }


  getBlockAtCursor(camera) {
    // Use the camera’s position as the ray origin.
    const origin = camera.getPosition();

    // Get the normalized look direction.
    const direction = camera.getLookDirection();

    // Raymarching parameters
    const maxDistance = 100;
    const step = 0.1; // Step size along the ray

    // Start slightly ahead of the camera to avoid selecting the block too close
    for (let t = 0.1; t < maxDistance; t += step) {
      const x = origin[0] + direction[0] * t;
      const y = origin[1] + direction[1] * t;
      const z = origin[2] + direction[2] * t;

      // Convert world coordinates to voxel grid coordinates
      const blockX = Math.floor(x);
      const blockY = Math.floor(y);
      const blockZ = Math.floor(z);

      const key = `${blockX},${blockY},${blockZ}`;

      // Check if a block exists at this position
      if (this.blocks.has(key)) {
        return this.blocks.get(key); // Return first block
      }
    }
    // No block was hit within maxDistance
    return null;
  }

  intersectRayAABB(origin, direction, boxMin, boxMax) {
    let tmin = -Infinity, tmax = Infinity;

    for (let i = 0; i < 3; i++) {
      if (Math.abs(direction[i]) < 0.0001) {
        // Ray is nearly parallel to slab. No hit if origin not within slab.
        if (origin[i] < boxMin[i] || origin[i] > boxMax[i]) {
          return null;
        }
      } else {
        let t1 = (boxMin[i] - origin[i]) / direction[i];
        let t2 = (boxMax[i] - origin[i]) / direction[i];
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return { tmin: tmin, tmax: tmax };
  }

  getPlacementPosition(targetPosition, camera) {
    let boxMin = targetPosition;
    let boxMax = [targetPosition[0] + 1, targetPosition[1] + 1, targetPosition[2] + 1];

    let origin = camera.getPosition();
    let direction = camera.getLookDirection();

    let result = this.intersectRayAABB(origin, direction, boxMin, boxMax);

    if (!result || result.tmin < 0) {
      // Fallback: use sign of direction
      let placementNormal = [
        Math.sign(direction[0]),
        Math.sign(direction[1]),
        Math.sign(direction[2])
      ];
      return [
        targetPosition[0] + placementNormal[0],
        targetPosition[1] + placementNormal[1],
        targetPosition[2] + placementNormal[2]
      ];
    }

    let t = result.tmin;
    let hitPoint = [
      origin[0] + direction[0] * t,
      origin[1] + direction[1] * t,
      origin[2] + direction[2] * t
    ];

    let epsilon = 0.001;
    let normal = [0, 0, 0];

    if (Math.abs(hitPoint[0] - boxMin[0]) < epsilon) {
      normal = [-1, 0, 0];
    } else if (Math.abs(hitPoint[0] - boxMax[0]) < epsilon) {
      normal = [1, 0, 0];
    } else if (Math.abs(hitPoint[1] - boxMin[1]) < epsilon) {
      normal = [0, -1, 0];
    } else if (Math.abs(hitPoint[1] - boxMax[1]) < epsilon) {
      normal = [0, 1, 0];
    } else if (Math.abs(hitPoint[2] - boxMin[2]) < epsilon) {
      normal = [0, 0, -1];
    } else if (Math.abs(hitPoint[2] - boxMax[2]) < epsilon) {
      normal = [0, 0, 1];
    }

    return [
      targetPosition[0] + normal[0],
      targetPosition[1] + normal[1],
      targetPosition[2] + normal[2]
    ];
  }



  loadSavedWorld() {
    if (this.saveFileChecked) return; // Prevent multiple checks
    this.saveFileChecked = true;

    fetch("world.json")
      .then(response => {
        if (!response.ok) {
          throw new Error("No saved world found.");
        }
        return response.json();
      })
      .then(data => {
        this.blocks.clear();
        for (let entry of data) {
          let position = entry.position;
          let block = new Block(entry.type, position);
          this.blocks.set(position.join(","), block);
        }
        console.log("World loaded successfully!");
      })
      .catch(error => {
        console.log(error.message);
        this.generateTerrain(); // Generate terrain only if no save file
        this.saveWorldToFile(); // Save newly generated world
      });
  }


  saveWorldToFile() {
    let arr = [];
    for (let [key, block] of this.blocks) {
      arr.push({
        type: block.type,
        position: block.position
      });
    }

    let blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "world.json";
    a.click();
  }

  loadWorldFromFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const arr = JSON.parse(event.target.result);
      this.blocks.clear();

      for (let entry of arr) {
        let block = new Block(entry.type, entry.position); // Creates block with correct type
        this.blocks.set(entry.position.join(","), block);
      }
      console.log("World loaded from file!");
    };
    reader.readAsText(file);
  }


  isBlockVisible(x, y, z) {
    const key = `${x},${y},${z}`;
    return !this.blocks.has(key);
  }

  replaceBlock(position, newType) {
    const key = position.join(",");
    if (!this.blocks.has(key)) return;

    let newBlock = new Block(newType, position);
    this.blocks.set(key, newBlock);

    // Update chunk
    let cx = Math.floor(position[0] / this.chunkSize);
    let cz = Math.floor(position[2] / this.chunkSize);
    let chunkKey = this.getChunkKey(cx, cz);

    if (this.chunks.has(chunkKey)) {
      let chunkBlocks = this.chunks.get(chunkKey);
      for (let i = 0; i < chunkBlocks.length; i++) {
        if (chunkBlocks[i].position.join(",") === key) {
          chunkBlocks[i] = newBlock;
          break;
        }
      }
    }
  }

  canPlaceTree(x, z, treePositions) {
    let minDistance = 15;
    let camPos = camera.getPosition();

    for (let [tx, tz] of treePositions) {
      let distance = Math.sqrt((x - tx) ** 2 + (z - tz) ** 2);
      distanceFromCamera = Math.sqrt(
        Math.pow(x - camPos[0], 2) + Math.pow(z - camPos[2], 2)
      );
      if (distanceFromCamera < 8) return false;
      if (distance < minDistance) {
        return false;
      }
    }
    return true;
  }

  render() {
    let camPos = camera.getPosition();
    let renderDistance = camera.getRenderDistance();
    let bufferZone = camera.getBufferZone();
    let chunkRadius = Math.ceil(renderDistance / this.chunkSize);
    let camChunkX = Math.floor(camPos[0] / this.chunkSize);
    let camChunkZ = Math.floor(camPos[2] / this.chunkSize);

    for (let cx = camChunkX - chunkRadius; cx <= camChunkX + chunkRadius; cx++) {
      for (let cz = camChunkZ - chunkRadius; cz <= camChunkZ + chunkRadius; cz++) {
        let chunkKey = this.getChunkKey(cx, cz);
        if (!this.chunks.has(chunkKey)) continue;

        let chunkBlocks = this.chunks.get(chunkKey);
        for (let block of chunkBlocks) {
          block.render(this);
        }
      }
    }
  }


  renderSkybox(camera) {
    let camPos = camera.getPosition();
    let renderDistance = camera.getRenderDistance();
    let bufferZone = camera.getBufferZone();

    let skyboxSize = renderDistance - bufferZone;
    let topY = camera.cam.elements[1] + 16; // Keep it above the ground
    let groundY = -16;  // Groudn depth
    let bottomY = Math.min(groundY - 16, camera.cam.elements[1] - 16);
    let skyHeight = topY - bottomY;

    let skybox = new Cube();
    skybox.textureNum = -2;
    skybox.color = [0.5, 0.7, 1.0, 1.0];

    // Move the skybox with the camera
    skybox.matrix.setIdentity();
    skybox.matrix.translate(
      camPos[0] - skyboxSize / 2,
      bottomY,
      camPos[2] - skyboxSize / 2
    );
    skybox.matrix.scale(skyboxSize, skyHeight, skyboxSize);

    skybox.renderFace("top");
    skybox.renderFace("right");
    skybox.renderFace("left");
    skybox.renderFace("back");
    skybox.renderFace("front");
  }
}

class Tree {
  constructor(position) {
    this.position = position;
    this.logHeight = Math.floor(Math.random() * 4) + 3; // Random height
  }

  generate(world) {
    let [x, y, z] = this.position;
    let treeBlocks = [];

    // Ensure tree is placed on grass
    let belowKey = `${x},${y - 1},${z}`;
    if (!world.blocks.has(belowKey) || world.blocks.get(belowKey).type !== "GRASS") {
      return;
    }
    // Trunk
    for (let i = 0; i < this.logHeight; i++) {
      let pos = [x, y + i, z];
      let key = pos.join(",");
      let block = new Block("LOG", pos);
      world.blocks.set(key, block);
      treeBlocks.push(block);
    }
    let leafStart = y + 2;
    let leafEnd = y + this.logHeight + 2;
    const maxRadius = 3;

    let mid = (leafStart + leafEnd) / 2;

    for (let dy = leafStart; dy <= leafEnd; dy++) {
      let radius = maxRadius - Math.abs(dy - mid + 2);
      for (let dx = -maxRadius; dx <= maxRadius; dx++) {
        for (let dz = -maxRadius; dz <= maxRadius; dz++) {
          if ((dx * dx + dz * dz <= radius * radius) && dy < leafEnd - 1) {
            let pos = [x + dx, dy, z + dz];
            let key = pos.join(",");
            let block = new Block("LEAVES", pos);
            world.blocks.set(key, block);
            treeBlocks.push(block);
          }
        }
      }
    }
    for (let block of treeBlocks) {
      let cx = Math.floor(block.position[0] / world.chunkSize);
      let cz = Math.floor(block.position[2] / world.chunkSize);
      let chunkKey = world.getChunkKey(cx, cz);

      if (!world.chunks.has(chunkKey)) {
        world.chunks.set(chunkKey, []);
      }

      world.chunks.get(chunkKey).push(block);
    }
  }

  removeTree(world, startPos) {
    let treeBlocks = [];
    let queue = [startPos];
    let visited = new Set();

    while (queue.length > 0) {
      let pos = queue.pop();
      let key = pos.join(",");

      if (!world.blocks.has(key) || visited.has(key)) continue;
      visited.add(key);

      let block = world.blocks.get(key);
      if (block.type === "LOG" || block.type === "LEAVES") {
        treeBlocks.push(key);

        // Check adjacent positions
        queue.push([pos[0] + 1, pos[1], pos[2]]);
        queue.push([pos[0] - 1, pos[1], pos[2]]);
        queue.push([pos[0], pos[1] + 1, pos[2]]);
        queue.push([pos[0], pos[1] - 1, pos[2]]);
        queue.push([pos[0], pos[1], pos[2] + 1]);
        queue.push([pos[0], pos[1], pos[2] - 1]);
      }

    }

    // Delete all tree parts
    for (let key of treeBlocks) {
      let [bx, by, bz] = key.split(",").map(Number);
      world.blocks.delete(key);

      // Remove from chunk
      let cx = Math.floor(bx / world.chunkSize);
      let cz = Math.floor(bz / world.chunkSize);
      let chunkKey = world.getChunkKey(cx, cz);

      if (world.chunks.has(chunkKey)) {
        let chunkBlocks = world.chunks.get(chunkKey);
        world.chunks.set(chunkKey, chunkBlocks.filter(block => block.position.join(",") !== key));
      }
    }
  }
}