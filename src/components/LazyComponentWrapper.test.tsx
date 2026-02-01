import React, { Suspense } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LazyComponentWrapper, createLazyComponent } from './LazyComponentWrapper';

// Mock component for testing
const MockComponent = ({ onLoad }: { onLoad?: () => void }) => {
  React.useEffect(() => {
    onLoad?.();
  }, [onLoad]);
  return <div>Mock Component Loaded</div>;
};

// Create a lazy version of the mock component
const LazyMockComponent = React.lazy(() =>
  Promise.resolve({ default: MockComponent })
);

describe('LazyComponentWrapper Component', () => {
  /**
   * Test: LazyComponentWrapper renders loading skeleton while loading
   * Validates: Requirements 2.2, 2.3
   */
  it('should render loading skeleton while component is loading', async () => {
    // Create a component that takes time to load
    const SlowComponent = React.lazy(
      () => new Promise(resolve =>
        setTimeout(() => resolve({ default: MockComponent }), 100)
      )
    );

    render(
      <LazyComponentWrapper
        component={SlowComponent}
        skeletonHeight="h-32"
      />
    );

    // Should show loading skeleton initially
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Mock Component Loaded')).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyComponentWrapper renders component after loading
   * Validates: Requirements 2.2
   */
  it('should render component after loading', async () => {
    render(
      <LazyComponentWrapper
        component={LazyMockComponent}
        componentProps={{ onLoad: jest.fn() }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Component Loaded')).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyComponentWrapper passes props to component
   * Validates: Requirements 2.2
   */
  it('should pass props to lazy component', async () => {
    const TestComponent = ({ testProp }: { testProp: string }) => (
      <div>{testProp}</div>
    );

    const LazyTestComponent = React.lazy(() =>
      Promise.resolve({ default: TestComponent })
    );

    render(
      <LazyComponentWrapper
        component={LazyTestComponent}
        componentProps={{ testProp: 'Test Value' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyComponentWrapper calls onLoad callback
   * Validates: Requirements 2.2
   */
  it('should call onLoad callback when component loads', async () => {
    const onLoad = jest.fn();

    render(
      <LazyComponentWrapper
        component={LazyMockComponent}
        onLoad={onLoad}
      />
    );

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  /**
   * Test: LazyComponentWrapper handles errors with error boundary
   * Validates: Requirements 2.3
   */
  it('should handle component errors with error boundary', async () => {
    const ErrorComponent = () => {
      throw new Error('Component error');
    };

    const LazyErrorComponent = React.lazy(() =>
      Promise.resolve({ default: ErrorComponent })
    );

    render(
      <LazyComponentWrapper
        component={LazyErrorComponent}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load component/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyComponentWrapper shows retry button on error
   * Validates: Requirements 2.2.4
   */
  it('should show retry button on error when retry is enabled', async () => {
    const ErrorComponent = () => {
      throw new Error('Component error');
    };

    const LazyErrorComponent = React.lazy(() =>
      Promise.resolve({ default: ErrorComponent })
    );

    render(
      <LazyComponentWrapper
        component={LazyErrorComponent}
        enableRetry={true}
        maxRetries={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyComponentWrapper uses custom loading fallback
   * Validates: Requirements 2.2
   */
  it('should use custom loading fallback', async () => {
    const SlowComponent = React.lazy(
      () => new Promise(resolve =>
        setTimeout(() => resolve({ default: MockComponent }), 100)
      )
    );

    const customFallback = <div>Custom Loading...</div>;

    render(
      <LazyComponentWrapper
        component={SlowComponent}
        loadingFallback={customFallback}
      />
    );

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Mock Component Loaded')).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyComponentWrapper uses custom error fallback
   * Validates: Requirements 2.3
   */
  it('should use custom error fallback', async () => {
    const ErrorComponent = () => {
      throw new Error('Component error');
    };

    const LazyErrorComponent = React.lazy(() =>
      Promise.resolve({ default: ErrorComponent })
    );

    const customErrorFallback = (error: Error) => (
      <div>Custom Error: {error.message}</div>
    );

    render(
      <LazyComponentWrapper
        component={LazyErrorComponent}
        errorFallback={customErrorFallback}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Custom Error: Component error/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyComponentWrapper applies custom className
   * Validates: Requirements 2.2
   */
  it('should apply custom className', async () => {
    const SlowComponent = React.lazy(
      () => new Promise(resolve =>
        setTimeout(() => resolve({ default: MockComponent }), 50)
      )
    );

    const { container } = render(
      <LazyComponentWrapper
        component={SlowComponent}
        className="custom-wrapper-class"
      />
    );

    const wrapper = container.querySelector('.custom-wrapper-class');
    expect(wrapper).toBeInTheDocument();
  });

  /**
   * Test: LazyComponentWrapper calls onError callback on error
   * Validates: Requirements 2.3
   */
  it('should call onError callback when component fails to load', async () => {
    const onError = jest.fn();
    const ErrorComponent = () => {
      throw new Error('Component error');
    };

    const LazyErrorComponent = React.lazy(() =>
      Promise.resolve({ default: ErrorComponent })
    );

    render(
      <LazyComponentWrapper
        component={LazyErrorComponent}
        onError={onError}
      />
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});

describe('createLazyComponent Utility', () => {
  /**
   * Test: createLazyComponent creates wrapped lazy component
   * Validates: Requirements 2.2
   */
  it('should create a wrapped lazy component', async () => {
    const LazyComponent = createLazyComponent(
      () => Promise.resolve({ default: MockComponent }),
      { skeletonHeight: 'h-48' }
    );

    render(<LazyComponent />);

    await waitFor(() => {
      expect(screen.getByText('Mock Component Loaded')).toBeInTheDocument();
    });
  });

  /**
   * Test: createLazyComponent passes options to wrapper
   * Validates: Requirements 2.2
   */
  it('should pass options to LazyComponentWrapper', async () => {
    const SlowComponent = React.lazy(
      () => new Promise(resolve =>
        setTimeout(() => resolve({ default: MockComponent }), 50)
      )
    );

    const LazyComponent = createLazyComponent(
      () => Promise.resolve({ default: MockComponent }),
      {
        skeletonHeight: 'h-64',
        enableRetry: true,
        maxRetries: 5,
      }
    );

    render(<LazyComponent />);

    await waitFor(() => {
      expect(screen.getByText('Mock Component Loaded')).toBeInTheDocument();
    });
  });
});
