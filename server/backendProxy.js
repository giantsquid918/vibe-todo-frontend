const allowedMethods = new Set(['GET', 'POST', 'PATCH', 'DELETE'])

export async function proxyBackendRequest(req, res, id) {
  if (!allowedMethods.has(req.method)) {
    res.setHeader('Allow', [...allowedMethods].join(', '))
    return res.status(405).json({ error: '지원하지 않는 요청 방식입니다.' })
  }

  const backendUrl = process.env.VITE_API_URL?.trim().replace(/\/+$/, '')
  if (!backendUrl) {
    return res.status(500).json({ error: 'Vercel 환경변수 VITE_API_URL이 설정되지 않았습니다.' })
  }

  const targetUrl = id === undefined ? backendUrl : `${backendUrl}/${encodeURIComponent(id)}`
  const headers = {}
  const contentType = req.headers['content-type']
  if (contentType) {
    headers['content-type'] = contentType
  }

  const hasBody = req.method === 'POST' || req.method === 'PATCH'

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    })
    const responseBody = await response.text()
    const responseContentType = response.headers.get('content-type')

    if (responseContentType) {
      res.setHeader('Content-Type', responseContentType)
    }

    if (response.status === 204) {
      return res.status(204).end()
    }

    return res.status(response.status).send(responseBody)
  } catch (error) {
    console.error('Backend proxy request failed:', error)
    return res.status(502).json({ error: '백엔드 서버에 연결할 수 없습니다.' })
  }
}
