class Animal {
  /**
   * @param {Vector3 | number[]} position - The starting position (as a Vector3 or array)
   * @param {Vector3 | number[]} direction - A normalized direction vector (as a Vector3 or array)
   * @param {string} variant - A string indicating the animal type/variant (e.g., "redpanda", "wolf")
   */
  constructor(position, direction, variant = "default") {
    // Store position and direction as Vector3 objects.
    this.position = (position instanceof Vector3) ? position : new Vector3(position);
    this.direction = (direction instanceof Vector3) ? direction : new Vector3(direction);
    this.direction.normalize();

    // For FPS-style movement, store a yaw (rotation around Y) computed from the direction.
    this.yaw = Math.atan2(this.direction.elements[2], this.direction.elements[0]) * (180 / Math.PI);

    // Variant can be used later to choose different drawing routines (different head/tail, etc.)
    this.variant = variant;

    // Animation parameters (limb movement, head tilt, etc.)—you can customize these.
    this.limbAngle = 0;
    this.headAngle = 0;
  }

  update(dt, world) {
    // Speed & Acceleration
    const accel = 2;       // Acceleration rate (per second)
    const turnSpeed = 90;  // Turning speed (degrees per second)
    const minStepDistance = 0.2; // Distance period for a full step cycle

    if (this.speed === undefined) {
      this.speed = 0;
    }
    this.speed += (animalSpeed - this.speed) * accel * dt;

    // Movement Calculation
    let displacement = this.speed * dt;
    let proposedX = this.position.elements[0] + this.direction.elements[0] * displacement;
    let proposedZ = this.position.elements[2] + this.direction.elements[2] * displacement;

    // Define world bounds
    const margin = 1;
    const minX = -world.sizeX / 2 + margin;
    const maxX = world.sizeX / 2 - margin;
    const minZ = -world.sizeZ / 2 + margin;
    const maxZ = world.sizeZ / 2 - margin;

    let outOfBounds = false;

    if (proposedX < minX || proposedX > maxX) {
      outOfBounds = true;
      let overshoot = proposedX < minX ? minX - proposedX : proposedX - maxX;
      proposedX = proposedX < minX ? minX + overshoot : maxX - overshoot;
    }
    if (proposedZ < minZ || proposedZ > maxZ) {
      outOfBounds = true;
      let overshoot = proposedZ < minZ ? minZ - proposedZ : proposedZ - maxZ;
      proposedZ = proposedZ < minZ ? minZ + overshoot : maxZ - overshoot;
    }

    // Boundary & Random Wander Adjustment
    if (outOfBounds) {
      // If near a wall, adjust the direction by a random angle between -30 and 30 degrees
      let newAngle = Math.random() * 60 - 30;
      let rotationMatrix = new Matrix4().setRotate(newAngle, 0, 1, 0);
      let newDirection = new Vector4(this.direction.elements[0], 0, this.direction.elements[2], 1);
      newDirection = rotationMatrix.multiplyVector4(newDirection);
      this.direction.elements[0] = newDirection.elements[0];
      this.direction.elements[2] = newDirection.elements[2];
      this.direction.normalize();
    } else {
      if (Math.random() < 0.02) {
        // Occasionally introduce a small random turn to simulate natural wandering.
        let wanderAngle = (Math.random() * 40 - 20) * (Math.PI / 180);
        let cosA = Math.cos(wanderAngle);
        let sinA = Math.sin(wanderAngle);
        let newDirX = this.direction.elements[0] * cosA - this.direction.elements[2] * sinA;
        let newDirZ = this.direction.elements[0] * sinA + this.direction.elements[2] * cosA;
        this.direction.elements[0] = newDirX;
        this.direction.elements[2] = newDirZ;
        this.direction.normalize();
      }
    }

    if (Math.abs(this.direction.elements[0]) < 0.0001 && Math.abs(this.direction.elements[2]) < 0.0001) {
      this.direction.elements[0] = Math.random() * 2 - 1;
      this.direction.elements[2] = Math.random() * 2 - 1;
      this.direction.normalize();
    }

    // Apply Movement
    this.position.elements[0] = proposedX;
    this.position.elements[2] = proposedZ;

    // Smooth Turning by adjusting the yaw toward the direction's angle.
    let targetYaw = Math.atan2(this.direction.elements[2], -this.direction.elements[0]) * (180 / Math.PI);
    let angleDifference = targetYaw - this.yaw;
    if (angleDifference > 180) angleDifference -= 360;
    if (angleDifference < -180) angleDifference += 360;
    this.yaw += Math.sign(angleDifference) * Math.min(turnSpeed * dt, Math.abs(angleDifference));

    // Smooth Stepping (Limb Animation)
    // Accumulate distance traveled to drive the walking cycle.
    if (this.distanceTraveled === undefined) {
      this.distanceTraveled = 0;
    }
    this.distanceTraveled += displacement;
    // Use a sine function to oscillate limbAngle smoothly.
    this.limbAngle = g_limbMaxAngle * Math.sin((this.distanceTraveled / minStepDistance) * Math.PI);

    // Vertical Bobbing
    // Simulate natural vertical motion while walking.
    const groundLevel = 0.15;
    this.position.elements[1] = groundLevel + Math.sin(g_seconds * 6) * 0.02;
  }







  drawLimb(baseTransform, overallAngle, lowerArmAngle, footAngle, xFootOffset) {
    var limbTransform = new Matrix4(baseTransform);
    limbTransform.translate(legWidth / 2, 0, legDepth / 2);
    limbTransform.rotate(overallAngle, 0, 0, 1);
    limbTransform.translate(-legWidth / 2, 0, -legDepth / 2);

    var upperLimb = new Cube();
    upperLimb.color = [0, 0, 0, 1.0];
    upperLimb.matrix.set(limbTransform);
    upperLimb.matrix.scale(legWidth, -0.4 * legHeight, legDepth);
    upperLimb.render();

    var iT = new Cube();
    iT.color = [0, 0, 0, 1.0];
    iT.matrix.set(limbTransform);
    iT.matrix.scale(legWidth, legHeight / 4, legDepth);
    iT.render();

    var lowerTransform = new Matrix4(limbTransform);
    lowerTransform.translate(0, -0.4 * legHeight, 0);
    lowerTransform.rotate(lowerArmAngle, 0, 0, 1);

    var lowerLimb = new Cube();
    lowerLimb.color = [0, 0, 0, 1.0];
    lowerLimb.matrix.set(lowerTransform);
    lowerLimb.matrix.scale(legWidth, -0.6 * legHeight, legDepth);
    lowerLimb.render();

    var footTransform = new Matrix4(lowerTransform);
    footTransform.translate(xFootOffset, -0.6 * legHeight, 0);
    footTransform.rotate(footAngle, 0, 0, 1);

    var footLimb = new Cube();
    footLimb.color = [0, 0, 0, 1.0];
    footLimb.matrix.set(footTransform);
    footLimb.matrix.scale(footDepth, footHeight, footWidth);
    footLimb.render();
  }

  drawAnimal() {
    // Build a base transformation from the animal's position and yaw.
    let animalPos = new Matrix4();
    animalPos.setTranslate(
      this.position.elements[0],
      this.position.elements[1],
      this.position.elements[2]
    );
    animalPos.rotate(this.yaw, 0, 1, 0);

    // Depending on the variant, draw different geometry.
    if (this.variant === "default") {
      this.drawRedPanda(animalPos);
    } else if (this.variant === "default2") {
      this.drawDifferentAnimal(animalPos);
    }
  }

  drawRedPanda(animalPos) {

    // g_redPandaParts = [];

    if (g_limbAnimation) {
      g_limbAngle = g_limbMaxAngle * Math.sin(g_seconds * 3.6);
      g_headAngle = g_headMaxAngle * Math.sin(g_seconds * 3.6);
    } else {
      // g_limbAngle = Number(document.getElementById('limbSlide').value);
    }

    var bodyTransform = new Matrix4(animalPos);
    // bodyTransform.translate(-0.25, -0.5, 0.0);

    // Draw the body bottom
    var bodyBottom = new Cube();
    bodyBottom.color = [0, 0, 0, 1];
    bodyBottom.matrix.set(bodyTransform);
    bodyBottom.matrix.scale(0.5, 0.025, 0.25);
    bodyBottom.render();
    // g_redPandaParts.push(bodyBottom);

    var bodyTop = new Cube();
    bodyTop.color = [0.8, 0.4, 0.0, 1.0];
    bodyTop.textureNum = 0;
    bodyTop.matrix.set(bodyTransform);
    bodyTop.matrix.translate(0, 0.025, 0);
    bodyTop.matrix.scale(0.5, 0.175, 0.25);
    bodyTop.render();
    // g_redPandaParts.push(bodyTop);

    var headTransform = new Matrix4(bodyTransform);
    headTransform.translate(-0.27, 0, -0.02);
    headTransform.translate(0.5, 0, 0.5);
    headTransform.rotate(-g_headAngle, 0, 0, 1);
    headTransform.translate(-0.5, 0, -0.5);

    var head = new Cube();
    head.color = [0.8, 0.4, 0.0, 1.0];
    head.textureNum = 0;
    head.matrix.set(headTransform);
    head.matrix.scale(0.29, 0.24, 0.29);
    head.render();

    var head2 = new Cube();
    head2.color = [1.0, 1.0, 1.0, 1.0];
    head2.matrix.set(headTransform);
    head2.matrix.translate(-0.06, 0, 0.09);
    head2.matrix.scale(0.07, 0.11, 0.11);
    head2.render();

    var nose = new Cube();
    nose.color = [0, 0, 0, 1];
    nose.matrix.set(headTransform);
    nose.matrix.translate(-0.08, 0.045, 0.12);
    nose.matrix.scale(0.02, 0.045, 0.05);
    nose.render();

    var earWidth = 0.12;
    var earHeight = 0.12;
    var earDepth = 0.065;
    var frameThickness = 0.02;
    var innerPanelDepth = 0.005;

    // Left ear
    var leftEarTransform = new Matrix4(headTransform);
    leftEarTransform.translate(0.22, 0.18, -0.06);
    leftEarTransform.rotate(-90, 0, 1, 0);

    var leftEarTop = new Cube();
    leftEarTop.color = [1.0, 1.0, 1.0, 1.0];
    leftEarTop.matrix.set(leftEarTransform);
    leftEarTop.matrix.translate(0, earHeight - frameThickness, 0);
    leftEarTop.matrix.scale(earWidth, frameThickness, earDepth);
    leftEarTop.render();
    // g_redPandaParts.push(leftEarTop);

    var leftEarBottom = new Cube();
    leftEarBottom.color = [1.0, 1.0, 1.0, 1.0];
    leftEarBottom.matrix.set(leftEarTransform);
    leftEarBottom.matrix.translate(0, 0, 0);
    leftEarBottom.matrix.scale(earWidth, frameThickness, earDepth);
    leftEarBottom.render();
    // g_redPandaParts.push(leftEarBottom);

    var leftEarLeft = new Cube();
    leftEarLeft.color = [1.0, 1.0, 1.0, 1.0];
    leftEarLeft.matrix.set(leftEarTransform);
    leftEarLeft.matrix.translate(0, frameThickness, 0);
    leftEarLeft.matrix.scale(frameThickness, earHeight - 2 * frameThickness, earDepth);
    leftEarLeft.render();
    // g_redPandaParts.push(leftEarLeft);

    var leftEarRight = new Cube();
    leftEarRight.color = [1.0, 1.0, 1.0, 1.0];
    leftEarRight.matrix.set(leftEarTransform);
    leftEarRight.matrix.translate(earWidth - frameThickness, frameThickness, 0);
    leftEarRight.matrix.scale(frameThickness, earHeight - 2 * frameThickness, earDepth);
    leftEarRight.render();
    // g_redPandaParts.push(leftEarRight);

    var leftEarInner = new Cube();
    leftEarInner.color = [0.0, 0.0, 0.0, 1.0];
    leftEarInner.matrix.set(leftEarTransform);
    leftEarInner.matrix.translate(frameThickness, frameThickness, (earDepth - innerPanelDepth) * 0.5);
    leftEarInner.matrix.scale(earWidth - 2 * frameThickness, earHeight - 2 * frameThickness, innerPanelDepth);
    leftEarInner.render();
    // g_redPandaParts.push(leftEarInner);

    var leftEarBack = new Cube();
    leftEarBack.color = [1.0, 1.0, 1.0, 1.0];
    leftEarBack.matrix.set(leftEarTransform);
    // leftEarBack.matrix.translate(frameThickness, frameThickness, -(earDepth - innerPanelDepth) * 0.5);
    leftEarBack.matrix.scale(earWidth, earHeight, innerPanelDepth);
    leftEarBack.render();
    // g_redPandaParts.push(leftEarBack);

    // Right ear
    var rightEarTransform = new Matrix4(headTransform);
    rightEarTransform.translate(0.22, 0.18, 0.23);
    rightEarTransform.rotate(-90, 0, 1, 0);

    var rightEarTop = new Cube();
    rightEarTop.color = [1.0, 1.0, 1.0, 1.0];
    rightEarTop.matrix.set(rightEarTransform);
    rightEarTop.matrix.translate(0, earHeight - frameThickness, 0);
    rightEarTop.matrix.scale(earWidth, frameThickness, earDepth);
    rightEarTop.render();
    // g_redPandaParts.push(rightEarTop);

    var rightEarBottom = new Cube();
    rightEarBottom.color = [1.0, 1.0, 1.0, 1.0];
    rightEarBottom.matrix.set(rightEarTransform);
    rightEarBottom.matrix.translate(0, 0, 0);
    rightEarBottom.matrix.scale(earWidth, frameThickness, earDepth);
    rightEarBottom.render();
    // g_redPandaParts.push(rightEarBottom);

    var rightEarLeft = new Cube();
    rightEarLeft.color = [1.0, 1.0, 1.0, 1.0];
    rightEarLeft.matrix.set(rightEarTransform);
    rightEarLeft.matrix.translate(0, frameThickness, 0);
    rightEarLeft.matrix.scale(frameThickness, earHeight - 2 * frameThickness, earDepth);
    rightEarLeft.render();
    // g_redPandaParts.push(rightEarLeft);

    var rightEarRight = new Cube();
    rightEarRight.color = [1.0, 1.0, 1.0, 1.0];
    rightEarRight.matrix.set(rightEarTransform);
    rightEarRight.matrix.translate(earWidth - frameThickness, frameThickness, 0);
    rightEarRight.matrix.scale(frameThickness, earHeight - 2 * frameThickness, earDepth);
    rightEarRight.render();
    // g_redPandaParts.push(rightEarRight);

    var rightEarInner = new Cube();
    rightEarInner.color = [0.0, 0.0, 0.0, 1.0];
    rightEarInner.matrix.set(rightEarTransform);
    rightEarInner.matrix.translate(frameThickness, frameThickness, (earDepth - innerPanelDepth) * 0.5);
    rightEarInner.matrix.scale(earWidth - 2 * frameThickness, earHeight - 2 * frameThickness, innerPanelDepth);
    rightEarInner.render();
    // g_redPandaParts.push(rightEarInner);

    var rightEarBack = new Cube();
    rightEarBack.color = [1.0, 1.0, 1.0, 1.0];
    rightEarBack.matrix.set(rightEarTransform);
    // rightEarBack.matrix.translate(frameThickness, frameThickness, -(earDepth - innerPanelDepth) * 0.5);
    rightEarBack.matrix.scale(earWidth, earHeight, innerPanelDepth);
    rightEarBack.render();
    // g_redPandaParts.push(rightEarBack);

    var rightEye = new Cube();
    rightEye.color = [0, 0, 0, 1];
    rightEye.matrix.set(headTransform);
    rightEye.matrix.translate(-0.01, 0.12, 0.20);
    rightEye.matrix.scale(0.04, 0.04, 0.04);
    rightEye.render();
    // g_redPandaParts.push(rightEye);

    var leftEye = new Cube();
    leftEye.color = [0, 0, 0, 1];
    leftEye.matrix.set(headTransform);
    leftEye.matrix.translate(-0.01, 0.12, 0.05);
    leftEye.matrix.scale(0.04, 0.04, 0.04);
    leftEye.render();
    // g_redPandaParts.push(leftEye);

    var furHeight = 0.07

    var rightFaceFurTransform = new Matrix4(headTransform);
    rightFaceFurTransform.translate(0.035, 0, 0.23);
    rightFaceFurTransform.rotate(-90, 0, 1, 0);

    var rightFaceFurTop = new Cube();
    rightFaceFurTop.color = [1.0, 1.0, 1.0, 1.0];
    rightFaceFurTop.matrix.set(rightFaceFurTransform);
    rightFaceFurTop.matrix.translate(-0.015, furHeight - 0.02, 0);
    rightFaceFurTop.matrix.scale(0.035, furHeight - 0.02, 0.04);
    rightFaceFurTop.render();
    // g_redPandaParts.push(rightFaceFurTop);

    var rightFaceFurBottom = new Cube();
    rightFaceFurBottom.color = [1.0, 1.0, 1.0, 1.0];
    rightFaceFurBottom.matrix.set(rightFaceFurTransform);
    rightFaceFurBottom.matrix.translate(0, 0, 0);
    rightFaceFurBottom.matrix.scale(0.04, furHeight, 0.04);
    rightFaceFurBottom.render();
    // g_redPandaParts.push(rightFaceFurBottom);

    var leftFaceFurTransform = new Matrix4(headTransform);
    leftFaceFurTransform.translate(0.035, 0, 0.025);
    leftFaceFurTransform.rotate(-90, 0, 1, 0);

    var leftFaceFurTop = new Cube();
    leftFaceFurTop.color = [1.0, 1.0, 1.0, 1.0];
    leftFaceFurTop.matrix.set(leftFaceFurTransform);
    leftFaceFurTop.matrix.translate(0.015, furHeight - 0.02 - g_fallHeight, 0);
    leftFaceFurTop.matrix.scale(0.035, furHeight - 0.02, 0.04);
    leftFaceFurTop.render();
    // g_redPandaParts.push(leftFaceFurTop);

    var leftFaceFurBottom = new Cube();
    leftFaceFurBottom.color = [1.0, 1.0, 1.0, 1.0];
    leftFaceFurBottom.matrix.set(leftFaceFurTransform);
    leftFaceFurBottom.matrix.translate(0, 0 - g_fallHeight, 0);
    leftFaceFurBottom.matrix.scale(0.04, furHeight, 0.04);
    leftFaceFurBottom.render();
    // g_redPandaParts.push(leftFaceFurBottom);

    var rightArmBase = new Matrix4(bodyTransform);
    rightArmBase.translate(0.025, 0, 0.002);
    this.drawLimb(rightArmBase, g_limbAngle, g_lowerArmAngle, g_footAngle, 0.1);

    var rightLegBase = new Matrix4(bodyTransform);
    rightLegBase.translate(0.398, 0, 0.002);
    this.drawLimb(rightLegBase, -g_limbAngle, g_lowerArmAngle, g_footAngle, 0.1);

    var leftArmBase = new Matrix4(bodyTransform);
    leftArmBase.translate(0.025, 0, 0.148);
    this.drawLimb(leftArmBase, -g_limbAngle, g_lowerArmAngle, g_footAngle, 0.1);

    var leftLegBase = new Matrix4(bodyTransform);
    leftLegBase.translate(0.398, 0, 0.148);
    this.drawLimb(leftLegBase, g_limbAngle, g_lowerArmAngle, g_footAngle, 0.1);

    var numSegments = 7;
    var tailSegmentLength = 0.07;
    var tailSegmentHeight = 0.075;
    var tailSegmentDepth = 0.1;
    var tailPosition = 0.12;

    var amplitude = 20;      // maximum rotation for each segment
    var frequency = 3.0;     // how fast the tail wags
    var phase = 0.3;
    var tailBase = new Matrix4(bodyTransform);
    tailBase.translate(0.56, tailPosition, 0.175 - tailSegmentDepth / 2);

    for (var i = 0; i < numSegments; i++) {
      if (g_limbAnimation) {
        var angle = amplitude * Math.sin(g_seconds * frequency + i * phase);
      } else {
        var angle = g_tailAngle;
      }

      var segmentTransform = new Matrix4(tailBase);

      segmentTransform.translate(tailSegmentLength / 2, tailSegmentHeight / 2, tailSegmentDepth / 2);

      segmentTransform.rotate(angle, 0, 1, 0);
      segmentTransform.rotate(angle, 1, 0, 0);

      segmentTransform.translate(-tailSegmentLength / 2, -tailSegmentHeight / 2, -tailSegmentDepth / 2);

      segmentTransform.scale(tailSegmentLength, tailSegmentHeight, tailSegmentDepth);

      var tailSegment = new Cylinder();
      tailSegment.matrix.set(segmentTransform);
      tailSegment.matrix.rotate(90, 0, 0, 1);
      tailSegment.color = (i % 2 === 0) ? [0.8, 0.4, 0.0, 1.0] : [0, 0, 0, 1];
      tailSegment.textureNum = (i % 2 === 0) ? 0 : -2;
      tailSegment.render();

      var translation = new Matrix4();
      translation.translate(tailSegmentLength, 0, 0);
      tailBase.multiply(translation);
    }
  }
  drawDifferentAnimal(animalPos) {
    this.drawRedPanda(animalPos);
  }
}