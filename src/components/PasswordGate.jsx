import { useState } from 'react'
import './PasswordGate.css'

// SHA-256ハッシュ（16進数小文字）をここに設定する
// 計算方法: https://emn178.github.io/online-tools/sha256.html
const PASSWORD_HASH = 'a24aa6f776352b2b6f2b513f7dd4defd988af522a4d1978d3114b9569b06003b'

const STORAGE_KEY = 'housing-map-auth-v1'

async function sha256(text) {
  const encoded = new TextEncoder().encode(text)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function isAuthenticated() {
  return window.localStorage.getItem(STORAGE_KEY) === PASSWORD_HASH
}

export default function PasswordGate({ onSuccess }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const hash = await sha256(input)
    if (hash === PASSWORD_HASH) {
      window.localStorage.setItem(STORAGE_KEY, PASSWORD_HASH)
      onSuccess()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="password-gate">
      <form className="password-form" onSubmit={handleSubmit}>
        <p className="password-title">住宅探しマップ</p>
        <input
          className={`password-input${error ? ' error' : ''}`}
          type="password"
          placeholder="パスワード"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          autoFocus
        />
        {error && <p className="password-error">パスワードが違います</p>}
        <button className="password-submit" type="submit">入る</button>
      </form>
    </div>
  )
}
