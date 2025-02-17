class Camera {
    constructor(canvas) {
        // this.fov = 30;
        this.fov = 60;
        // this.cam = new Vector3([-2, 2, -10]);
        this.cam = new Vector3([0, 2, 0,]);
        this.lookAt = new Vector3([-2, 0, 3]);
        // this.lookAt = new Vector3([0, 0, 0]);
        // this.lookAt = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);
        this.nearClipping = 0.1;
        this.farClipping = 1000;
        this.pitch = 0;

        // Dynamic world rendering
        this.renderDistance = 20;
        this.bufferZone = 2;

        this.viewMatrix = new Matrix4();
        this.viewMatrix.setLookAt(
            this.cam.elements[0], this.cam.elements[1], this.cam.elements[2],  // Camera
            this.lookAt.elements[0], this.lookAt.elements[1], this.lookAt.elements[2],  // Look-at
            this.up.elements[0], this.up.elements[1], this.up.elements[2]  // Up direction, Y-axis
        );

        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(
            this.fov,  // FOV
            canvas.width / canvas.height,  // Aspect
            this.nearClipping,  // Near clipping
            this.farClipping  // Far clipping
        );

        document.getElementById("render-distance").addEventListener("input", (e) => {
            this.updateRenderDistance(e.target.value);
        })
    }
    getPosition() {
        return this.cam.elements;
    }

    getLookDirection() {
        let direction = new Vector3(this.lookAt.elements);
        direction.sub(this.cam);  // lookAt - cam
        direction.normalize();
        return direction.elements;
    }

    getRenderDistance() {
        return this.renderDistance;
    }

    getBufferZone() {
        return this.bufferZone;
    }

    moveForward(speed) {
        let f = new Vector3(this.lookAt.elements);
        f.sub(this.cam);
        f.normalize();
        f.mul(speed);
        this.cam.add(f);
        this.lookAt.add(f);
        this.updateViewMatrix();
    }

    moveBackward(speed) {
        let b = new Vector3(this.cam.elements);
        b.sub(this.lookAt);
        b.normalize();
        b.mul(speed);
        this.cam.add(b);
        this.lookAt.add(b);
        this.updateViewMatrix();
    }

    moveLeft(speed) {
        let f = new Vector3(this.lookAt.elements);
        f.sub(this.cam);
        let s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(speed);
        this.cam.add(s);
        this.lookAt.add(s);
        this.updateViewMatrix();
    }

    moveRight(speed) {
        let f = new Vector3(this.lookAt.elements);
        f.sub(this.cam);
        let s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(speed);
        this.cam.add(s);
        this.lookAt.add(s);
        this.updateViewMatrix();
    }

    panLeft(angle) {
        let f = new Vector3(this.lookAt.elements);
        f.sub(this.cam);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.lookAt = new Vector3(this.cam.elements);
        this.lookAt.add(f_prime);
        this.updateViewMatrix();
    }

    panRight(angle) {
        this.panLeft(-angle);
    }

    tilt(angle) {
        // Update pitch value and fix it between +-89
        this.pitch += angle;
        if (this.pitch > 89) this.pitch = 89;
        if (this.pitch < -89) this.pitch = -89;

        // Convert pitch to a new forward vector
        let pitchRad = this.pitch * Math.PI / 180;
        let yawRad = Math.atan2(this.lookAt.elements[2] - this.cam.elements[2],
            this.lookAt.elements[0] - this.cam.elements[0]); // Keep yaw unchanged

        let newForward = new Vector3([
            Math.cos(pitchRad) * Math.cos(yawRad),
            Math.sin(pitchRad),
            Math.cos(pitchRad) * Math.sin(yawRad)
        ]);

        // Update lookAt so that lookAt = cam + newForward
        this.lookAt = new Vector3(this.cam.elements);
        this.lookAt.add(newForward);

        this.updateViewMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.cam.elements[0], this.cam.elements[1], this.cam.elements[2],
            this.lookAt.elements[0], this.lookAt.elements[1], this.lookAt.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }
    updateRenderDistance(value) {
        this.renderDistance = parseInt(value);
    }
    /* getBoundingSphere() {
        // Suppose you store your animal’s position in this.pos as a Vector3
        // or you can approximate the center from your transformations.
        const radius = 0.3;  // pick something to enclose your model
        return { center: this.cam, radius: radius };
    } */
}