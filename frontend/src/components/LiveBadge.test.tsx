import { render, screen } from '@testing-library/react'
import { LiveBadge } from './LiveBadge'

// Mock the eventUtils module
jest.mock('@/lib/eventUtils', () => ({
  getEventTimingStatus: jest.fn()
}))

import { getEventTimingStatus } from '@/lib/eventUtils'

const mockGetEventTimingStatus = getEventTimingStatus as jest.MockedFunction<typeof getEventTimingStatus>

describe('LiveBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders LIVE badge when event status is "now"', () => {
    mockGetEventTimingStatus.mockReturnValue('now')
    
    render(
      <LiveBadge 
        dateTime="2025-06-24T15:00:00Z" 
        endTime="2025-06-24T18:00:00Z" 
        durationType="specific_time" 
      />
    )
    
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(mockGetEventTimingStatus).toHaveBeenCalledWith(
      "2025-06-24T15:00:00Z",
      "2025-06-24T18:00:00Z",
      "specific_time"
    )
  })

  it('does not render when event status is not "now"', () => {
    mockGetEventTimingStatus.mockReturnValue('future')
    
    render(
      <LiveBadge 
        dateTime="2025-06-25T15:00:00Z" 
      />
    )
    
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
  })

  it('handles missing endTime and durationType', () => {
    mockGetEventTimingStatus.mockReturnValue('now')
    
    render(
      <LiveBadge 
        dateTime="2025-06-24T15:00:00Z" 
      />
    )
    
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(mockGetEventTimingStatus).toHaveBeenCalledWith(
      "2025-06-24T15:00:00Z",
      undefined,
      undefined
    )
  })

  it('applies custom className', () => {
    mockGetEventTimingStatus.mockReturnValue('now')
    
    const { container } = render(
      <LiveBadge 
        dateTime="2025-06-24T15:00:00Z" 
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
