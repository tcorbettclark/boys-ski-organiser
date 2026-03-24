import { describe, it, expect, mock, beforeEach } from 'bun:test'

const mockListDocuments = mock(() => Promise.resolve({ documents: [] }))
const mockCreateDocument = mock(() => Promise.resolve({ $id: 'new-id', name: 'New Trip' }))
const mockUpdateDocument = mock(() => Promise.resolve({ $id: '1', name: 'Updated Trip' }))
const mockDeleteDocument = mock(() => Promise.resolve())
const mockGetDocument = mock(() => Promise.resolve({ $id: 'trip-1', name: 'Ski Alps' }))

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
    deleteDocument: mockDeleteDocument,
    getDocument: mockGetDocument
  }
}))

const {
  listTrips,
  getTrip,
  getTripByCode,
  createTrip,
  updateTrip,
  deleteTrip,
  joinTrip,
  listParticipatedTrips,
  leaveTrip,
  getUserById
} = await import('./database')

beforeEach(() => {
  mockListDocuments.mockClear()
  mockCreateDocument.mockClear()
  mockUpdateDocument.mockClear()
  mockDeleteDocument.mockClear()
  mockGetDocument.mockClear()
})

describe('listTrips', () => {
  it('calls listDocuments and returns documents', async () => {
    mockListDocuments.mockImplementationOnce(() =>
      Promise.resolve({ documents: [{ $id: '1', name: 'Trip 1' }] })
    )
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

describe('getTrip', () => {
  it('calls getDocument with the trip id', async () => {
    await getTrip('trip-1')
    expect(mockGetDocument).toHaveBeenCalledTimes(1)
    const [, , tripId] = mockGetDocument.mock.calls[0]
    expect(tripId).toBe('trip-1')
  })

  it('returns the trip document', async () => {
    const result = await getTrip('trip-1')
    expect(result.$id).toBe('trip-1')
    expect(result.name).toBe('Ski Alps')
  })

  it('propagates errors', async () => {
    mockGetDocument.mockImplementationOnce(() => Promise.reject(new Error('Not found')))
    await expect(getTrip('trip-1')).rejects.toThrow('Not found')
  })
})

describe('getTripByCode', () => {
  it('calls listDocuments with a code filter', async () => {
    mockListDocuments.mockImplementationOnce(() =>
      Promise.resolve({ documents: [{ $id: 'trip-1', code: 'abc-def-ghi' }] })
    )
    const result = await getTripByCode('abc-def-ghi')
    expect(mockListDocuments).toHaveBeenCalledTimes(1)
    expect(result.documents[0].code).toBe('abc-def-ghi')
  })

  it('returns empty documents when code is not found', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.resolve({ documents: [] }))
    const result = await getTripByCode('unknown-code')
    expect(result.documents).toHaveLength(0)
  })

  it('propagates errors', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
    await expect(getTripByCode('abc-def-ghi')).rejects.toThrow('Network error')
  })
})

describe('createTrip', () => {
  it('checks for code uniqueness before creating', async () => {
    await createTrip('user-1', { name: 'New Trip', description: '' })
    // one listDocuments call for the code check, then one createDocument
    expect(mockListDocuments).toHaveBeenCalledTimes(1)
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
  })

  it('includes a three-word code in the created document', async () => {
    await createTrip('user-1', { name: 'New Trip' })
    const [, , , data] = mockCreateDocument.mock.calls[0]
    expect(data.code).toMatch(/^\w+-\w+-\w+$/)
  })

  it('generates a lowercase code', async () => {
    await createTrip('user-1', { name: 'New Trip' })
    const [, , , data] = mockCreateDocument.mock.calls[0]
    expect(data.code).toBe(data.code.toLowerCase())
  })

  it('retries if the first code is already taken', async () => {
    // first code check: taken; second: free
    mockListDocuments
      .mockImplementationOnce(() => Promise.resolve({ documents: [{ $id: 'x' }] }))
      .mockImplementationOnce(() => Promise.resolve({ documents: [] }))
    await createTrip('user-1', { name: 'New Trip' })
    expect(mockListDocuments).toHaveBeenCalledTimes(2)
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
  })

  it('throws after 100 failed attempts', async () => {
    mockListDocuments.mockImplementation(() =>
      Promise.resolve({ documents: [{ $id: 'x' }] })
    )
    await expect(createTrip('user-1', { name: 'New Trip' })).rejects.toThrow(
      'Could not generate a unique trip code after 100 attempts.'
    )
    expect(mockListDocuments).toHaveBeenCalledTimes(100)
    expect(mockCreateDocument).not.toHaveBeenCalled()
    mockListDocuments.mockImplementation(() => Promise.resolve({ documents: [] }))
  })

  it('returns the new trip', async () => {
    const result = await createTrip('user-1', { name: 'New Trip', description: '' })
    expect(result.$id).toBe('new-id')
  })

  it('propagates createDocument errors', async () => {
    mockCreateDocument.mockImplementationOnce(() => Promise.reject(new Error('Create failed')))
    await expect(createTrip('user-1', { name: 'Trip' })).rejects.toThrow('Create failed')
  })
})

describe('updateTrip', () => {
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

describe('joinTrip', () => {
  it('creates a participation record when none exists', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.resolve({ documents: [] }))
    await joinTrip('user-1', 'trip-1')
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
  })

  it('throws when the user has already joined the trip', async () => {
    mockListDocuments.mockImplementationOnce(() =>
      Promise.resolve({ documents: [{ $id: 'p-1', userId: 'user-1', tripId: 'trip-1' }] })
    )
    await expect(joinTrip('user-1', 'trip-1')).rejects.toThrow('You have already joined this trip.')
    expect(mockCreateDocument).not.toHaveBeenCalled()
  })
})

describe('leaveTrip', () => {
  it('deletes the participation record when it exists', async () => {
    mockListDocuments.mockImplementationOnce(() =>
      Promise.resolve({ documents: [{ $id: 'p-1', userId: 'user-1', tripId: 'trip-1' }] })
    )
    await leaveTrip('user-1', 'trip-1')
    expect(mockDeleteDocument).toHaveBeenCalledTimes(1)
    const [, , deletedId] = mockDeleteDocument.mock.calls[0]
    expect(deletedId).toBe('p-1')
  })

  it('throws when no participation record is found', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.resolve({ documents: [] }))
    await expect(leaveTrip('user-1', 'trip-1')).rejects.toThrow('Participation record not found.')
    expect(mockDeleteDocument).not.toHaveBeenCalled()
  })

  it('propagates errors', async () => {
    mockListDocuments.mockImplementationOnce(() =>
      Promise.resolve({ documents: [{ $id: 'p-1' }] })
    )
    mockDeleteDocument.mockImplementationOnce(() => Promise.reject(new Error('Delete failed')))
    await expect(leaveTrip('user-1', 'trip-1')).rejects.toThrow('Delete failed')
  })
})

describe('listParticipatedTrips', () => {
  it('returns an empty array when the user has no participations', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.resolve({ documents: [] }))
    const result = await listParticipatedTrips('user-1')
    expect(result).toEqual([])
    expect(mockListDocuments).toHaveBeenCalledTimes(1)
  })

  it('fetches and returns trips for each participation', async () => {
    mockListDocuments
      .mockImplementationOnce(() =>
        Promise.resolve({ documents: [{ $id: 'p-1', userId: 'user-1', tripId: 'trip-1' }] })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ documents: [{ $id: 'trip-1', name: 'Ski Alps' }] })
      )
    const result = await listParticipatedTrips('user-1')
    expect(mockListDocuments).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(1)
    expect(result[0].$id).toBe('trip-1')
  })

  it('propagates errors from the first query', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
    await expect(listParticipatedTrips('user-1')).rejects.toThrow('Network error')
  })
})

describe('getUserById', () => {
  it('fetches user data and returns the parsed JSON', async () => {
    global.fetch = mock(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ $id: 'u-1', name: 'Alice' }) })
    )
    const result = await getUserById('u-1')
    expect(result.name).toBe('Alice')
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('throws when the response is not ok', async () => {
    global.fetch = mock(() => Promise.resolve({ ok: false }))
    await expect(getUserById('u-1')).rejects.toThrow('Failed to fetch user')
  })
})

describe('deleteTrip', () => {
  it('deletes participants then the trip', async () => {
    mockListDocuments.mockImplementationOnce(() =>
      Promise.resolve({ documents: [{ $id: 'p-1' }, { $id: 'p-2' }] })
    )
    await deleteTrip('trip-1')
    expect(mockDeleteDocument).toHaveBeenCalledTimes(3)
  })

  it('deletes the trip even when there are no participants', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.resolve({ documents: [] }))
    await deleteTrip('trip-1')
    expect(mockDeleteDocument).toHaveBeenCalledTimes(1)
  })

  it('propagates errors', async () => {
    mockListDocuments.mockImplementationOnce(() => Promise.resolve({ documents: [] }))
    mockDeleteDocument.mockImplementationOnce(() => Promise.reject(new Error('Delete failed')))
    await expect(deleteTrip('trip-1')).rejects.toThrow('Delete failed')
  })
})
