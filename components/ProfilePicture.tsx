import React from 'react';
import Image, { ImageProps } from 'next/image';

interface ProfilePictureProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt = 'Profile Picture',
  size = 48,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        priority={true}
        {...props}
      />
    </div>
  );
};

export default ProfilePicture;