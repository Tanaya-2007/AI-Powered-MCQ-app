/**
 * Adapts a plain `(origin) => boolean` allow-check to the callback signature the `cors` package
 * (and Socket.io's cors option) REQUIRES: `(origin, callback) => callback(err, allowed)`.
 *
 * Passing the bare boolean function never calls the callback, so every request hangs forever.
 */
export function corsOrigin(isAllowed) {
  return (origin, callback) => {
    try {
      callback(null, !!isAllowed(origin));
    } catch (err) {
      callback(err);
    }
  };
}
