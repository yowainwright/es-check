try {
  throw new Error("My exception");
} catch (e) {
  logMyErrors(e);
}
