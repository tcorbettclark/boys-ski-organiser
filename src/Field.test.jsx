import { describe, it, expect, mock } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import Field from './Field'

describe('Field', () => {
  it('renders the label text', () => {
    render(<Field label='Resort' name='resort' value='' onChange={() => {}} />)
    expect(screen.getByText('Resort')).toBeInTheDocument()
  })

  it('renders an input with the correct value', () => {
    render(<Field label='Name' name='name' value='Ski Alps' onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('Ski Alps')
  })

  it('calls onChange when the input changes', () => {
    const handleChange = mock(() => {})
    render(<Field label='Name' name='name' value='' onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Chamonix', name: 'name' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('renders an input with the specified type', () => {
    render(<Field label='Email' name='email' value='' onChange={() => {}} type='email' />)
    expect(screen.getByRole('textbox').type).toBe('email')
  })
})
