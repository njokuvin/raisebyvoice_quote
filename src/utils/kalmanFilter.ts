/**
 * Kalman Filter Implementation for AR Measurement Noise Reduction,
 * Depth Signal Smoothing, and Geospatial Coordinates Filtering.
 */

export class KalmanFilter1D {
  private q: number; // Process noise covariance
  private r: number; // Measurement noise covariance
  private p: number; // Estimation error covariance
  private x: number; // Estimated state value
  private initialized: boolean = false;

  /**
   * @param processNoise Process noise covariance (Q)
   * @param measurementNoise Measurement noise covariance (R)
   * @param initialError Initial estimation error covariance (P)
   */
  constructor(processNoise: number = 0.005, measurementNoise: number = 0.1, initialError: number = 1.0) {
    this.q = processNoise;
    this.r = measurementNoise;
    this.p = initialError;
    this.x = 0;
  }

  /**
   * Update state estimate with a new raw measurement
   * @param measurement Raw noisy input value
   * @returns Filtered, smoothed estimate
   */
  public update(measurement: number): number {
    if (!this.initialized) {
      this.x = measurement;
      this.initialized = true;
      return this.x;
    }

    // Prediction update (A=1, B=0)
    this.p = this.p + this.q;

    // Measurement update (Kalman Gain K = P / (P + R))
    const kalmanGain = this.p / (this.p + this.r);
    this.x = this.x + kalmanGain * (measurement - this.x);
    this.p = (1 - kalmanGain) * this.p;

    return this.x;
  }

  /**
   * Reset filter state
   */
  public reset(initialValue?: number) {
    if (initialValue !== undefined) {
      this.x = initialValue;
      this.initialized = true;
    } else {
      this.initialized = false;
    }
    this.p = 1.0;
  }

  /**
   * Get current filtered estimate
   */
  public getValue(): number {
    return this.x;
  }

  /**
   * Adjust process noise Q and measurement noise R on the fly
   */
  public setNoiseParameters(processNoise: number, measurementNoise: number) {
    this.q = processNoise;
    this.r = measurementNoise;
  }
}

export class KalmanFilter2D {
  private filterX: KalmanFilter1D;
  private filterY: KalmanFilter1D;

  constructor(processNoise: number = 0.01, measurementNoise: number = 0.08) {
    this.filterX = new KalmanFilter1D(processNoise, measurementNoise);
    this.filterY = new KalmanFilter1D(processNoise, measurementNoise);
  }

  public update(x: number, y: number): { x: number; y: number } {
    return {
      x: this.filterX.update(x),
      y: this.filterY.update(y)
    };
  }

  public reset(x?: number, y?: number) {
    this.filterX.reset(x);
    this.filterY.reset(y);
  }

  public setNoiseParameters(processNoise: number, measurementNoise: number) {
    this.filterX.setNoiseParameters(processNoise, measurementNoise);
    this.filterY.setNoiseParameters(processNoise, measurementNoise);
  }
}
