import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LazyImage, LazyVideo, ResponsiveImage, ImageGallery } from './lazyMedia';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('LazyImage Component', () => {
  /**
   * Test: LazyImage renders with lazy loading
   * Validates: Requirements 6.1, 6.3
   */
  it('should render image with lazy loading', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={400}
        height={300}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  /**
   * Test: LazyImage renders with blur placeholder
   * Validates: Requirements 6.1, 4.4
   */
  it('should render with blur placeholder', () => {
    const blurDataURL = 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E';
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        blurDataURL={blurDataURL}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('placeholder', 'blur');
  });

  /**
   * Test: LazyImage calls onLoad callback
   * Validates: Requirements 6.1
   */
  it('should call onLoad callback when image loads', async () => {
    const onLoad = jest.fn();
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        onLoad={onLoad}
      />
    );

    const img = screen.getByAltText('Test image');
    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  /**
   * Test: LazyImage handles errors
   * Validates: Requirements 6.1
   */
  it('should handle image load errors', async () => {
    const onError = jest.fn();
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        onError={onError}
      />
    );

    const img = screen.getByAltText('Test image');
    fireEvent.error(img);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      expect(screen.getByText(/Image failed to load/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: LazyImage respects priority prop
   * Validates: Requirements 6.1
   */
  it('should use eager loading when priority is true', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  /**
   * Test: LazyImage applies custom className
   * Validates: Requirements 6.1
   */
  it('should apply custom className', () => {
    const { container } = render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });
});

describe('LazyVideo Component', () => {
  /**
   * Test: LazyVideo renders with lazy loading
   * Validates: Requirements 6.2
   */
  it('should render video with lazy loading', () => {
    render(
      <LazyVideo
        src="/test-video.mp4"
        poster="/poster.jpg"
      />
    );

    const video = screen.getByRole('img', { hidden: true }) as HTMLVideoElement;
    expect(video).toHaveAttribute('loading', 'lazy');
  });

  /**
   * Test: LazyVideo renders with poster image
   * Validates: Requirements 6.2, 4.4
   */
  it('should render with poster image', () => {
    const { container } = render(
      <LazyVideo
        src="/test-video.mp4"
        poster="/poster.jpg"
      />
    );

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('poster', '/poster.jpg');
  });

  /**
   * Test: LazyVideo uses intersection observer
   * Validates: Requirements 6.2
   */
  it('should use intersection observer for autoplay', () => {
    const { container } = render(
      <LazyVideo
        src="/test-video.mp4"
        autoPlay={true}
        useIntersectionObserver={true}
      />
    );

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  /**
   * Test: LazyVideo handles errors
   * Validates: Requirements 6.2
   */
  it('should handle video load errors', async () => {
    const onError = jest.fn();
    const { container } = render(
      <LazyVideo
        src="/test-video.mp4"
        onError={onError}
      />
    );

    const video = container.querySelector('video');
    if (video) {
      fireEvent.error(video);
    }

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  /**
   * Test: LazyVideo respects controls prop
   * Validates: Requirements 6.2
   */
  it('should render with controls when enabled', () => {
    const { container } = render(
      <LazyVideo
        src="/test-video.mp4"
        controls={true}
      />
    );

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('controls');
  });

  /**
   * Test: LazyVideo respects muted prop
   * Validates: Requirements 6.2
   */
  it('should render muted when enabled', () => {
    const { container } = render(
      <LazyVideo
        src="/test-video.mp4"
        muted={true}
      />
    );

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('muted');
  });
});

describe('ResponsiveImage Component', () => {
  /**
   * Test: ResponsiveImage renders with responsive sources
   * Validates: Requirements 6.3
   */
  it('should render responsive image', () => {
    render(
      <ResponsiveImage
        src="/desktop.jpg"
        alt="Responsive image"
        srcSet={{
          mobile: '/mobile.jpg',
          tablet: '/tablet.jpg',
          desktop: '/desktop.jpg',
        }}
      />
    );

    const img = screen.getByAltText('Responsive image');
    expect(img).toBeInTheDocument();
  });

  /**
   * Test: ResponsiveImage applies responsive sizes
   * Validates: Requirements 6.3
   */
  it('should apply responsive sizes', () => {
    render(
      <ResponsiveImage
        src="/desktop.jpg"
        alt="Responsive image"
        sizes="(max-width: 640px) 100vw, 50vw"
      />
    );

    const img = screen.getByAltText('Responsive image');
    expect(img).toHaveAttribute('sizes', '(max-width: 640px) 100vw, 50vw');
  });
});

describe('ImageGallery Component', () => {
  /**
   * Test: ImageGallery renders all images
   * Validates: Requirements 6.1, 6.3
   */
  it('should render all images in gallery', () => {
    const images = ['/img1.jpg', '/img2.jpg', '/img3.jpg'];
    const alts = ['Image 1', 'Image 2', 'Image 3'];

    render(
      <ImageGallery
        images={images}
        alts={alts}
      />
    );

    alts.forEach(alt => {
      expect(screen.getByAltText(alt)).toBeInTheDocument();
    });
  });

  /**
   * Test: ImageGallery applies grid layout
   * Validates: Requirements 6.1, 6.3
   */
  it('should apply grid layout classes', () => {
    const { container } = render(
      <ImageGallery
        images={['/img1.jpg', '/img2.jpg']}
        gridCols="grid-cols-2"
        gap="gap-2"
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2', 'gap-2');
  });

  /**
   * Test: ImageGallery lazy-loads all images
   * Validates: Requirements 6.1, 6.3
   */
  it('should lazy-load all gallery images', () => {
    const images = ['/img1.jpg', '/img2.jpg', '/img3.jpg'];

    render(
      <ImageGallery images={images} />
    );

    const imgs = screen.getAllByRole('img');
    imgs.forEach(img => {
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  /**
   * Test: ImageGallery applies blur placeholders
   * Validates: Requirements 6.1, 4.4
   */
  it('should apply blur placeholders to all images', () => {
    const blurDataURL = 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E';
    render(
      <ImageGallery
        images={['/img1.jpg', '/img2.jpg']}
        blurDataURL={blurDataURL}
      />
    );

    const imgs = screen.getAllByRole('img');
    imgs.forEach(img => {
      expect(img).toHaveAttribute('placeholder', 'blur');
    });
  });
});
