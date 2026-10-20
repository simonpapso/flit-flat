// Local and authenticated cloud workspaces never share a mutable data store.
let backend = null;
export const getCloudBackend = () => backend;
export const setCloudBackend = value => { backend = value; };
