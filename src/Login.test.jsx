import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockCreateEmailPasswordSession = mock(() => Promise.resolve())
const mockAccountGet = mock(() =>
  Promise.resolve({ $id: 'u-1', name: 'Alice', email: 'alice@example.com' })
)

mock.module('./appwrite', () => ({
  account: {
    createEmailPasswordSession: mockCreateEmailPasswordSession,
    get: mockAccountGet
  }
}))

const { default: Login } = await import('./Login')

const noop = () => {}

function renderLogin (props = {}) {
  return render(<Login onLogin={noop} onSwitchToSignup={noop} {...props} />)
}

describe('Login', () => {
  beforeEach(() => {
    mockCreateEmailPasswordSession.mockClear()
    mockAccountGet.mockClear()
    mockAccountGet.mockImplementation(() =>
      Promise.resolve({ $id: 'u-1', name: 'Alice', email: 'alice@example.com' })
    )
  })

  it('shows the Sign In heading', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders email and password fields', () => {
    const { container } = renderLogin()
    expect(container.querySelector('[type="email"]')).toBeInTheDocument()
    expect(container.querySelector('[type="password"]')).toBeInTheDocument()
  })

  it('calls createEmailPasswordSession and onLogin with the user on submit', async () => {
    const user = userEvent.setup()
    const handleLogin = mock(() => {})
    const { container } = renderLogin({ onLogin: handleLogin })

    await user.type(container.querySelector('[type="email"]'), 'alice@example.com')
    await user.type(container.querySelector('[type="password"]'), 'secret123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(mockCreateEmailPasswordSession).toHaveBeenCalledWith('alice@example.com', 'secret123')
      expect(handleLogin).toHaveBeenCalledWith({ $id: 'u-1', name: 'Alice', email: 'alice@example.com' })
    })
  })

  it('shows an error message when login fails', async () => {
    mockCreateEmailPasswordSession.mockImplementationOnce(() =>
      Promise.reject(new Error('Invalid credentials'))
    )
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(container.querySelector('[type="email"]'), 'bad@example.com')
    await user.type(container.querySelector('[type="password"]'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('calls onSwitchToSignup when the Sign up button is clicked', async () => {
    const user = userEvent.setup()
    const handleSwitch = mock(() => {})
    renderLogin({ onSwitchToSignup: handleSwitch })

    await user.click(screen.getByRole('button', { name: /sign up/i }))
    expect(handleSwitch).toHaveBeenCalledTimes(1)
  })

  it('disables the submit button while signing in', async () => {
    let resolveSession
    mockCreateEmailPasswordSession.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSession = resolve })
    )
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(container.querySelector('[type="email"]'), 'alice@example.com')
    await user.type(container.querySelector('[type="password"]'), 'secret123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()

    // Settle the pending promise so cleanup doesn't trigger act() warnings
    await act(async () => { resolveSession() })
  })
})
