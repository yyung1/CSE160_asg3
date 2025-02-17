class Circle {
    constructor() {
        this.type = 'Circle';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
        this.segments = 10; // Number of segments
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;
        
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        var d = this.size / 200.0;
        
        let angleStep=360/this.segments;
        for (var angle = 0; angle < 360; angle = angle + angleStep) {
            let centerPt = [xy[0], xy[1]];
            let angle1 = angle;
            let angle2 = angle + angleStep;
            let vec1 = [Math.cos(angle1*Math.PI/180) * d ,Math.sin(angle1*Math.PI/180) * d];
            let vec2 = [Math.cos(angle2*Math.PI/180) * d ,Math.sin(angle2*Math.PI/180) * d];            
            let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
            let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];

            drawTriangle( [xy[0], xy[1],pt1[0], pt[1], pt2[1]]);
        }
    }

    /* genCircleVertices(centerX, centerY, radius) {
        const vertices = [centerX, centerY]; // Center point of the circle
        for (let i = 0; i <= this.segments; i++) {
            const angle = (i * 2 * Math.PI) / this.segments;
            vertices.push(centerX + radius * Math.cos(angle));
            vertices.push(centerY + radius * Math.sin(angle));
        }
        return vertices;
    } */
}
