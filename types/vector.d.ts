interface vector extends Vector3 { }

declare namespace vector {
  /** Creates a new vector with the given component values. */
  function create(x: number, y: number, z: number): vector;

  /** Calculates the magnitude of a given vector. */
  function magnitude(vec: Vector3): number;

  /** Computes the normalized version (unit vector) of a given vector. */
  function normalize(vec: Vector3): vector;

  /** Computes the cross product of two vectors. */
  function cross(vec1: Vector3, vec2: Vector3): vector;

  /** Computes the dot product of two vectors. */
  function dot(vec1: Vector3, vec2: Vector3): number;

  /** Computes the angle between two vectors in radians. The axis, if specified, is used to determine the sign of the angle. */
  function angle(vec1: Vector3, vec2: Vector3, axis?: Vector3): number;

  /** Applies `math.floor` to every component of the input vector. */
  function floor(vec: Vector3): vector;

  /** Applies `math.ceil` to every component of the input vector. */
  function ceil(vec: Vector3): vector;

  /** Applies `math.abs` to every component of the input vector. */
  function abs(vec: Vector3): vector;

  /** Applies `math.sign` to every component of the input vector. */
  function sign(vec: Vector3): vector;

  /** Applies `math.clamp` to every component of the input vector. */
  function clamp(vec: Vector3, min: Vector3, max: Vector3): vector;

  /** Applies `math.max` to the corresponding components of the input vectors. Equivalent to `vector.create(math.max((...).x), math.max((...).y), math.max((...).z))`. */
  function max(...vecs: Array<Vector3>): vector;

  /** Applies `math.min` to the corresponding components of the input vectors. Equivalent to `vector.create(math.min((...).x), math.min((...).y), math.min((...).z))`. */
  function min(...vecs: Array<Vector3>): vector;
}