import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')

async function requestTodos(path = '', options = {}) {
  if (!API_URL) {
    throw new Error('VITE_API_URL 환경변수를 설정해 주세요.')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = response.status === 204 ? null : await response.json()

  if (!response.ok) {
    throw new Error(data?.error || '요청을 처리하지 못했습니다.')
  }

  return data
}

function getErrorMessage(error) {
  if (error instanceof TypeError) {
    return '백엔드에 연결할 수 없습니다. 네트워크 연결과 배포 서버 상태를 확인해 주세요.'
  }

  return error.message || '요청을 처리하지 못했습니다.'
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function App() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  async function loadTodos() {
    setLoading(true)
    setError('')

    try {
      const data = await requestTodos()
      setTodos(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    requestTodos()
      .then((data) => {
        if (!cancelled) {
          setTodos(data)
          setError('')
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    if (!title.trim()) return

    setCreating(true)
    setError('')
    try {
      const todo = await requestTodos('', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed: false,
        }),
      })
      setTodos((currentTodos) => [todo, ...currentTodos])
      setTitle('')
      setDescription('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(todo) {
    setBusyId(todo._id)
    setError('')
    try {
      const updatedTodo = await requestTodos(`/${todo._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed }),
      })
      setTodos((currentTodos) =>
        currentTodos.map((item) => (item._id === todo._id ? updatedTodo : item)),
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  function startEditing(todo) {
    setEditingId(todo._id)
    setEditDraft({
      title: todo.title,
      description: todo.description || '',
    })
    setError('')
  }

  async function handleEdit(event, todoId) {
    event.preventDefault()
    if (!editDraft.title.trim()) return

    setBusyId(todoId)
    setError('')
    try {
      const updatedTodo = await requestTodos(`/${todoId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editDraft.title.trim(),
          description: editDraft.description.trim(),
        }),
      })
      setTodos((currentTodos) =>
        currentTodos.map((item) => (item._id === todoId ? updatedTodo : item)),
      )
      setEditingId(null)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(todo) {
    if (!window.confirm(`"${todo.title}" 할 일을 삭제할까요?`)) return

    setBusyId(todo._id)
    setError('')
    try {
      await requestTodos(`/${todo._id}`, { method: 'DELETE' })
      setTodos((currentTodos) =>
        currentTodos.filter((item) => item._id !== todo._id),
      )
      if (editingId === todo._id) setEditingId(null)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  const activeTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="오늘의 할 일 홈">
          <span className="brand-mark" aria-hidden="true">✓</span>
          <span>하루 한 칸</span>
        </a>
        <span className="topbar-note">MY DAILY SPACE</span>
      </header>

      <section className="welcome">
        <p className="eyebrow">오늘도 좋은 하루예요</p>
        <h1>작은 한 걸음부터<br /><span>차근차근 해내봐요.</span></h1>
        <p className="welcome-copy">해야 할 일을 적고, 하나씩 완료해 보세요.</p>
      </section>

      <section className="summary" aria-label="할 일 요약">
        <div className="summary-item">
          <span className="summary-label">전체 할 일</span>
          <strong>{todos.length}<small>개</small></strong>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-label">남은 할 일</span>
          <strong className="summary-active">{activeTodos.length}<small>개</small></strong>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-label">완료했어요</span>
          <strong className="summary-completed">{completedTodos.length}<small>개</small></strong>
        </div>
      </section>

      <section className="composer-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NEW TASK</p>
            <h2>새로운 할 일</h2>
          </div>
          <span className="heading-sparkle" aria-hidden="true">✳</span>
        </div>
        <form className="composer-form" onSubmit={handleCreate}>
          <label className="visually-hidden" htmlFor="new-title">할 일 제목</label>
          <input
            id="new-title"
            className="title-input"
            type="text"
            maxLength={200}
            placeholder="어떤 일을 해볼까요?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <label className="visually-hidden" htmlFor="new-description">상세 내용</label>
          <textarea
            id="new-description"
            className="description-input"
            maxLength={2000}
            placeholder="간단한 메모를 남겨도 좋아요 (선택)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
          <div className="composer-footer">
            <span className="input-hint">제목은 1~200자, 메모는 2000자까지 입력할 수 있어요.</span>
            <button className="primary-button" type="submit" disabled={creating || !title.trim()}>
              <span aria-hidden="true">＋</span>
              {creating ? '추가 중...' : '할 일 추가'}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadTodos}>다시 불러오기</button>
        </div>
      )}

      <section className="tasks-section">
        <div className="list-heading">
          <div>
            <p className="eyebrow">YOUR LIST</p>
            <h2>오늘의 할 일 <span>{activeTodos.length}</span></h2>
          </div>
          <button className="text-button" type="button" onClick={loadTodos} disabled={loading}>
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="state-card" role="status">할 일을 불러오는 중입니다...</div>
        ) : activeTodos.length === 0 ? (
          <div className="state-card empty-state">
            <span className="empty-icon" aria-hidden="true">☀</span>
            <strong>아직 남은 할 일이 없어요</strong>
            <p>새로운 할 일을 추가해 오늘을 채워보세요.</p>
          </div>
        ) : (
          <ul className="todo-list">
            {activeTodos.map((todo) => (
              <li className="todo-card" key={todo._id}>
                {editingId === todo._id ? (
                  <form className="edit-form" onSubmit={(event) => handleEdit(event, todo._id)}>
                    <label className="visually-hidden" htmlFor={`edit-title-${todo._id}`}>할 일 제목 수정</label>
                    <input
                      id={`edit-title-${todo._id}`}
                      className="title-input"
                      type="text"
                      maxLength={200}
                      value={editDraft.title}
                      onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })}
                      required
                      autoFocus
                    />
                    <label className="visually-hidden" htmlFor={`edit-description-${todo._id}`}>상세 내용 수정</label>
                    <textarea
                      id={`edit-description-${todo._id}`}
                      className="description-input"
                      maxLength={2000}
                      rows={2}
                      value={editDraft.description}
                      onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })}
                    />
                    <div className="todo-actions">
                      <button className="small-button save-button" type="submit" disabled={busyId === todo._id}>
                        {busyId === todo._id ? '저장 중...' : '저장'}
                      </button>
                      <button className="small-button" type="button" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      className="check-button"
                      type="button"
                      aria-label={`${todo.title} 완료로 표시`}
                      title="완료로 표시"
                      disabled={busyId === todo._id}
                      onClick={() => handleToggle(todo)}
                    />
                    <div className="todo-content">
                      <h3>{todo.title}</h3>
                      {todo.description && <p>{todo.description}</p>}
                      {todo.createdAt && <time>{formatDate(todo.createdAt)} 추가</time>}
                    </div>
                    <div className="todo-actions">
                      <button className="icon-button" type="button" aria-label={`${todo.title} 수정`} onClick={() => startEditing(todo)}>
                        수정
                      </button>
                      <button className="icon-button delete-button" type="button" aria-label={`${todo.title} 삭제`} disabled={busyId === todo._id} onClick={() => handleDelete(todo)}>
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {completedTodos.length > 0 && (
        <section className="tasks-section completed-section">
          <div className="list-heading">
            <div>
              <p className="eyebrow">WELL DONE</p>
              <h2>완료한 일 <span>{completedTodos.length}</span></h2>
            </div>
          </div>
          <ul className="todo-list">
            {completedTodos.map((todo) => (
              <li className="todo-card completed-card" key={todo._id}>
                {editingId === todo._id ? (
                  <form className="edit-form" onSubmit={(event) => handleEdit(event, todo._id)}>
                    <label className="visually-hidden" htmlFor={`edit-title-${todo._id}`}>할 일 제목 수정</label>
                    <input
                      id={`edit-title-${todo._id}`}
                      className="title-input"
                      type="text"
                      maxLength={200}
                      value={editDraft.title}
                      onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })}
                      required
                      autoFocus
                    />
                    <label className="visually-hidden" htmlFor={`edit-description-${todo._id}`}>상세 내용 수정</label>
                    <textarea
                      id={`edit-description-${todo._id}`}
                      className="description-input"
                      maxLength={2000}
                      rows={2}
                      value={editDraft.description}
                      onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })}
                    />
                    <div className="todo-actions">
                      <button className="small-button save-button" type="submit" disabled={busyId === todo._id}>
                        {busyId === todo._id ? '저장 중...' : '저장'}
                      </button>
                      <button className="small-button" type="button" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      className="check-button checked"
                      type="button"
                      aria-label={`${todo.title} 미완료로 표시`}
                      title="미완료로 표시"
                      disabled={busyId === todo._id}
                      onClick={() => handleToggle(todo)}
                    >
                      ✓
                    </button>
                    <div className="todo-content">
                      <h3>{todo.title}</h3>
                      {todo.description && <p>{todo.description}</p>}
                      {todo.createdAt && <time>{formatDate(todo.createdAt)} 추가</time>}
                    </div>
                    <div className="todo-actions">
                      <button className="icon-button" type="button" aria-label={`${todo.title} 수정`} onClick={() => startEditing(todo)}>
                        수정
                      </button>
                      <button className="icon-button delete-button" type="button" aria-label={`${todo.title} 삭제`} disabled={busyId === todo._id} onClick={() => handleDelete(todo)}>
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="app-footer">하나씩 해내는 오늘이 모여 멋진 내일이 됩니다.</footer>
    </main>
  )
}

export default App
