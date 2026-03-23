import { describe, it, expect, mock, beforeEach } from 'bun:test'

const mockListDocuments = mock(() => Promise.resolve({ documents: [{ $id: '1', name: 'Trip 1' }] }))
const mockCreateDocument = mock(() => Promise.resolve({ $id: 'new-id', name: 'New Trip' }))
const mockUpdateDocument = mock(() => Promise.resolve({ $id: '1', name: 'Updated Trip' }))
const mockDeleteDocument = mock(() => Promise.resolve())

mock.module('./appwrite', () => ({
  account: {
    get: mock(() => Promise.resolve({})),
    deleteSession: mock(() => Promise.resolve()),
    createEmailPasswordSession: mock(() => Promise.resolve())
  },
  databases: {
    listDocuments: mockListDocuments,
    createDocument: mockCreateDocument,
    updateDocument: mockUpdateDocument,
    deleteDocument: mockDeleteDocument
  }
}))

const { listTrips, createTrip, updateTrip, deleteTrip } = await import('./database')

describe('listTrips', () => {
  beforeEach(() => mockListDocuments.mockClear())

  it('calls listDocuments and returns documents', async () => {
    const result = await listTrips('user-1')
    expect(mockListDocuments).toHaveBeenCalledTimes(1)
    expect(result.documents).toHaveLength(1)
    expect(result.documents[0].name).toBe('Trip 1')
  })

  it('propagates errors', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
    await expect(listTrips('user-1')).rejects.toThrow('Network error')
  })
})

describe('createTrip', () => {
  beforeEach(() => mockCreateDocument.mockClear())

  it('calls createDocument and returns the new trip', async () => {
    const result = await createTrip('user-1', { name: 'New Trip', description: '' })
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
    expect(result.$id).toBe('new-id')
  })

  it('propagates errors', async () => {
    mockCreateDocument.mockImplementationOnce(() => Promise.reject(new Error('Create failed')))
    await expect(createTrip('user-1', { name: 'Trip' })).rejects.toThrow('Create failed')
  })
})

describe('updateTrip', () => {
  beforeEach(() => mockUpdateDocument.mockClear())

  it('calls updateDocument and returns the updated trip', async () => {
    const result = await updateTrip('trip-1', { name: 'Updated Trip' })
    expect(mockUpdateDocument).toHaveBeenCalledTimes(1)
    expect(result.name).toBe('Updated Trip')
  })

  it('propagates errors', async () => {
    mockUpdateDocument.mockImplementationOnce(() => Promise.reject(new Error('Update failed')))
    await expect(updateTrip('trip-1', {})).rejects.toThrow('Update failed')
  })
})

describe('deleteTrip', () => {
  beforeEach(() => mockDeleteDocument.mockClear())

  it('calls deleteDocument with the tripId', async () => {
    await deleteTrip('trip-1')
    expect(mockDeleteDocument).toHaveBeenCalledTimes(1)
  })

  it('propagates errors', async () => {
    mockDeleteDocument.mockImplementationOnce(() => Promise.reject(new Error('Delete failed')))
    await expect(deleteTrip('trip-1')).rejects.toThrow('Delete failed')
  })
})
