class Car {
  constructor(x, y, width, height, type, maxSpeed = 3) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = maxSpeed;
    this.friction = 0.05;

    this.angle = 0;

    this.damaged = false;

    this.type = type;

    this.useBrain = type === "AI"

    if(type !== "PNJ"){
      this.sensors = new Sensor(this);
      this.brain = new Brain([this.sensors.rayCount,6,4]);
    }
    this.controls = new Controls(type);
  }

  #move(){
    this.#handleSpeed();
    this.#handleRotation();
  }

  #handleRotation(){
    if (this.speed !== 0) {
        // Only rotate if the car is moving
        const flip = this.speed > 0 ? 1 : -1;
  
        if (this.controls.left) {
          this.angle += 0.03 * flip;
        }
        if (this.controls.right) {
          this.angle -= 0.03 * flip;
        }
      }
  
      this.x -= Math.sin(this.angle) * this.speed;
  }

  #handleSpeed() {
    if (this.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.controls.reverse) {
      this.speed -= this.acceleration;
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }

    // reverse max speed
    if (this.speed < -this.maxSpeed / 1.5) {
      this.speed = -this.maxSpeed / 1.5;
    }

    if (this.speed > 0) {
      this.speed -= this.friction;
    }

    if (this.speed < 0) {
      this.speed += this.friction;
    }

    // Remove the bounciness when the value is very small
    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0;
    }
    this.y -= Math.cos(this.angle) * this.speed;
  }

  #createPolygon(){
    const points = [];
    const radius = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);
    
    // Top corners
    points.push({
      x: this.x - Math.sin(this.angle - alpha) * radius,
      y: this.y - Math.cos(this.angle - alpha) * radius,
    });
    points.push({
      x: this.x - Math.sin(this.angle + alpha) * radius,
      y: this.y - Math.cos(this.angle + alpha) * radius,
    });

    // Bottom corners
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle - alpha) * radius,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * radius,
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle + alpha) * radius,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * radius,
    });

    return points;
  }

  #assessDamage(roadBorders, traffic){
    for (let i = 0; i < roadBorders.length; i++) {
      if(polyIntersect(this.polygon, roadBorders[i])){
        return true;
      }
    }

    for (let i = 0; i < traffic.length; i++) {
      if(polyIntersect(this.polygon, traffic[i].polygon)){
        return true;
      }
    }

    return false;
  }

  update(roadBorders, traffic) {
    if(!this.damaged){
      this.#move();
      this.polygon = this.#createPolygon();
      this.damaged = this.#assessDamage(roadBorders, traffic);
    }
    if(this.sensors){
      this.sensors.update(roadBorders, traffic);
      const offsets = this.sensors.readings.map(
        s => s === null ? 0 : 1 - s.offset
      );
      const outputs = Brain.feedForward(offsets, this.brain);

      if(this.useBrain){
        this.controls.forward = outputs[0];
        this.controls.left = outputs[1];
        this.controls.right = outputs[2];
        this.controls.reverse = outputs[3];
      }
    }
  }

  draw(context, drawSensor) {
    if(this.type === "PNJ"){
      context.fillStyle = "red";
    } else {
      context.fillStyle = "blue";
    }

    if(this.damaged){
      context.fillStyle = "gray";
    }

    context.beginPath();
    context.moveTo(this.polygon[0].x, this.polygon[0].y);

    for (let i = 1; i < this.polygon.length; i++) {
      context.lineTo(this.polygon[i].x, this.polygon[i].y);
    }

    context.fill();

    if(this.sensors && drawSensor){
      this.sensors.draw(context);
    }
  }
}
