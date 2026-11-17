import { proxyBackendRequest } from '../../server/backendProxy.js'

export default function handler(req, res) {
  return proxyBackendRequest(req, res, req.query.id)
}
