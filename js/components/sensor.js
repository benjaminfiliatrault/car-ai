class Sensor {
  constructor(car) {
    this.car = car;
    this.rayCount = 8;

    this.rayLength = 200;
    this.raySpread = Math.PI / 2; // 90 deg

    this.rays = [];

    this.readings = [];
  }

  #castRays() {
    this.rays = [];
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle =
        lerp(this.raySpread / 2, -this.raySpread / 2, this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)) +
        this.car.angle;

      const start = { x: this.car.x, y: this.car.y };
      const end = {
        x: this.car.x - Math.sin(rayAngle) * this.rayLength,
        y: this.car.y - Math.cos(rayAngle) * this.rayLength,
      };

      this.rays.push([start, end]);
    }
  }

  #getReading(ray, roadBorders, traffic) {
    let touches = [];
    for (let i = 0; i < roadBorders.length; i++) {
      const touch = getIntersection(
        ray[0], 
        ray[1],
        roadBorders[i][0],
        roadBorders[i][1]
        );

      if (touch) {
        touches.push(touch);
      }
    }
    
    for (let i = 0; i < traffic.length; i++) {
      const poly = traffic[i].polygon;

      for (let j = 0; j < poly.length; j++) {
        const touch = getIntersection(
          ray[0], 
          ray[1],
          poly[j],
          poly[(j + 1) % poly.length],
          );
  
        if (touch) {
          touches.push(touch);
        }
      }

    }

    if (!touches.length) return null;

    const offsets = touches.map((e) => e.offset);
    const minOffset = Math.min(...offsets);
    return touches.find((e) => e.offset === minOffset);
  }

  #borderReadings(roadBorders, traffic) {
    this.readings = [];
    for (let i = 0; i < this.rays.length; i++) {
      this.readings.push(this.#getReading(
        this.rays[i], roadBorders, traffic));
    }
  }

  update(roadBorders, traffic) {
    this.#castRays();
    this.#borderReadings(roadBorders, traffic);
  }

  draw(context) {
    for (let i = 0; i < this.rayCount; i++) {
      const end = (() => {
        if(this.readings[i]) return this.readings[i];
        return this.rays[i][1];
      })();

      context.beginPath();
      context.lineWidth = 2;
      context.strokeStyle = 'yellow';
      context.moveTo(this.rays[i][0].x, this.rays[i][0].y);
      context.lineTo(end.x, end.y);
      context.stroke();

      // Ray shadow
      context.beginPath();
      context.lineWidth = 2;
      context.strokeStyle = 'black';
      context.moveTo(this.rays[i][1].x, this.rays[i][1].y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
  }
}
