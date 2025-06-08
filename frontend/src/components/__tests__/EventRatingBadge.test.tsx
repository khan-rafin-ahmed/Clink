import { render, screen } from '@testing-library/react'
import { EventRatingBadge } from '../EventRatingBadge'

describe('EventRatingBadge', () => {
  it('renders rating badge with correct data', () => {
    render(
      <EventRatingBadge
        averageRating={4.5}
        reviewCount={12}
        size="md"
      />
    )

    // Check if rating number is displayed
    expect(screen.getByText('4.5')).toBeInTheDocument()
    
    // Check if review count is displayed
    expect(screen.getByText('(12)')).toBeInTheDocument()
    
    // Check if stars are rendered (should have 5 star elements)
    const stars = screen.getAllByTestId(/star-icon/)
    expect(stars).toHaveLength(5)
  })

  it('does not render when no ratings', () => {
    const { container } = render(
      <EventRatingBadge
        averageRating={0}
        reviewCount={0}
        size="md"
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders different sizes correctly', () => {
    const { rerender } = render(
      <EventRatingBadge
        averageRating={4.2}
        reviewCount={8}
        size="sm"
      />
    )

    expect(screen.getByText('4.2')).toHaveClass('text-sm')

    rerender(
      <EventRatingBadge
        averageRating={4.2}
        reviewCount={8}
        size="lg"
      />
    )

    expect(screen.getByText('4.2')).toHaveClass('text-lg')
  })

  it('hides info icon when showInfo is false', () => {
    render(
      <EventRatingBadge
        averageRating={3.8}
        reviewCount={5}
        size="md"
        showInfo={false}
      />
    )

    // Info icon should not be present
    expect(screen.queryByTestId('info-icon')).not.toBeInTheDocument()
  })
})
