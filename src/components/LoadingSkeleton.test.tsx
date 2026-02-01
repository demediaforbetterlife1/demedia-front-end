import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton, SkeletonGroup } from './LoadingSkeleton';

describe('LoadingSkeleton Component', () => {
  /**
   * Test: LoadingSkeleton renders with default props
   * Validates: Requirements 2.1
   */
  it('should render with default props', () => {
    render(<LoadingSkeleton />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  /**
   * Test: LoadingSkeleton applies custom height and width
   * Validates: Requirements 2.1.3
   */
  it('should apply custom height and width', () => {
    render(
      <LoadingSkeleton
        height="h-64"
        width="w-96"
      />
    );
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('h-64', 'w-96');
  });

  /**
   * Test: LoadingSkeleton renders text variant with multiple lines
   * Validates: Requirements 2.1.1, 2.1.3
   */
  it('should render text variant with multiple lines', () => {
    render(
      <LoadingSkeleton
        variant="text"
        lines={3}
      />
    );
    
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(1); // Parent container
    expect(skeletons[0]).toHaveClass('space-y-2');
  });

  /**
   * Test: LoadingSkeleton renders circular variant
   * Validates: Requirements 2.1.1
   */
  it('should render circular variant', () => {
    render(
      <LoadingSkeleton
        variant="circular"
        height="h-12"
        width="w-12"
      />
    );
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded-full');
  });

  /**
   * Test: LoadingSkeleton renders rectangular variant
   * Validates: Requirements 2.1.1
   */
  it('should render rectangular variant', () => {
    render(
      <LoadingSkeleton
        variant="rectangular"
        height="h-32"
        width="w-full"
      />
    );
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded-lg');
  });

  /**
   * Test: LoadingSkeleton has accessibility attributes
   * Validates: Requirements 2.1.4
   */
  it('should have accessibility attributes', () => {
    const ariaLabel = 'Loading user profile';
    render(
      <LoadingSkeleton
        ariaLabel={ariaLabel}
      />
    );
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', ariaLabel);
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  /**
   * Test: LoadingSkeleton applies custom className
   * Validates: Requirements 2.1.3
   */
  it('should apply custom className', () => {
    render(
      <LoadingSkeleton
        className="custom-class"
      />
    );
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('SkeletonGroup Component', () => {
  /**
   * Test: SkeletonGroup renders correct number of items
   * Validates: Requirements 2.1
   */
  it('should render correct number of skeleton items', () => {
    render(
      <SkeletonGroup count={5} />
    );
    
    const container = screen.getByRole('status');
    const children = container.children;
    expect(children).toHaveLength(5);
  });

  /**
   * Test: SkeletonGroup applies grid layout
   * Validates: Requirements 2.1.3
   */
  it('should apply grid layout classes', () => {
    render(
      <SkeletonGroup
        count={3}
        gridCols="grid-cols-3"
        gap="gap-6"
      />
    );
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('grid', 'grid-cols-3', 'gap-6');
  });

  /**
   * Test: SkeletonGroup applies custom item dimensions
   * Validates: Requirements 2.1.3
   */
  it('should apply custom item dimensions', () => {
    render(
      <SkeletonGroup
        count={2}
        itemHeight="h-48"
        itemWidth="w-64"
      />
    );
    
    const container = screen.getByRole('status');
    const items = container.children;
    
    items.forEach(item => {
      expect(item).toHaveClass('h-48', 'w-64');
    });
  });

  /**
   * Test: SkeletonGroup applies variant to all items
   * Validates: Requirements 2.1.1
   */
  it('should apply variant to all items', () => {
    render(
      <SkeletonGroup
        count={3}
        variant="circular"
      />
    );
    
    const container = screen.getByRole('status');
    const items = container.children;
    
    items.forEach(item => {
      expect(item).toHaveClass('rounded-full');
    });
  });

  /**
   * Test: SkeletonGroup has accessibility attributes
   * Validates: Requirements 2.1.4
   */
  it('should have accessibility attributes', () => {
    render(
      <SkeletonGroup count={4} />
    );
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-busy', 'true');
    expect(container).toHaveAttribute('aria-label', 'Loading multiple items');
  });
});
