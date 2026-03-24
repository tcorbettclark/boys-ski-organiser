import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockAccountCreate = mock(() => Promise.resolve())
const mockCreateEmailPasswordSession = mock(() => Promise.resolve())
const mockAccountGet = mock(() =>
  Promise.resolve({ $id: 'u-1', name: 'Alice', email: 'alice@example.com' })
)

mock.module('./appwrite', () => ({
  account: {
    create: mockAccountCreate,
    createEmailPasswordSession: mockCreateEmailPasswordSession,
    get: mockAccountGet
  }
}))

mock.module('appwrite', () => ({
  ID: { unique: () => 'generated-id' }
}))

const { default: Signup } = await import('./Signup')

const noop = () => {}

function renderSignup (props = {}) {
  return render(<Signup onSignup={noop} onSwitchToLogin={noop} {...props} />)
}

describe('Signup', () => {
  beforeEach(() => {
    mockAccountCreate.mockClear()
    mockCreateEmailPasswordSession.mockClear()
    mockAccountGet.mockClear()
    mockAccountGet.mockImplementation(() =>
      Promise.resolve({ $id: 'u-1', name: 'Alice', email: 'alice@example.com' })
    )
  })

  it('shows the Create Account heading', () => {
    renderSignup()
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders name, email, and password fields', () => {
    const { container } = renderSignup()
    expect(container.querySelector('[type="text"]')).toBeInTheDocument()
    expect(container.querySelector('[type="email"]')).toBeInTheDocument()
    expect(container.querySelector('[type="password"]')).toBeInTheDocument()
  })

  it('calls account.create, createEmailPasswordSession, and onSignup on submit', async () => {
    const user = userEvent.setup()
    const handleSignup = mock(() => {})
    const { container } = renderSignup({ onSignup: handleSignup })

    await user.type(container.querySelector('[type="text"]'), 'Alice')
    await user.type(container.querySelector('[type="email"]'), 'alice@example.com')
    await user.type(container.querySelector('[type="password"]'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(mockAccountCreate).toHaveBeenCalledWith(
        'generated-id',
        'alice@example.com',
        'password123',
        'Alice'
      )
      expect(mockCreateEmailPasswordSession).toHaveBeenCalledWith('alice@example.com', 'password123')
      expect(handleSignup).toHaveBeenCalledWith({ $id: 'u-1', name: 'Alice', email: 'alice@example.com' })
    })
  })

  it('shows an error message when account creation fails', async () => {
    mockAccountCreate.mockImplementationOnce(() => Promise.reject(new Error('Email already in use')))
    const user = userEvent.setup()
    const { container } = renderSignup()

    await user.type(container.querySelector('[type="text"]'), 'Alice')
    await user.type(container.querySelector('[type="email"]'), 'alice@example.com')
    await user.type(container.querySelector('[type="password"]'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
  })

  it('calls onSwitchToLogin when the Sign in button is clicked', async () => {
    const user = userEvent.setup()
    const handleSwitch = mock(() => {})
    renderSignup({ onSwitchToLogin: handleSwitch })

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(handleSwitch).toHaveBeenCalledTimes(1)
  })
})
