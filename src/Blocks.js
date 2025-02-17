class Block {
    constructor(type, position) {
        this.type = type;
        this.position = position;
        this.grassDecay = null;
        this.grassGrowth = null;
    }

    checkGrassDecay() {
        let aboveKey = `${this.position[0]},${this.position[1] + 1},${this.position[2]}`;
        if (world.blocks.has(aboveKey)) {
            if (!this.grassDecay) {
                this.grassDecay = setTimeout(() => {
                    if (world.blocks.has(aboveKey)) {
                        this.turnToDirt();
                    } else {
                        this.grassDecay = null; // Reset if uncovered
                    }
                }, 2345);
            }
        } else {
            if (this.grassDecay) {
                clearTimeout(this.grassDecay);
                this.grassDecay = null;
            }
        }

    }

    checkDirtGrowth() {
        let aboveKey = `${this.position[0]},${this.position[1] + 1},${this.position[2]}`;

        if (!world.blocks.has(aboveKey)) {
            if (!this.growTimeout) {
                this.growTimeout = setTimeout(() => {
                    if (!world.blocks.has(aboveKey)) {
                        this.turnToGrass();
                    } else {
                        this.growTimeout = null; // Reset if covered
                    }
                }, 3000);
            }
        } else {
            if (this.growTimeout) {
                clearTimeout(this.growTimeout);
                this.growTimeout = null;
            }
        }
    }

    turnToDirt() {
        world.replaceBlock(this.position, "DIRT");
    }

    turnToGrass() {
        world.replaceBlock(this.position, "GRASS");
    }

    render() {
        if (this.type === "GRASS") {
            this.checkGrassDecay();
            let bottomCube = new Cube();
            bottomCube.textureNum = 2;
            bottomCube.matrix.setIdentity();
            bottomCube.matrix.translate(this.position[0], this.position[1], this.position[2]);
            bottomCube.matrix.scale(1, 0.8, 1);
            if (world.isBlockVisible(this.position[0], this.position[1] - 1, this.position[2])) {
                bottomCube.renderFace("bottom");
            }
            if (world.isBlockVisible(this.position[0] + 1, this.position[1], this.position[2])) {
                bottomCube.renderFace("right");
            }
            if (world.isBlockVisible(this.position[0] - 1, this.position[1], this.position[2])) {
                bottomCube.renderFace("left");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] + 1)) {
                bottomCube.renderFace("back");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] - 1)) {
                bottomCube.renderFace("front");
            }

            let topCube = new Cube();
            topCube.textureNum = 1;
            topCube.matrix.setIdentity();
            topCube.matrix.translate(this.position[0], this.position[1] + 0.8, this.position[2]);
            topCube.matrix.scale(1, 0.2, 1);
            if (world.isBlockVisible(this.position[0], this.position[1] + 1, this.position[2])) {
                topCube.renderFace("top");
            }
            if (world.isBlockVisible(this.position[0] + 1, this.position[1], this.position[2])) {
                topCube.renderFace("right");
            }
            if (world.isBlockVisible(this.position[0] - 1, this.position[1], this.position[2])) {
                topCube.renderFace("left");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] + 1)) {
                topCube.renderFace("back");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] - 1)) {
                topCube.renderFace("front");
            }
        } else if (this.type === "DIRT") {
            this.checkDirtGrowth();
            let cube = new Cube();
            cube.textureNum = 2;
            cube.matrix.setIdentity();
            cube.matrix.translate(this.position[0], this.position[1], this.position[2]);
            // Only render faces that are visible
            if (world.isBlockVisible(this.position[0], this.position[1] + 1, this.position[2])) {
                cube.renderFace("top");
            }
            if (world.isBlockVisible(this.position[0], this.position[1] - 1, this.position[2])) {
                cube.renderFace("bottom");
            }
            if (world.isBlockVisible(this.position[0] + 1, this.position[1], this.position[2])) {
                cube.renderFace("right");
            }
            if (world.isBlockVisible(this.position[0] - 1, this.position[1], this.position[2])) {
                cube.renderFace("left");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] + 1)) {
                cube.renderFace("back");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] - 1)) {
                cube.renderFace("front");
            }
        } else if (this.type === "LOG") {
            let logCube = new Cube();
            logCube.textureNum = 3;
            logCube.matrix.setIdentity();
            logCube.matrix.translate(this.position[0], this.position[1], this.position[2]);
            // Only render faces that are visible
            if (world.isBlockVisible(this.position[0], this.position[1] + 1, this.position[2])) {
                logCube.renderFace("top");
            }
            if (world.isBlockVisible(this.position[0], this.position[1] - 1, this.position[2])) {
                logCube.renderFace("bottom");
            }
            if (world.isBlockVisible(this.position[0] + 1, this.position[1], this.position[2])) {
                logCube.renderFace("right");
            }
            if (world.isBlockVisible(this.position[0] - 1, this.position[1], this.position[2])) {
                logCube.renderFace("left");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] + 1)) {
                logCube.renderFace("back");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] - 1)) {
                logCube.renderFace("front");
            }
        } else if (this.type === "LEAVES") {
            let leavesCube = new Cube();
            leavesCube.textureNum = 4;
            leavesCube.matrix.setIdentity();
            leavesCube.matrix.translate(this.position[0], this.position[1], this.position[2]);
            // Only render faces that are visible
            if (world.isBlockVisible(this.position[0], this.position[1] + 1, this.position[2])) {
                leavesCube.renderFace("top");
            }
            if (world.isBlockVisible(this.position[0], this.position[1] - 1, this.position[2])) {
                leavesCube.renderFace("bottom");
            }
            if (world.isBlockVisible(this.position[0] + 1, this.position[1], this.position[2])) {
                leavesCube.renderFace("right");
            }
            if (world.isBlockVisible(this.position[0] - 1, this.position[1], this.position[2])) {
                leavesCube.renderFace("left");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] + 1)) {
                leavesCube.renderFace("back");
            }
            if (world.isBlockVisible(this.position[0], this.position[1], this.position[2] - 1)) {
                leavesCube.renderFace("front");
            }
        }
    }
}
